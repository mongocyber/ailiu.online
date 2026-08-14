#!/bin/sh

set -eu

umask 077

PROGRAM=ailiu-site-monitor
SITE_HOST=${SITE_HOST:-ailiu.online}
SITE_BASE_URL=${SITE_BASE_URL:-https://ailiu.online}
MONITOR_STATE_DIR=${MONITOR_STATE_DIR:-/var/lib/ailiu-monitor}
DEPLOYMENT_ID_FILE=${DEPLOYMENT_ID_FILE:-/etc/ailiu-monitor/current-deployment-id}
ALERT_CURL_CONFIG_FILE=${ALERT_CURL_CONFIG_FILE:-}
HEARTBEAT_CURL_CONFIG_FILE=${HEARTBEAT_CURL_CONFIG_FILE:-}
MONITOR_EVENT_SINK=${MONITOR_EVENT_SINK:-}
HTTP_TIMEOUT_MAX_SECONDS=4
HTTP_TIMEOUT_SECONDS=${HTTP_TIMEOUT_SECONDS:-$HTTP_TIMEOUT_MAX_SECONDS}
DELIVERY_TIMEOUT_SECONDS=4
WATCHDOG_KILL_GRACE_SECONDS=1
FAILURE_THRESHOLD=3

MODE=live
FIXTURE_DIR=
DRY_RUN=0
LOCK_HELD=0
SCRATCH_DIR=
STATE_TMP=
ACTIVE_CHILD_PID=
ACTIVE_COMMAND_WATCHDOG_PID=

log() {
  printf '%s %s\n' "$PROGRAM" "$1"
}

die_internal() {
  log "status=UNKNOWN_INTERNAL reason=$1"
  exit 2
}

is_uint() {
  case ${1:-} in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

is_safe_path() {
  case ${1:-} in
    /*) ;;
    *) return 1 ;;
  esac
  case "/$1/" in
    */../*|*/./*) return 1 ;;
  esac
  case $1 in
    */|*//*) return 1 ;;
  esac
  test "$1" != "/"
}

path_components_are_safe() {
  path_to_check=$1
  path_remaining=${path_to_check#/}
  path_current=
  while test -n "$path_remaining"
  do
    path_component=${path_remaining%%/*}
    case $path_remaining in
      */*) path_remaining=${path_remaining#*/} ;;
      *) path_remaining= ;;
    esac
    test -n "$path_component" || return 1
    path_current="$path_current/$path_component"
    test ! -L "$path_current" || return 1
    if test -n "$path_remaining" && test -e "$path_current"; then
      test -d "$path_current" || return 1
    fi
  done
  return 0
}

sanitize_detail() {
  printf '%s' "$1" |
    LC_ALL=C command -p tr '\r\n\t|' '    ' |
    LC_ALL=C command -p cut -c 1-240
}

json_escape() {
  printf '%s' "$1" | command -p awk '
    BEGIN { ORS = "" }
    {
      gsub(/\\/, "\\\\")
      gsub(/\"/, "\\\"")
      if (NR > 1) printf "\\n"
      printf "%s", $0
    }
  '
}

cleanup() {
  if test -n "$ACTIVE_COMMAND_WATCHDOG_PID"; then
    kill -TERM "$ACTIVE_COMMAND_WATCHDOG_PID" 2>/dev/null || true
    wait "$ACTIVE_COMMAND_WATCHDOG_PID" 2>/dev/null || true
    ACTIVE_COMMAND_WATCHDOG_PID=
  fi
  if test -n "$ACTIVE_CHILD_PID"; then
    kill -TERM "$ACTIVE_CHILD_PID" 2>/dev/null || true
    kill -9 "$ACTIVE_CHILD_PID" 2>/dev/null || true
    wait "$ACTIVE_CHILD_PID" 2>/dev/null || true
    ACTIVE_CHILD_PID=
  fi
  if test "$LOCK_HELD" -eq 1; then
    command -p rmdir "$MONITOR_STATE_DIR/.lock" 2>/dev/null || true
  fi
  if test -n "$SCRATCH_DIR"; then
    command -p rm -rf "$SCRATCH_DIR"
  fi
  if test -n "$STATE_TMP"; then
    command -p rm -f "$STATE_TMP"
  fi
}

handle_signal() {
  log "status=UNKNOWN_INTERNAL reason=interrupted"
  exit 2
}

trap cleanup EXIT
trap handle_signal HUP INT TERM

usage() {
  command -p cat <<'EOF'
Usage:
  check-site.sh
  check-site.sh --fixture /absolute/path/to/raw-fixture
  check-site.sh --dry-run /absolute/path/to/raw-fixture

The fixture directory contains raw transport facts only. Fixture and dry-run
modes never perform DNS, TLS, HTTP, alert, or heartbeat network calls.
EOF
}

case $# in
  0) ;;
  2)
    case $1 in
      --fixture)
        MODE=fixture
        FIXTURE_DIR=$2
        ;;
      --dry-run)
        MODE=fixture
        FIXTURE_DIR=$2
        DRY_RUN=1
        ;;
      *) usage >&2; exit 2 ;;
    esac
    ;;
  *) usage >&2; exit 2 ;;
esac

test "$SITE_HOST" = "ailiu.online" ||
  die_internal "site_host_must_be_canonical"
test "$SITE_BASE_URL" = "https://ailiu.online" ||
  die_internal "site_base_url_must_be_canonical_https"
is_uint "$HTTP_TIMEOUT_SECONDS" || die_internal "invalid_http_timeout"
test "$HTTP_TIMEOUT_SECONDS" -ge 1 &&
  test "$HTTP_TIMEOUT_SECONDS" -le "$HTTP_TIMEOUT_MAX_SECONDS" ||
  die_internal "http_timeout_out_of_range"
is_safe_path "$MONITOR_STATE_DIR" || die_internal "unsafe_state_directory"
path_components_are_safe "$MONITOR_STATE_DIR" ||
  die_internal "state_path_contains_symlink"

if test "$MODE" = fixture; then
  is_safe_path "$FIXTURE_DIR" || die_internal "unsafe_fixture_directory"
  path_components_are_safe "$FIXTURE_DIR" ||
    die_internal "fixture_path_contains_symlink"
  test -d "$FIXTURE_DIR" && test ! -L "$FIXTURE_DIR" ||
    die_internal "fixture_directory_missing_or_symlink"
  DEPLOYMENT_ID_FILE="$FIXTURE_DIR/deployment-id"
fi
is_safe_path "$DEPLOYMENT_ID_FILE" || die_internal "unsafe_deployment_reference_file"
path_components_are_safe "$DEPLOYMENT_ID_FILE" ||
  die_internal "deployment_reference_path_contains_symlink"

for configured_path in "$ALERT_CURL_CONFIG_FILE" "$HEARTBEAT_CURL_CONFIG_FILE"
do
  test -z "$configured_path" && continue
  is_safe_path "$configured_path" || die_internal "unsafe_delivery_config_path"
  path_components_are_safe "$configured_path" ||
    die_internal "delivery_config_path_contains_symlink"
done

if test -n "$MONITOR_EVENT_SINK"; then
  is_safe_path "$MONITOR_EVENT_SINK" || die_internal "unsafe_event_sink_path"
  path_components_are_safe "$MONITOR_EVENT_SINK" ||
    die_internal "event_sink_path_contains_symlink"
fi

SCRATCH_DIR=$(command -p mktemp -d "${TMPDIR:-/tmp}/ailiu-monitor.XXXXXX")
RESULTS_FILE="$SCRATCH_DIR/results"
: > "$RESULTS_FILE"

append_result() {
  result_id=$1
  result_status=$2
  result_class=$3
  result_latency=$4
  result_detail=$(sanitize_detail "$5")
  is_uint "$result_latency" || die_internal "non_numeric_latency"
  test -n "$result_detail" || result_detail=UNKNOWN
  printf '%s|%s|%s|%s|%s\n' \
    "$result_id" "$result_status" "$result_class" \
    "$result_latency" "$result_detail" >> "$RESULTS_FILE"
}

fixture_value() {
  fixture_name=$1
  fixture_file="$FIXTURE_DIR/$fixture_name"
  test -f "$fixture_file" && test ! -L "$fixture_file" ||
    die_internal "missing_raw_fixture_$fixture_name"
  fixture_lines=$(command -p awk 'END { print NR + 0 }' "$fixture_file")
  test "$fixture_lines" -eq 1 || die_internal "noncanonical_raw_fixture_$fixture_name"
  IFS= read -r fixture_result < "$fixture_file" || true
  printf '%s' "$fixture_result"
}

elapsed_ms() {
  elapsed_start=$1
  elapsed_end=$2
  is_uint "$elapsed_start" || elapsed_start=0
  is_uint "$elapsed_end" || elapsed_end=$elapsed_start
  elapsed_delta=$((elapsed_end - elapsed_start))
  test "$elapsed_delta" -ge 0 || elapsed_delta=0
  printf '%s' $((elapsed_delta * 1000))
}

run_bounded_command() {
  bounded_seconds=$1
  shift
  "$@" &
  ACTIVE_CHILD_PID=$!
  (
    watchdog_sleep_pid=
    stop_watchdog_sleep() {
      if test -n "$watchdog_sleep_pid"; then
        kill -TERM "$watchdog_sleep_pid" 2>/dev/null || true
        wait "$watchdog_sleep_pid" 2>/dev/null || true
      fi
      exit 0
    }
    trap stop_watchdog_sleep HUP INT TERM
    command -p sleep "$bounded_seconds" &
    watchdog_sleep_pid=$!
    wait "$watchdog_sleep_pid" || exit 0
    watchdog_sleep_pid=
    kill -TERM "$ACTIVE_CHILD_PID" 2>/dev/null || true
    command -p sleep "$WATCHDOG_KILL_GRACE_SECONDS" &
    watchdog_sleep_pid=$!
    wait "$watchdog_sleep_pid" || exit 0
    watchdog_sleep_pid=
    kill -9 "$ACTIVE_CHILD_PID" 2>/dev/null || true
  ) &
  ACTIVE_COMMAND_WATCHDOG_PID=$!
  if wait "$ACTIVE_CHILD_PID"; then
    bounded_rc=0
  else
    bounded_rc=$?
  fi
  kill -TERM "$ACTIVE_COMMAND_WATCHDOG_PID" 2>/dev/null || true
  wait "$ACTIVE_COMMAND_WATCHDOG_PID" 2>/dev/null || true
  ACTIVE_COMMAND_WATCHDOG_PID=
  ACTIVE_CHILD_PID=
  return "$bounded_rc"
}

run_dns_check() {
  dns_start=$(command -p date +%s)
  if test "$MODE" = fixture; then
    dns_exit=$(fixture_value dns.exit)
    dns_output=$(fixture_value dns.output)
  else
    command -v getent >/dev/null 2>&1 || die_internal "getent_required"
    dns_output_file="$SCRATCH_DIR/dns.out"
    if run_bounded_command "$HTTP_TIMEOUT_SECONDS" \
      getent ahosts "$SITE_HOST" > "$dns_output_file" 2>/dev/null
    then
      dns_exit=0
    else
      dns_exit=$?
    fi
    dns_output=$(command -p sed -n '1p' "$dns_output_file")
  fi
  dns_end=$(command -p date +%s)
  dns_latency=$(elapsed_ms "$dns_start" "$dns_end")
  is_uint "$dns_exit" || die_internal "invalid_dns_exit"
  if test "$dns_exit" -eq 0 && test -n "$dns_output"; then
    append_result dns ok NONE "$dns_latency" "resolved=$dns_output"
  else
    append_result dns fail DNS "$dns_latency" "resolver_exit=$dns_exit"
  fi
}

run_tls_check() {
  tls_start=$(command -p date +%s)
  if test "$MODE" = fixture; then
    tls_exit=$(fixture_value tls.exit)
    tls_valid=$(fixture_value tls.valid)
    tls_summary=$(fixture_value tls.summary)
  else
    command -v curl >/dev/null 2>&1 || die_internal "curl_required"
    tls_meta="$SCRATCH_DIR/tls.meta"
    if run_bounded_command "$HTTP_TIMEOUT_SECONDS" curl \
      --disable \
      --silent \
      --show-error \
      --proto '=https' \
      --tlsv1.2 \
      --connect-timeout "$HTTP_TIMEOUT_SECONDS" \
      --max-time "$HTTP_TIMEOUT_SECONDS" \
      --output /dev/null \
      --write-out '%{ssl_verify_result}|%{http_code}' \
      "$SITE_BASE_URL/" > "$tls_meta" 2>/dev/null
    then
      tls_exit=0
      IFS='|' read -r tls_verify_result tls_http_status < "$tls_meta" || true
      if test "${tls_verify_result:-}" = 0; then
        tls_valid=1
      else
        tls_valid=0
      fi
      tls_summary="ssl_verify_result=${tls_verify_result:-UNKNOWN} http_status=${tls_http_status:-UNKNOWN}"
    else
      tls_exit=$?
      tls_valid=0
      tls_summary=tls_probe_failed
    fi
  fi
  tls_end=$(command -p date +%s)
  tls_latency=$(elapsed_ms "$tls_start" "$tls_end")
  is_uint "$tls_exit" || die_internal "invalid_tls_exit"
  case $tls_valid in 0|1) ;; *) die_internal "invalid_tls_validity" ;; esac
  if test "$tls_exit" -eq 0 && test "$tls_valid" -eq 1; then
    append_result tls ok NONE "$tls_latency" "certificate_valid=$tls_summary"
  else
    append_result tls fail TLS "$tls_latency" "tls_exit=$tls_exit valid=$tls_valid"
  fi
  : "$tls_summary"
}

route_fixture_prefix() {
  case $1 in
    home) printf '%s' home ;;
    aviso) printf '%s' aviso ;;
    xiaoyi) printf '%s' xiaoyi ;;
    sitemap) printf '%s' sitemap ;;
    *) die_internal "unknown_route_id" ;;
  esac
}

run_http_check() {
  http_id=$1
  http_path=$2
  http_marker=$3
  http_url="$SITE_BASE_URL$http_path"
  http_body="$SCRATCH_DIR/$http_id.body"
  http_meta="$SCRATCH_DIR/$http_id.meta"
  if test "$MODE" = fixture; then
    http_prefix=$(route_fixture_prefix "$http_id")
    http_exit=$(fixture_value "$http_prefix.curl_exit")
    http_status=$(fixture_value "$http_prefix.status")
    http_latency=$(fixture_value "$http_prefix.latency_ms")
    http_effective=$(fixture_value "$http_prefix.effective_url")
    fixture_body="$FIXTURE_DIR/$http_prefix.body"
    test -f "$fixture_body" && test ! -L "$fixture_body" ||
      die_internal "missing_raw_fixture_$http_prefix.body"
    command -p cp "$fixture_body" "$http_body"
  else
    command -v curl >/dev/null 2>&1 || die_internal "curl_required"
    if run_bounded_command "$HTTP_TIMEOUT_SECONDS" curl \
      --disable \
      --silent \
      --show-error \
      --proto '=https' \
      --tlsv1.2 \
      --connect-timeout "$HTTP_TIMEOUT_SECONDS" \
      --max-time "$HTTP_TIMEOUT_SECONDS" \
      --output "$http_body" \
      --write-out '%{http_code}|%{time_total}|%{url_effective}' \
      "$http_url" > "$http_meta" 2>/dev/null
    then
      http_exit=0
    else
      http_exit=$?
    fi
    IFS='|' read -r http_status http_seconds http_effective < "$http_meta" || true
    http_latency=$(command -p awk -v seconds="${http_seconds:-0}" \
      'BEGIN { if (seconds !~ /^[0-9]+([.][0-9]+)?$/) print 0; else printf "%d", seconds * 1000 }')
  fi
  is_uint "$http_exit" || die_internal "invalid_${http_id}_curl_exit"
  is_uint "$http_latency" || die_internal "invalid_${http_id}_latency"
  if test "$http_exit" -ne 0; then
    case $http_exit in
      6) http_class=DNS ;;
      35|51|53|58|59|60|66|77|80|82|83|90|91) http_class=TLS ;;
      *) http_class=HTTP_TRANSPORT ;;
    esac
    append_result "$http_id" fail "$http_class" "$http_latency" \
      "curl_exit=$http_exit"
    return
  fi
  is_uint "$http_status" || die_internal "invalid_${http_id}_http_status"
  if test "$http_status" != 200; then
    append_result "$http_id" fail HTTP_STATUS "$http_latency" \
      "status=$http_status"
    return
  fi
  if test "$http_effective" != "$http_url"; then
    append_result "$http_id" fail HTTP_STATUS "$http_latency" \
      "unexpected_effective_url"
    return
  fi
  if command -p grep -Fq "$http_marker" "$http_body"; then
    append_result "$http_id" ok NONE "$http_latency" \
      "status=$http_status marker=present"
  else
    append_result "$http_id" fail CONTENT "$http_latency" \
      "status=$http_status marker=missing"
  fi
}

load_deployment_reference() {
  if test -f "$DEPLOYMENT_ID_FILE" && test ! -L "$DEPLOYMENT_ID_FILE"; then
    deployment_lines=$(command -p awk 'END { print NR + 0 }' "$DEPLOYMENT_ID_FILE")
    IFS= read -r deployment_id < "$DEPLOYMENT_ID_FILE" || true
  else
    deployment_lines=0
    deployment_id=
  fi
  case $deployment_id in
    dpl_[A-Za-z0-9]*)
      case $deployment_id in
        *[!A-Za-z0-9_]*) deployment_shape=bad ;;
        *) deployment_shape=ok ;;
      esac
      ;;
    *) deployment_shape=bad ;;
  esac
  if test "$deployment_lines" -eq 1 && test "$deployment_shape" = ok; then
    deployment_reference=$deployment_id
  else
    deployment_reference=UNKNOWN
  fi
}

validate_results_file() {
  results_to_validate=$1
  command -p awk -F '|' '
    BEGIN {
      expected[1] = "dns"; expected[2] = "tls"; expected[3] = "home"
      expected[4] = "aviso"; expected[5] = "xiaoyi"
      expected[6] = "sitemap"
      allowed["NONE"] = allowed["DNS"] = allowed["TLS"] = 1
      allowed["HTTP_TRANSPORT"] = allowed["HTTP_STATUS"] = 1
      allowed["CONTENT"] = 1
    }
    NF != 5 || $1 != expected[NR] || $2 !~ /^(ok|fail)$/ ||
      !allowed[$3] || $4 !~ /^[0-9]+$/ || $5 == "" { exit 1 }
    $2 == "ok" && $3 != "NONE" { exit 1 }
    $2 == "fail" && $3 == "NONE" { exit 1 }
    END { if (NR != 6) exit 1 }
  ' "$results_to_validate" || die_internal "non_canonical_check_results"
}

validate_results() {
  validate_results_file "$RESULTS_FILE"
}

run_checks() {
  run_dns_check
  run_tls_check
  run_http_check home / '<link rel="canonical" href="https://ailiu.online/">'
  run_http_check aviso /projects/aviso '<link rel="canonical" href="https://ailiu.online/projects/aviso">'
  run_http_check xiaoyi /projects/xiaoyi '<link rel="canonical" href="https://ailiu.online/projects/xiaoyi">'
  run_http_check sitemap /sitemap.xml '<loc>https://ailiu.online/</loc>'
  load_deployment_reference
  validate_results
}

failure_classes_from() {
  results_for_classes=$1
  command -p awk -F '|' '
    $2 == "fail" && !seen[$3]++ {
      if (output != "") output = output ","
      output = output $3
    }
    END { if (output == "") print "NONE"; else print output }
  ' "$results_for_classes"
}

failure_classes() {
  failure_classes_from "$RESULTS_FILE"
}

primary_failure() {
  command -p awk -F '|' '
    $2 == "fail" { failed[$3] = 1 }
    END {
      order[1]="DNS"; order[2]="TLS"; order[3]="HTTP_TRANSPORT"
      order[4]="HTTP_STATUS"; order[5]="CONTENT"
      for (i=1; i<=5; i++) if (failed[order[i]]) { print order[i]; exit }
      print "NONE"
    }
  ' "$RESULTS_FILE"
}

clear_alert_snapshot() {
  alert_result_dns=NONE
  alert_result_tls=NONE
  alert_result_home=NONE
  alert_result_aviso=NONE
  alert_result_xiaoyi=NONE
  alert_result_sitemap=NONE
}

clear_recovery_snapshot() {
  recovery_checked_at=NONE
  recovery_deployment_reference=NONE
  recovery_result_dns=NONE
  recovery_result_tls=NONE
  recovery_result_home=NONE
  recovery_result_aviso=NONE
  recovery_result_xiaoyi=NONE
  recovery_result_sitemap=NONE
}

capture_alert_snapshot() {
  alert_result_dns=$(command -p sed -n '1p' "$RESULTS_FILE")
  alert_result_tls=$(command -p sed -n '2p' "$RESULTS_FILE")
  alert_result_home=$(command -p sed -n '3p' "$RESULTS_FILE")
  alert_result_aviso=$(command -p sed -n '4p' "$RESULTS_FILE")
  alert_result_xiaoyi=$(command -p sed -n '5p' "$RESULTS_FILE")
  alert_result_sitemap=$(command -p sed -n '6p' "$RESULTS_FILE")
}

capture_recovery_snapshot() {
  recovery_checked_at=$now_epoch
  recovery_deployment_reference=$deployment_reference
  recovery_result_dns=$(command -p sed -n '1p' "$RESULTS_FILE")
  recovery_result_tls=$(command -p sed -n '2p' "$RESULTS_FILE")
  recovery_result_home=$(command -p sed -n '3p' "$RESULTS_FILE")
  recovery_result_aviso=$(command -p sed -n '4p' "$RESULTS_FILE")
  recovery_result_xiaoyi=$(command -p sed -n '5p' "$RESULTS_FILE")
  recovery_result_sitemap=$(command -p sed -n '6p' "$RESULTS_FILE")
}

materialize_alert_snapshot() {
  ALERT_RESULTS_FILE="$SCRATCH_DIR/alert-results"
  printf '%s\n' \
    "$alert_result_dns" \
    "$alert_result_tls" \
    "$alert_result_home" \
    "$alert_result_aviso" \
    "$alert_result_xiaoyi" \
    "$alert_result_sitemap" > "$ALERT_RESULTS_FILE"
  validate_results_file "$ALERT_RESULTS_FILE"
  test "$(failure_classes_from "$ALERT_RESULTS_FILE")" != NONE ||
    die_internal "healthy_alert_snapshot"
}

materialize_recovery_snapshot() {
  RECOVERY_RESULTS_FILE="$SCRATCH_DIR/recovery-results"
  printf '%s\n' \
    "$recovery_result_dns" \
    "$recovery_result_tls" \
    "$recovery_result_home" \
    "$recovery_result_aviso" \
    "$recovery_result_xiaoyi" \
    "$recovery_result_sitemap" > "$RECOVERY_RESULTS_FILE"
  validate_results_file "$RECOVERY_RESULTS_FILE"
  test "$(failure_classes_from "$RECOVERY_RESULTS_FILE")" = NONE ||
    die_internal "failed_recovery_snapshot"
}

valid_deployment_reference() {
  case $1 in
    UNKNOWN) return 0 ;;
    dpl_[A-Za-z0-9]*)
      case $1 in *[!A-Za-z0-9_]*) return 1 ;; esac
      return 0
      ;;
    *) return 1 ;;
  esac
}

load_state() {
  consecutive_failures=0
  incident_open=0
  incident_event_id=NONE
  incident_started_at=NONE
  incident_deployment_reference=NONE
  alert_delivered=0
  recovery_pending=0
  clear_alert_snapshot
  clear_recovery_snapshot
  STATE_FILE="$MONITOR_STATE_DIR/state"
  if test -L "$STATE_FILE"; then
    die_internal "unsafe_state_file"
  fi
  if test ! -e "$STATE_FILE"; then
    return
  fi
  test -f "$STATE_FILE" || die_internal "unsafe_state_file"
  state_version_seen=0
  state_failures_seen=0
  state_open_seen=0
  state_event_seen=0
  state_started_seen=0
  state_deployment_seen=0
  state_alert_seen=0
  state_recovery_seen=0
  state_snapshot_dns_seen=0
  state_snapshot_tls_seen=0
  state_snapshot_home_seen=0
  state_snapshot_aviso_seen=0
  state_snapshot_xiaoyi_seen=0
  state_snapshot_sitemap_seen=0
  state_recovery_checked_seen=0
  state_recovery_deployment_seen=0
  state_recovery_dns_seen=0
  state_recovery_tls_seen=0
  state_recovery_home_seen=0
  state_recovery_aviso_seen=0
  state_recovery_xiaoyi_seen=0
  state_recovery_sitemap_seen=0
  while IFS='=' read -r state_key state_value || test -n "$state_key"
  do
    case $state_key in
      version)
        test "$state_version_seen" -eq 0 || die_internal "duplicate_state_key"
        state_version_seen=1
        test "$state_value" = 2 || die_internal "unsupported_state_version"
        ;;
      consecutive_failures)
        test "$state_failures_seen" -eq 0 || die_internal "duplicate_state_key"
        state_failures_seen=1
        consecutive_failures=$state_value
        ;;
      incident_open)
        test "$state_open_seen" -eq 0 || die_internal "duplicate_state_key"
        state_open_seen=1
        incident_open=$state_value
        ;;
      incident_event_id)
        test "$state_event_seen" -eq 0 || die_internal "duplicate_state_key"
        state_event_seen=1
        incident_event_id=$state_value
        ;;
      incident_started_at)
        test "$state_started_seen" -eq 0 || die_internal "duplicate_state_key"
        state_started_seen=1
        incident_started_at=$state_value
        ;;
      incident_deployment_reference)
        test "$state_deployment_seen" -eq 0 || die_internal "duplicate_state_key"
        state_deployment_seen=1
        incident_deployment_reference=$state_value
        ;;
      alert_delivered)
        test "$state_alert_seen" -eq 0 || die_internal "duplicate_state_key"
        state_alert_seen=1
        alert_delivered=$state_value
        ;;
      recovery_pending)
        test "$state_recovery_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_seen=1
        recovery_pending=$state_value
        ;;
      alert_result_dns)
        test "$state_snapshot_dns_seen" -eq 0 || die_internal "duplicate_state_key"
        state_snapshot_dns_seen=1
        alert_result_dns=$state_value
        ;;
      alert_result_tls)
        test "$state_snapshot_tls_seen" -eq 0 || die_internal "duplicate_state_key"
        state_snapshot_tls_seen=1
        alert_result_tls=$state_value
        ;;
      alert_result_home)
        test "$state_snapshot_home_seen" -eq 0 || die_internal "duplicate_state_key"
        state_snapshot_home_seen=1
        alert_result_home=$state_value
        ;;
      alert_result_aviso)
        test "$state_snapshot_aviso_seen" -eq 0 || die_internal "duplicate_state_key"
        state_snapshot_aviso_seen=1
        alert_result_aviso=$state_value
        ;;
      alert_result_xiaoyi)
        test "$state_snapshot_xiaoyi_seen" -eq 0 || die_internal "duplicate_state_key"
        state_snapshot_xiaoyi_seen=1
        alert_result_xiaoyi=$state_value
        ;;
      alert_result_sitemap)
        test "$state_snapshot_sitemap_seen" -eq 0 || die_internal "duplicate_state_key"
        state_snapshot_sitemap_seen=1
        alert_result_sitemap=$state_value
        ;;
      recovery_checked_at)
        test "$state_recovery_checked_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_checked_seen=1
        recovery_checked_at=$state_value
        ;;
      recovery_deployment_reference)
        test "$state_recovery_deployment_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_deployment_seen=1
        recovery_deployment_reference=$state_value
        ;;
      recovery_result_dns)
        test "$state_recovery_dns_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_dns_seen=1
        recovery_result_dns=$state_value
        ;;
      recovery_result_tls)
        test "$state_recovery_tls_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_tls_seen=1
        recovery_result_tls=$state_value
        ;;
      recovery_result_home)
        test "$state_recovery_home_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_home_seen=1
        recovery_result_home=$state_value
        ;;
      recovery_result_aviso)
        test "$state_recovery_aviso_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_aviso_seen=1
        recovery_result_aviso=$state_value
        ;;
      recovery_result_xiaoyi)
        test "$state_recovery_xiaoyi_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_xiaoyi_seen=1
        recovery_result_xiaoyi=$state_value
        ;;
      recovery_result_sitemap)
        test "$state_recovery_sitemap_seen" -eq 0 || die_internal "duplicate_state_key"
        state_recovery_sitemap_seen=1
        recovery_result_sitemap=$state_value
        ;;
      *) die_internal "unknown_state_key" ;;
    esac
  done < "$STATE_FILE"
  for state_seen in \
    "$state_version_seen" \
    "$state_failures_seen" \
    "$state_open_seen" \
    "$state_event_seen" \
    "$state_started_seen" \
    "$state_deployment_seen" \
    "$state_alert_seen" \
    "$state_recovery_seen" \
    "$state_snapshot_dns_seen" \
    "$state_snapshot_tls_seen" \
    "$state_snapshot_home_seen" \
    "$state_snapshot_aviso_seen" \
    "$state_snapshot_xiaoyi_seen" \
    "$state_snapshot_sitemap_seen" \
    "$state_recovery_checked_seen" \
    "$state_recovery_deployment_seen" \
    "$state_recovery_dns_seen" \
    "$state_recovery_tls_seen" \
    "$state_recovery_home_seen" \
    "$state_recovery_aviso_seen" \
    "$state_recovery_xiaoyi_seen" \
    "$state_recovery_sitemap_seen"
  do
    test "$state_seen" -eq 1 || die_internal "incomplete_state"
  done
  is_uint "$consecutive_failures" || die_internal "invalid_failure_count"
  test "$consecutive_failures" -le "$FAILURE_THRESHOLD" ||
    die_internal "failure_count_above_threshold"
  case $incident_open in 0|1) ;; *) die_internal "invalid_incident_open" ;; esac
  case $alert_delivered in 0|1) ;; *) die_internal "invalid_alert_delivered" ;; esac
  case $recovery_pending in 0|1) ;; *) die_internal "invalid_recovery_pending" ;; esac
  if test "$incident_open" -eq 0; then
    test "$consecutive_failures" -lt "$FAILURE_THRESHOLD" ||
      die_internal "closed_incident_at_threshold"
    test "$incident_event_id" = NONE &&
      test "$incident_started_at" = NONE &&
      test "$incident_deployment_reference" = NONE &&
      test "$alert_delivered" -eq 0 &&
      test "$recovery_pending" -eq 0 &&
      test "$alert_result_dns" = NONE &&
      test "$alert_result_tls" = NONE &&
      test "$alert_result_home" = NONE &&
      test "$alert_result_aviso" = NONE &&
      test "$alert_result_xiaoyi" = NONE &&
      test "$alert_result_sitemap" = NONE &&
      test "$recovery_checked_at" = NONE &&
      test "$recovery_deployment_reference" = NONE &&
      test "$recovery_result_dns" = NONE &&
      test "$recovery_result_tls" = NONE &&
      test "$recovery_result_home" = NONE &&
      test "$recovery_result_aviso" = NONE &&
      test "$recovery_result_xiaoyi" = NONE &&
      test "$recovery_result_sitemap" = NONE ||
      die_internal "invalid_closed_incident_state"
  else
    printf '%s\n' "$incident_event_id" | command -p grep -Eq '^incident-[0-9]+-[0-9]+$' ||
      die_internal "invalid_event_id"
    is_uint "$incident_started_at" || die_internal "invalid_incident_started_at"
    valid_deployment_reference "$incident_deployment_reference" ||
      die_internal "invalid_incident_deployment_reference"
    materialize_alert_snapshot
    if test "$recovery_pending" -eq 1; then
      test "$consecutive_failures" -eq 0 ||
        die_internal "recovery_pending_with_failure_count"
      is_uint "$recovery_checked_at" || die_internal "invalid_recovery_checked_at"
      valid_deployment_reference "$recovery_deployment_reference" ||
        die_internal "invalid_recovery_deployment_reference"
      materialize_recovery_snapshot
    else
      test "$consecutive_failures" -ge "$FAILURE_THRESHOLD" ||
        die_internal "open_incident_below_threshold"
      test "$recovery_checked_at" = NONE &&
        test "$recovery_deployment_reference" = NONE &&
        test "$recovery_result_dns" = NONE &&
        test "$recovery_result_tls" = NONE &&
        test "$recovery_result_home" = NONE &&
        test "$recovery_result_aviso" = NONE &&
        test "$recovery_result_xiaoyi" = NONE &&
        test "$recovery_result_sitemap" = NONE ||
        die_internal "unexpected_recovery_snapshot"
    fi
  fi
}

write_state() {
  STATE_TMP=$(command -p mktemp "$MONITOR_STATE_DIR/.state.XXXXXX") ||
    die_internal "state_temp_create_failed"
  {
    printf 'version=2\n'
    printf 'consecutive_failures=%s\n' "$consecutive_failures"
    printf 'incident_open=%s\n' "$incident_open"
    printf 'incident_event_id=%s\n' "$incident_event_id"
    printf 'incident_started_at=%s\n' "$incident_started_at"
    printf 'incident_deployment_reference=%s\n' "$incident_deployment_reference"
    printf 'alert_delivered=%s\n' "$alert_delivered"
    printf 'recovery_pending=%s\n' "$recovery_pending"
    printf 'alert_result_dns=%s\n' "$alert_result_dns"
    printf 'alert_result_tls=%s\n' "$alert_result_tls"
    printf 'alert_result_home=%s\n' "$alert_result_home"
    printf 'alert_result_aviso=%s\n' "$alert_result_aviso"
    printf 'alert_result_xiaoyi=%s\n' "$alert_result_xiaoyi"
    printf 'alert_result_sitemap=%s\n' "$alert_result_sitemap"
    printf 'recovery_checked_at=%s\n' "$recovery_checked_at"
    printf 'recovery_deployment_reference=%s\n' "$recovery_deployment_reference"
    printf 'recovery_result_dns=%s\n' "$recovery_result_dns"
    printf 'recovery_result_tls=%s\n' "$recovery_result_tls"
    printf 'recovery_result_home=%s\n' "$recovery_result_home"
    printf 'recovery_result_aviso=%s\n' "$recovery_result_aviso"
    printf 'recovery_result_xiaoyi=%s\n' "$recovery_result_xiaoyi"
    printf 'recovery_result_sitemap=%s\n' "$recovery_result_sitemap"
  } > "$STATE_TMP"
  command -p chmod 600 "$STATE_TMP"
  command -p mv "$STATE_TMP" "$MONITOR_STATE_DIR/state"
  STATE_TMP=
}

validate_curl_config() {
  config_file=$1
  test -f "$config_file" && test ! -L "$config_file" || return 1
  command -p awk '
    /^[[:space:]]*$/ || /^[[:space:]]*#/ { next }
    /^url = "https:\/\/[^"\\[:space:]]+"$/ {
      urls++
      next
    }
    /^header = "[^"\\]+"$/ {
      value = substr($0, 11, length($0) - 11)
      if (substr(value, 1, 1) == "@") exit 1
      headers++
      if (headers > 8) exit 1
      next
    }
    { exit 1 }
    END { if (urls != 1) exit 1 }
  ' "$config_file"
}

append_fixture_event() {
  fixture_event_line=$1
  test -n "$MONITOR_EVENT_SINK" || return 1
  is_safe_path "$MONITOR_EVENT_SINK" || return 1
  path_components_are_safe "$MONITOR_EVENT_SINK" || return 1
  sink_parent=$(command -p dirname "$MONITOR_EVENT_SINK")
  test -d "$sink_parent" && test ! -L "$sink_parent" || return 1
  if test -e "$MONITOR_EVENT_SINK" || test -L "$MONITOR_EVENT_SINK"; then
    test -f "$MONITOR_EVENT_SINK" && test ! -L "$MONITOR_EVENT_SINK" || return 1
  fi
  printf '%s\n' "$fixture_event_line" >> "$MONITOR_EVENT_SINK" || return 1
}

send_event() {
  event_type=$1
  event_id=$2
  event_classes=$3
  event_results_file=$4
  event_checked_at=$5
  event_deployment_reference=$6
  validate_results_file "$event_results_file"
  event_payload="$SCRATCH_DIR/$event_type.json"
  event_checks=$(command -p awk -F '|' '
    {
      if (summary != "") summary = summary ";"
      summary = summary $1 "=" $2 ",class=" $3 ",latency_ms=" $4 ",detail=" $5
    }
    END { print summary }
  ' "$event_results_file")
  event_checks_json=$(json_escape "$event_checks")
  printf '{"event":"%s","event_id":"%s","checked_at_epoch":%s,"url":"https://ailiu.online","classes":"%s","checks":"%s","deployment_reference":"%s","deployment_runtime_status":"UNKNOWN_NOT_VERIFIED"}\n' \
    "$event_type" "$event_id" "$event_checked_at" "$event_classes" \
    "$event_checks_json" "$event_deployment_reference" > "$event_payload"
  if test "$MODE" = fixture; then
    append_fixture_event \
      "$event_type|$event_id|$event_classes|checked_at_epoch=$event_checked_at|url=https://ailiu.online|$event_checks|deployment_reference=$event_deployment_reference|deployment_runtime_status=UNKNOWN_NOT_VERIFIED"
    return $?
  fi
  test -n "$ALERT_CURL_CONFIG_FILE" || return 1
  is_safe_path "$ALERT_CURL_CONFIG_FILE" || return 1
  path_components_are_safe "$ALERT_CURL_CONFIG_FILE" || return 1
  validate_curl_config "$ALERT_CURL_CONFIG_FILE" || return 1
  command -v curl >/dev/null 2>&1 || return 1
  event_http_meta="$SCRATCH_DIR/$event_type-http-code"
  if run_bounded_command "$DELIVERY_TIMEOUT_SECONDS" curl \
    --disable \
    --config "$ALERT_CURL_CONFIG_FILE" \
    --proto '=https' \
    --no-location \
    --silent \
    --connect-timeout 2 \
    --max-time "$DELIVERY_TIMEOUT_SECONDS" \
    --request POST \
    --header 'Content-Type: application/json' \
    --header "Idempotency-Key: $event_id-$event_type" \
    --data-binary "@$event_payload" \
    --output /dev/null \
    --write-out '%{http_code}' > "$event_http_meta" 2>/dev/null
  then
    event_http_code=$(command -p sed -n '1p' "$event_http_meta")
    case $event_http_code in 2??) return 0 ;; esac
  fi
  return 1
}

send_heartbeat() {
  heartbeat_id=$1
  if test "$MODE" = fixture; then
    test -n "$MONITOR_EVENT_SINK" || return 0
    append_fixture_event "heartbeat|$heartbeat_id|NONE"
    return $?
  fi
  test -n "$HEARTBEAT_CURL_CONFIG_FILE" || return 1
  is_safe_path "$HEARTBEAT_CURL_CONFIG_FILE" || return 1
  path_components_are_safe "$HEARTBEAT_CURL_CONFIG_FILE" || return 1
  validate_curl_config "$HEARTBEAT_CURL_CONFIG_FILE" || return 1
  command -v curl >/dev/null 2>&1 || return 1
  heartbeat_http_meta="$SCRATCH_DIR/heartbeat-http-code"
  if run_bounded_command "$DELIVERY_TIMEOUT_SECONDS" curl \
    --disable \
    --config "$HEARTBEAT_CURL_CONFIG_FILE" \
    --proto '=https' \
    --no-location \
    --silent \
    --connect-timeout 2 \
    --max-time "$DELIVERY_TIMEOUT_SECONDS" \
    --request POST \
    --output /dev/null \
    --write-out '%{http_code}' > "$heartbeat_http_meta" 2>/dev/null
  then
    heartbeat_http_code=$(command -p sed -n '1p' "$heartbeat_http_meta")
    case $heartbeat_http_code in 2??) return 0 ;; esac
  fi
  return 1
}

attempt_cycle_heartbeat() {
  cycle_heartbeat_id=$1
  if send_heartbeat "$cycle_heartbeat_id"; then
    log "heartbeat=delivered cycle_complete=1"
  else
    log "heartbeat=pending cycle_complete=1"
    return 1
  fi
}

if test "$DRY_RUN" -eq 0; then
  test ! -L "$MONITOR_STATE_DIR" || die_internal "state_directory_symlink"
  command -p mkdir -p "$MONITOR_STATE_DIR"
  path_components_are_safe "$MONITOR_STATE_DIR" &&
    test -d "$MONITOR_STATE_DIR" && test ! -L "$MONITOR_STATE_DIR" ||
    die_internal "unsafe_state_directory_after_create"
  if ! command -p mkdir "$MONITOR_STATE_DIR/.lock" 2>/dev/null; then
    die_internal "monitor_lock_held"
  fi
  LOCK_HELD=1
  load_state
fi

run_checks
current_classes=$(failure_classes)
current_primary=$(primary_failure)

if test "$DRY_RUN" -eq 1; then
  if test "$current_primary" = NONE; then
    log "status=HEALTHY primary=NONE classes=NONE dry_run=1"
    exit 0
  fi
  log "status=DEGRADED primary=$current_primary classes=$current_classes dry_run=1"
  exit 1
fi

now_epoch=$(command -p date +%s)
is_uint "$now_epoch" || die_internal "invalid_clock"

if test "$current_primary" != NONE; then
  if test "$incident_open" -eq 1 && test "$recovery_pending" -eq 1; then
    recovery_pending=0
    clear_recovery_snapshot
    consecutive_failures=$FAILURE_THRESHOLD
  elif test "$incident_open" -eq 1; then
    consecutive_failures=$FAILURE_THRESHOLD
  else
    consecutive_failures=$((consecutive_failures + 1))
  fi
  if test "$consecutive_failures" -ge "$FAILURE_THRESHOLD"; then
    if test "$incident_open" -eq 0; then
      incident_open=1
      incident_started_at=$now_epoch
      incident_event_id="incident-$now_epoch-$$"
      incident_deployment_reference=$deployment_reference
      alert_delivered=0
      recovery_pending=0
      capture_alert_snapshot
      materialize_alert_snapshot
      # Persist the stable ID and immutable failure snapshot before delivery.
      write_state
    fi
    if test "$alert_delivered" -eq 0; then
      alert_classes=$(failure_classes_from "$ALERT_RESULTS_FILE")
      if send_event alert "$incident_event_id" "$alert_classes" \
        "$ALERT_RESULTS_FILE" "$incident_started_at" \
        "$incident_deployment_reference"
      then
        alert_delivered=1
        write_state
        log "status=INCIDENT event_id=$incident_event_id alert=delivered primary=$current_primary"
      else
        log "status=INCIDENT event_id=$incident_event_id alert=pending primary=$current_primary"
      fi
    else
      log "status=INCIDENT event_id=$incident_event_id alert=deduplicated primary=$current_primary"
    fi
  else
    log "status=DEGRADED count=$consecutive_failures primary=$current_primary classes=$current_classes"
  fi
  write_state
  attempt_cycle_heartbeat "heartbeat-$now_epoch" || true
  exit 1
fi

consecutive_failures=0
if test "$incident_open" -eq 1; then
  if test "$recovery_pending" -eq 0; then
    capture_recovery_snapshot
    materialize_recovery_snapshot
    recovery_pending=1
    write_state
  fi
  alert_was_pending=0
  if test "$alert_delivered" -eq 0; then
    alert_was_pending=1
    alert_classes=$(failure_classes_from "$ALERT_RESULTS_FILE")
    if send_event alert "$incident_event_id" "$alert_classes" \
      "$ALERT_RESULTS_FILE" "$incident_started_at" \
      "$incident_deployment_reference"
    then
      alert_delivered=1
      write_state
      log "status=RECOVERY_PENDING event_id=$incident_event_id alert=delivered_before_recovery"
    else
      log "status=RECOVERY_PENDING event_id=$incident_event_id alert=pending_before_recovery"
      attempt_cycle_heartbeat "heartbeat-$now_epoch" || true
      exit 1
    fi
  fi
  if test "$alert_was_pending" -eq 1; then
    log "status=RECOVERY_PENDING event_id=$incident_event_id recovery=queued_after_alert"
    attempt_cycle_heartbeat "heartbeat-$now_epoch" || true
    exit 1
  fi
  if send_event recovery "$incident_event_id" NONE \
    "$RECOVERY_RESULTS_FILE" "$recovery_checked_at" \
    "$recovery_deployment_reference"
  then
    final_status_log="status=RECOVERED event_id=$incident_event_id recovery=delivered"
    incident_open=0
    incident_event_id=NONE
    incident_started_at=NONE
    incident_deployment_reference=NONE
    alert_delivered=0
    recovery_pending=0
    clear_alert_snapshot
    clear_recovery_snapshot
  else
    log "status=RECOVERY_PENDING event_id=$incident_event_id recovery=pending"
    write_state
    attempt_cycle_heartbeat "heartbeat-$now_epoch" || true
    exit 1
  fi
else
  final_status_log="status=HEALTHY primary=NONE classes=NONE"
fi
write_state

if ! attempt_cycle_heartbeat "heartbeat-$now_epoch"; then
  log "status=UNKNOWN_INTERNAL reason=heartbeat_delivery_failed"
  exit 4
fi

log "$final_status_log"

exit 0
