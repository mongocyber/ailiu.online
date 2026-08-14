#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
CHECKER="$ROOT_DIR/ops/monitoring/check-site.sh"
SERVICE="$ROOT_DIR/ops/monitoring/check-site.service"
TIMER="$ROOT_DIR/ops/monitoring/check-site.timer"
TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/ailiu-monitor-test.XXXXXX")
PASS_COUNT=0

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT HUP INT TERM

fail() {
  printf 'TEST FAIL: %s\n' "$1" >&2
  exit 1
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'TEST PASS: %s\n' "$1"
}

write_value() {
  printf '%s\n' "$2" > "$1"
}

make_healthy_fixture() {
  fixture=$1
  mkdir -p "$fixture"
  write_value "$fixture/dns.exit" 0
  write_value "$fixture/dns.output" 203.0.113.10
  write_value "$fixture/tls.exit" 0
  write_value "$fixture/tls.valid" 1
  write_value "$fixture/tls.summary" valid
  for route in home aviso xiaoyi sitemap
  do
    write_value "$fixture/$route.curl_exit" 0
    write_value "$fixture/$route.status" 200
    write_value "$fixture/$route.latency_ms" 42
  done
  write_value "$fixture/home.effective_url" https://ailiu.online/
  write_value "$fixture/aviso.effective_url" https://ailiu.online/projects/aviso
  write_value "$fixture/xiaoyi.effective_url" https://ailiu.online/projects/xiaoyi
  write_value "$fixture/sitemap.effective_url" https://ailiu.online/sitemap.xml
  write_value "$fixture/home.body" '<link rel="canonical" href="https://ailiu.online/">'
  write_value "$fixture/aviso.body" '<link rel="canonical" href="https://ailiu.online/projects/aviso">'
  write_value "$fixture/xiaoyi.body" '<link rel="canonical" href="https://ailiu.online/projects/xiaoyi">'
  write_value "$fixture/sitemap.body" '<loc>https://ailiu.online/</loc>'
  write_value "$fixture/deployment-id" dpl_Test123
}

clone_fixture() {
  source_fixture=$1
  target_fixture=$2
  cp -R "$source_fixture" "$target_fixture"
}

run_fixture() {
  fixture=$1
  state_dir=$2
  sink=$3
  output=$4
  if MONITOR_STATE_DIR="$state_dir" \
    MONITOR_EVENT_SINK="$sink" \
    "$CHECKER" --fixture "$fixture" > "$output" 2>&1
  then
    RUN_RC=0
  else
    RUN_RC=$?
  fi
}

run_dry() {
  fixture=$1
  output=$2
  if MONITOR_STATE_DIR="$TEST_ROOT/dry-unused" \
    "$CHECKER" --dry-run "$fixture" > "$output" 2>&1
  then
    RUN_RC=0
  else
    RUN_RC=$?
  fi
}

count_events() {
  event_type=$1
  sink=$2
  if test ! -f "$sink"; then
    printf '0'
    return
  fi
  grep -c "^$event_type|" "$sink" 2>/dev/null || true
}

state_value() {
  key=$1
  state_file=$2
  sed -n "s/^$key=//p" "$state_file"
}

expect_primary() {
  fixture=$1
  expected=$2
  label=$3
  output="$TEST_ROOT/primary-$label.log"
  run_dry "$fixture" "$output"
  test "$RUN_RC" -eq 1 || fail "$label must fail in dry-run"
  grep -Fq "primary=$expected" "$output" ||
    fail "$label must classify as $expected"
}

HEALTHY="$TEST_ROOT/healthy"
make_healthy_fixture "$HEALTHY"

STATE0="$TEST_ROOT/state0"
SINK0="$TEST_ROOT/sink0/events"
mkdir -p "$STATE0" "$(dirname "$SINK0")"
run_fixture "$HEALTHY" "$STATE0" "$SINK0" "$TEST_ROOT/healthy.log"
if test "$RUN_RC" -ne 0; then
  sed -n '1,40p' "$TEST_ROOT/healthy.log" >&2
  fail "healthy fixture must pass"
fi
test "$(state_value consecutive_failures "$STATE0/state")" -eq 0 ||
  fail "healthy fixture must persist zero failures"
test "$(count_events alert "$SINK0")" -eq 0 || fail "healthy fixture emitted alert"
test "$(count_events recovery "$SINK0")" -eq 0 || fail "healthy fixture emitted recovery"
pass raw-transport-healthy

DNS_FAIL="$TEST_ROOT/dns-fail"
clone_fixture "$HEALTHY" "$DNS_FAIL"
write_value "$DNS_FAIL/dns.exit" 1
write_value "$DNS_FAIL/dns.output" ''
expect_primary "$DNS_FAIL" DNS dns

TLS_FAIL="$TEST_ROOT/tls-fail"
clone_fixture "$HEALTHY" "$TLS_FAIL"
write_value "$TLS_FAIL/tls.exit" 1
write_value "$TLS_FAIL/tls.valid" 0
expect_primary "$TLS_FAIL" TLS tls

HTTP_TRANSPORT_FAIL="$TEST_ROOT/http-transport-fail"
clone_fixture "$HEALTHY" "$HTTP_TRANSPORT_FAIL"
write_value "$HTTP_TRANSPORT_FAIL/home.curl_exit" 28
expect_primary "$HTTP_TRANSPORT_FAIL" HTTP_TRANSPORT http-transport

HTTP_STATUS_FAIL="$TEST_ROOT/http-status-fail"
clone_fixture "$HEALTHY" "$HTTP_STATUS_FAIL"
write_value "$HTTP_STATUS_FAIL/home.status" 503
expect_primary "$HTTP_STATUS_FAIL" HTTP_STATUS http-status

CONTENT_FAIL="$TEST_ROOT/content-fail"
clone_fixture "$HEALTHY" "$CONTENT_FAIL"
write_value "$CONTENT_FAIL/home.body" '<html>soft 200 without marker</html>'
expect_primary "$CONTENT_FAIL" CONTENT content

DEPLOYMENT_UNKNOWN="$TEST_ROOT/deployment-unknown"
clone_fixture "$HEALTHY" "$DEPLOYMENT_UNKNOWN"
write_value "$DEPLOYMENT_UNKNOWN/deployment-id" 'sfo1::request-id'
run_dry "$DEPLOYMENT_UNKNOWN" "$TEST_ROOT/deployment-reference.log"
test "$RUN_RC" -eq 0 || fail "unknown deployment reference must not become site failure"
grep -Fq 'status=HEALTHY primary=NONE' "$TEST_ROOT/deployment-reference.log" ||
  fail "unknown deployment reference was misreported as runtime health"

PRIORITY_FAIL="$TEST_ROOT/priority-fail"
clone_fixture "$DNS_FAIL" "$PRIORITY_FAIL"
write_value "$PRIORITY_FAIL/home.status" 503
expect_primary "$PRIORITY_FAIL" DNS priority
pass deterministic-failure-classification

STATE1="$TEST_ROOT/state1"
SINK1="$TEST_ROOT/sink1/events"
mkdir -p "$STATE1" "$(dirname "$SINK1")"
run_fixture "$DNS_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/seq-1.log"
test "$RUN_RC" -eq 1 || fail "first failure must fail"
test "$(state_value consecutive_failures "$STATE1/state")" -eq 1 ||
  fail "first failure count"
test "$(count_events alert "$SINK1")" -eq 0 || fail "first failure alerted"
run_fixture "$TLS_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/seq-2.log"
test "$RUN_RC" -eq 1 || fail "second failure must fail"
test "$(state_value consecutive_failures "$STATE1/state")" -eq 2 ||
  fail "classification change reset the failure count"
test "$(count_events alert "$SINK1")" -eq 0 || fail "second failure alerted"
pass persistent-failure-count-across-classes

run_fixture "$HTTP_STATUS_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/seq-3.log"
test "$RUN_RC" -eq 1 || fail "third failure must fail"
test "$(count_events alert "$SINK1")" -eq 1 || fail "third failure needs one alert"
INCIDENT_ID=$(state_value incident_event_id "$STATE1/state")
test -n "$INCIDENT_ID" && test "$INCIDENT_ID" != NONE || fail "incident id missing"
grep -Eq 'checked_at_epoch=[0-9]+\|url=https://ailiu.online\|' "$SINK1" ||
  fail "alert lacks time or canonical URL"
grep -Fq 'dns=ok,class=NONE,latency_ms=' "$SINK1" || fail "alert lacks DNS summary"
grep -Fq 'tls=ok,class=NONE,latency_ms=' "$SINK1" || fail "alert lacks TLS summary"
grep -Fq 'home=fail,class=HTTP_STATUS,latency_ms=42,detail=status=503' "$SINK1" ||
  fail "alert lacks HTTP status and latency"
grep -Fq 'deployment_reference=dpl_Test123|deployment_runtime_status=UNKNOWN_NOT_VERIFIED' "$SINK1" ||
  fail "alert lacks explicitly unverified deployment reference"
run_fixture "$CONTENT_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/seq-4.log"
test "$RUN_RC" -eq 1 || fail "continued failure must fail"
test "$(count_events alert "$SINK1")" -eq 1 || fail "continued failure duplicated alert"
test "$(state_value incident_event_id "$STATE1/state")" = "$INCIDENT_ID" ||
  fail "continued failure changed incident id"
pass third-failure-single-logical-alert

run_fixture "$HEALTHY" "$STATE1" "$SINK1" "$TEST_ROOT/recover-1.log"
test "$RUN_RC" -eq 0 || fail "healthy after incident must recover"
test "$(count_events recovery "$SINK1")" -eq 1 || fail "one recovery required"
grep -Fq "recovery|$INCIDENT_ID|" "$SINK1" || fail "recovery changed event id"
run_fixture "$HEALTHY" "$STATE1" "$SINK1" "$TEST_ROOT/recover-2.log"
test "$RUN_RC" -eq 0 || fail "healthy after recovery must pass"
test "$(count_events recovery "$SINK1")" -eq 1 || fail "recovery duplicated"
pass single-recovery-after-all-checks-pass

run_fixture "$DNS_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/second-incident-1.log"
run_fixture "$TLS_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/second-incident-2.log"
run_fixture "$HTTP_STATUS_FAIL" "$STATE1" "$SINK1" "$TEST_ROOT/second-incident-3.log"
test "$RUN_RC" -eq 1 || fail "second incident third failure must fail"
SECOND_INCIDENT_ID=$(state_value incident_event_id "$STATE1/state")
test -n "$SECOND_INCIDENT_ID" && test "$SECOND_INCIDENT_ID" != "$INCIDENT_ID" ||
  fail "second incident reused the first incident id"
test "$(count_events alert "$SINK1")" -eq 2 ||
  fail "second incident must emit exactly one new alert"
run_fixture "$HEALTHY" "$STATE1" "$SINK1" "$TEST_ROOT/second-incident-recovery.log"
test "$RUN_RC" -eq 0 || fail "second incident recovery must pass"
test "$(count_events recovery "$SINK1")" -eq 2 ||
  fail "second incident must emit exactly one new recovery"
grep -Fq "recovery|$SECOND_INCIDENT_ID|" "$SINK1" ||
  fail "second recovery changed event id"
pass repeated-incidents-remain-independent

STATE2="$TEST_ROOT/state2"
SINK2="$TEST_ROOT/sink2/events"
mkdir -p "$STATE2" "$(dirname "$SINK2")"
run_fixture "$DNS_FAIL" "$STATE2" "$SINK2" "$TEST_ROOT/transient-1.log"
run_fixture "$TLS_FAIL" "$STATE2" "$SINK2" "$TEST_ROOT/transient-2.log"
run_fixture "$HEALTHY" "$STATE2" "$SINK2" "$TEST_ROOT/transient-3.log"
test "$RUN_RC" -eq 0 || fail "transient recovery must pass"
test "$(count_events alert "$SINK2")" -eq 0 || fail "transient failures alerted"
test "$(count_events recovery "$SINK2")" -eq 0 || fail "transient failures recovered"
test "$(state_value consecutive_failures "$STATE2/state")" -eq 0 ||
  fail "transient failure count did not clear"
pass transient-failures-do-not-create-events

STATE3="$TEST_ROOT/state3"
BAD_SINK="$TEST_ROOT/missing-parent/events"
GOOD_SINK="$TEST_ROOT/sink3/events"
mkdir -p "$STATE3"
run_fixture "$DNS_FAIL" "$STATE3" "$BAD_SINK" "$TEST_ROOT/retry-1.log"
run_fixture "$TLS_FAIL" "$STATE3" "$BAD_SINK" "$TEST_ROOT/retry-2.log"
run_fixture "$HTTP_STATUS_FAIL" "$STATE3" "$BAD_SINK" "$TEST_ROOT/retry-3.log"
test "$RUN_RC" -eq 1 || fail "pending alert cycle must fail"
test "$(state_value alert_delivered "$STATE3/state")" -eq 0 ||
  fail "failed delivery marked delivered"
RETRY_ID=$(state_value incident_event_id "$STATE3/state")
mkdir -p "$(dirname "$GOOD_SINK")"
run_fixture "$CONTENT_FAIL" "$STATE3" "$GOOD_SINK" "$TEST_ROOT/retry-4.log"
test "$RUN_RC" -eq 1 || fail "continued incident must fail"
test "$(count_events alert "$GOOD_SINK")" -eq 1 || fail "alert retry not delivered"
grep -Fq "alert|$RETRY_ID|" "$GOOD_SINK" || fail "alert retry changed event id"
pass alert-retry-keeps-stable-event-id

run_fixture "$HEALTHY" "$STATE3" "$BAD_SINK" "$TEST_ROOT/recovery-retry-1.log"
test "$RUN_RC" -eq 1 || fail "failed recovery delivery must fail"
test "$(state_value recovery_pending "$STATE3/state")" -eq 1 ||
  fail "failed recovery not pending"
test "$(state_value incident_event_id "$STATE3/state")" = "$RETRY_ID" ||
  fail "failed recovery changed incident id"
run_fixture "$HEALTHY" "$STATE3" "$GOOD_SINK" "$TEST_ROOT/recovery-retry-2.log"
test "$RUN_RC" -eq 0 || fail "recovery retry must pass"
test "$(count_events recovery "$GOOD_SINK")" -eq 1 || fail "recovery retry missing"
grep -Fq "recovery|$RETRY_ID|" "$GOOD_SINK" || fail "recovery retry changed event id"
pass recovery-retry-keeps-stable-event-id

STATE4="$TEST_ROOT/state4"
SINK4="$TEST_ROOT/sink4/events"
mkdir -p "$STATE4" "$(dirname "$SINK4")"
printf '%s\n' \
  'version=1' \
  'consecutive_failures=2' \
  'incident_open=0' \
  'incident_event_id=NONE' \
  'incident_started_at=NONE' \
  'alert_delivered=0' \
  'recovery_pending=0' \
  'evil=$(touch /tmp/ailiu-monitor-must-not-exist)' > "$STATE4/state"
STATE4_BEFORE=$(cksum "$STATE4/state")
run_fixture "$DNS_FAIL" "$STATE4" "$SINK4" "$TEST_ROOT/corrupt.log"
test "$RUN_RC" -eq 2 || fail "corrupt state must exit 2"
test "$(cksum "$STATE4/state")" = "$STATE4_BEFORE" || fail "corrupt state was overwritten"
test ! -e /tmp/ailiu-monitor-must-not-exist || fail "state content was executed"
test "$(count_events alert "$SINK4")" -eq 0 || fail "corrupt state emitted event"
pass corrupt-state-fails-closed

STATE5="$TEST_ROOT/state5"
SINK5="$TEST_ROOT/sink5/events"
mkdir -p "$STATE5/.lock" "$(dirname "$SINK5")"
LOCK_BEFORE=$(find "$STATE5" -maxdepth 1 -type f -print | wc -l | tr -d ' ')
run_fixture "$HEALTHY" "$STATE5" "$SINK5" "$TEST_ROOT/lock.log"
test "$RUN_RC" -eq 2 || fail "held lock must exit 2"
LOCK_AFTER=$(find "$STATE5" -maxdepth 1 -type f -print | wc -l | tr -d ' ')
test "$LOCK_BEFORE" -eq "$LOCK_AFTER" || fail "held lock changed state"
test ! -f "$SINK5" || fail "held lock emitted event"

SYMLINK_TARGET="$TEST_ROOT/symlink-target"
SYMLINK_STATE="$TEST_ROOT/symlink-state"
mkdir -p "$SYMLINK_TARGET"
ln -s "$SYMLINK_TARGET" "$SYMLINK_STATE"
run_fixture "$HEALTHY" "$SYMLINK_STATE" "$SINK5" "$TEST_ROOT/symlink.log"
test "$RUN_RC" -eq 2 || fail "state symlink must fail"

STATE_FILE_SYMLINK_DIR="$TEST_ROOT/state-file-symlink"
STATE_FILE_EXTERNAL="$TEST_ROOT/state-file-external"
mkdir -p "$STATE_FILE_SYMLINK_DIR"
write_value "$STATE_FILE_EXTERNAL" external-state-canary
STATE_FILE_EXTERNAL_BEFORE=$(cksum "$STATE_FILE_EXTERNAL")
ln -s "$STATE_FILE_EXTERNAL" "$STATE_FILE_SYMLINK_DIR/state"
run_fixture "$HEALTHY" "$STATE_FILE_SYMLINK_DIR" "$SINK5" "$TEST_ROOT/state-file-symlink.log"
test "$RUN_RC" -eq 2 || fail "state-file symlink must fail"
test "$(cksum "$STATE_FILE_EXTERNAL")" = "$STATE_FILE_EXTERNAL_BEFORE" ||
  fail "state-file symlink changed external target"

STATE_TEMP_DIR="$TEST_ROOT/state-temp-symlink"
STATE_TEMP_EXTERNAL="$TEST_ROOT/state-temp-external-must-not-exist"
STATE_TEMP_SINK="$TEST_ROOT/state-temp-sink/events"
mkdir -p "$STATE_TEMP_DIR" "$(dirname "$STATE_TEMP_SINK")"
if STATE_TEMP_DIR="$STATE_TEMP_DIR" \
  STATE_TEMP_EXTERNAL="$STATE_TEMP_EXTERNAL" \
  STATE_TEMP_SINK="$STATE_TEMP_SINK" \
  CHECKER="$CHECKER" \
  HEALTHY="$HEALTHY" \
  sh -c '
    ln -s "$STATE_TEMP_EXTERNAL" "$STATE_TEMP_DIR/.state.$$"
    exec env \
      MONITOR_STATE_DIR="$STATE_TEMP_DIR" \
      MONITOR_EVENT_SINK="$STATE_TEMP_SINK" \
      "$CHECKER" --fixture "$HEALTHY"
  ' > "$TEST_ROOT/state-temp-symlink.log" 2>&1
then
  :
else
  fail "exclusive state temp creation rejected a harmless stale symlink"
fi
test ! -e "$STATE_TEMP_EXTERNAL" ||
  fail "predictable state temp symlink created an external target"

SINK_SYMLINK_STATE="$TEST_ROOT/sink-symlink-state"
SINK_SYMLINK_EXTERNAL="$TEST_ROOT/sink-symlink-external"
SINK_SYMLINK="$TEST_ROOT/sink-symlink/events"
mkdir -p "$SINK_SYMLINK_STATE" "$(dirname "$SINK_SYMLINK")"
write_value "$SINK_SYMLINK_EXTERNAL" external-sink-canary
SINK_SYMLINK_EXTERNAL_BEFORE=$(cksum "$SINK_SYMLINK_EXTERNAL")
ln -s "$SINK_SYMLINK_EXTERNAL" "$SINK_SYMLINK"
run_fixture "$HEALTHY" "$SINK_SYMLINK_STATE" "$SINK_SYMLINK" "$TEST_ROOT/sink-symlink.log"
test "$RUN_RC" -eq 4 || fail "fixture heartbeat sink symlink must fail closed"
test "$(cksum "$SINK_SYMLINK_EXTERNAL")" = "$SINK_SYMLINK_EXTERNAL_BEFORE" ||
  fail "fixture sink symlink changed external target"
if MONITOR_STATE_DIR="$TEST_ROOT/path/../escape" \
  MONITOR_EVENT_SINK="$SINK5" \
  "$CHECKER" --fixture "$HEALTHY" > "$TEST_ROOT/path-escape.log" 2>&1
then
  fail "state path escape was accepted"
else
  test "$?" -eq 2 || fail "state path escape must exit 2"
fi
pass lock-and-state-path-safety

LIVE_BIN="$TEST_ROOT/live-bin"
LIVE_CALL_LOG="$TEST_ROOT/live-calls.log"
LIVE_CAPTURE_DIR="$TEST_ROOT/live-payloads"
LIVE_SITE_MODE_FILE="$TEST_ROOT/live-site-mode"
LIVE_ALERT_STATUS_FILE="$TEST_ROOT/live-alert-status"
LIVE_HEARTBEAT_STATUS_FILE="$TEST_ROOT/live-heartbeat-status"
mkdir -p "$LIVE_BIN" "$LIVE_CAPTURE_DIR"
: > "$LIVE_CALL_LOG"

cat > "$LIVE_BIN/getent" <<'EOF'
#!/bin/sh
set -eu
test "$#" -eq 2 && test "$1" = ahosts && test "$2" = ailiu.online || exit 99
printf '203.0.113.10 STREAM ailiu.online\n'
EOF

cat > "$LIVE_BIN/openssl" <<'EOF'
#!/bin/sh
set -eu
case ${1:-} in
  s_client)
    test "$#" -eq 8 || exit 99
    test "$2" = -connect && test "$3" = ailiu.online:443 || exit 99
    test "$4" = -servername && test "$5" = ailiu.online || exit 99
    test "$6" = -verify_hostname && test "$7" = ailiu.online || exit 99
    test "$8" = -verify_return_error || exit 99
    printf '%s\n' fake-certificate
    ;;
  x509)
    shift
    input=
    output=
    checkend=
    enddate=0
    while test "$#" -gt 0
    do
      case $1 in
        -in) test "$#" -ge 2 || exit 99; input=$2; shift 2 ;;
        -out) test "$#" -ge 2 || exit 99; output=$2; shift 2 ;;
        -checkend) test "$#" -ge 2 || exit 99; checkend=$2; shift 2 ;;
        -enddate) enddate=1; shift ;;
        -noout) shift ;;
        *) exit 99 ;;
      esac
    done
    test -n "$input" && test -f "$input" || exit 99
    if test -n "$output"; then
      printf '%s\n' fake-certificate > "$output"
    elif test -n "$checkend"; then
      test "$checkend" = 604800 || exit 99
    elif test "$enddate" -eq 1; then
      printf '%s\n' 'notAfter=Dec 31 23:59:59 2030 GMT'
    else
      exit 99
    fi
    ;;
  *) exit 99 ;;
esac
EOF

cat > "$LIVE_BIN/curl" <<'EOF'
#!/bin/sh
set -eu
proto=
connect_timeout=
max_time=
output=
write_out=
config=
request=
data_binary=
url=
show_error=0
tls12=0
no_location=0
header_count=0

printf 'curl' >> "$FAKE_CALL_LOG"
while test "$#" -gt 0
do
  printf '|%s' "$1" >> "$FAKE_CALL_LOG"
  case $1 in
    --silent) shift ;;
    --show-error) show_error=1; shift ;;
    --tlsv1.2) tls12=1; shift ;;
    --no-location) no_location=1; shift ;;
    --proto|--connect-timeout|--max-time|--output|--write-out|--config|--request|--header|--data-binary)
      option=$1
      test "$#" -ge 2 || exit 99
      value=$2
      printf '|%s' "$value" >> "$FAKE_CALL_LOG"
      shift 2
      case $option in
        --proto) proto=$value ;;
        --connect-timeout) connect_timeout=$value ;;
        --max-time) max_time=$value ;;
        --output) output=$value ;;
        --write-out) write_out=$value ;;
        --config) config=$value ;;
        --request) request=$value ;;
        --data-binary) data_binary=$value ;;
        --header)
          header_count=$((header_count + 1))
          case $value in
            'Content-Type: application/json'|'Idempotency-Key: incident-'*) ;;
            *) exit 99 ;;
          esac
          ;;
      esac
      ;;
    --*) exit 99 ;;
    *)
      test -z "$url" || exit 99
      url=$1
      shift
      ;;
  esac
done
printf '\n' >> "$FAKE_CALL_LOG"

test "$proto" = '=https' || exit 99
if test -n "$config"; then
  test -f "$config" || exit 99
  test "$no_location" -eq 1 || exit 99
  test "$connect_timeout" = 5 && test "$max_time" = 15 || exit 99
  test "$request" = POST && test "$output" = /dev/null || exit 99
  test "$write_out" = '%{http_code}' || exit 99
  if test -n "$data_binary"; then
    test "$header_count" -eq 2 || exit 99
    case $data_binary in @*) payload=${data_binary#@} ;; *) exit 99 ;; esac
    test -f "$payload" || exit 99
    capture_count=$(find "$FAKE_CAPTURE_DIR" -type f -name 'payload-*.json' | wc -l | tr -d ' ')
    capture_file="$FAKE_CAPTURE_DIR/payload-$((capture_count + 1)).json"
    cp "$payload" "$capture_file"
    status=$(sed -n '1p' "$FAKE_ALERT_STATUS_FILE")
    if grep -Fq '"event":"alert"' "$payload"; then kind=alert; else kind=recovery; fi
    printf 'delivery|%s|status=%s\n' "$kind" "$status" >> "$FAKE_CALL_LOG"
  else
    test "$header_count" -eq 0 || exit 99
    status=$(sed -n '1p' "$FAKE_HEARTBEAT_STATUS_FILE")
    printf 'delivery|heartbeat|status=%s\n' "$status" >> "$FAKE_CALL_LOG"
  fi
  printf '%s' "$status"
  exit 0
fi

test "$show_error" -eq 1 && test "$tls12" -eq 1 && test "$no_location" -eq 0 || exit 99
test "$connect_timeout" = 12 && test "$max_time" = 12 || exit 99
test -n "$output" && test "$write_out" = '%{http_code}|%{time_total}|%{url_effective}' || exit 99
test -z "$request" && test -z "$data_binary" && test "$header_count" -eq 0 || exit 99
site_mode=$(sed -n '1p' "$FAKE_SITE_MODE_FILE")
status=200
case $url in
  https://ailiu.online/)
    test "$site_mode" != fail || status=503
    marker='<link rel="canonical" href="https://ailiu.online/">'
    ;;
  https://ailiu.online/projects/aviso)
    marker='<link rel="canonical" href="https://ailiu.online/projects/aviso">'
    ;;
  https://ailiu.online/projects/xiaoyi)
    marker='<link rel="canonical" href="https://ailiu.online/projects/xiaoyi">'
    ;;
  https://ailiu.online/sitemap.xml)
    marker='<loc>https://ailiu.online/</loc>'
    ;;
  *) exit 99 ;;
esac
printf '%s\n' "$marker" > "$output"
printf '%s|0.042|%s' "$status" "$url"
EOF
chmod 700 "$LIVE_BIN/getent" "$LIVE_BIN/openssl" "$LIVE_BIN/curl"

SECRET_CANARY='secret-canary-MON117'
LIVE_ALERT_CONFIG="$TEST_ROOT/alert.curl"
LIVE_HEARTBEAT_CONFIG="$TEST_ROOT/heartbeat.curl"
printf '%s\n' \
  "url = \"https://alerts.example.invalid/$SECRET_CANARY\"" \
  "header = \"Authorization: Bearer $SECRET_CANARY\"" > "$LIVE_ALERT_CONFIG"
printf '%s\n' \
  "url = \"https://heartbeat.example.invalid/$SECRET_CANARY\"" > "$LIVE_HEARTBEAT_CONFIG"
LIVE_DEPLOYMENT_FILE="$TEST_ROOT/live-deployment-id"
write_value "$LIVE_DEPLOYMENT_FILE" dpl_Test123
LIVE_STATE="$TEST_ROOT/live-state"
mkdir -p "$LIVE_STATE"
write_value "$LIVE_SITE_MODE_FILE" fail
write_value "$LIVE_ALERT_STATUS_FILE" 503
write_value "$LIVE_HEARTBEAT_STATUS_FILE" 204

run_live_stub() {
  live_output=$1
  if PATH="$LIVE_BIN:/usr/bin:/bin" \
    FAKE_CALL_LOG="$LIVE_CALL_LOG" \
    FAKE_CAPTURE_DIR="$LIVE_CAPTURE_DIR" \
    FAKE_SITE_MODE_FILE="$LIVE_SITE_MODE_FILE" \
    FAKE_ALERT_STATUS_FILE="$LIVE_ALERT_STATUS_FILE" \
    FAKE_HEARTBEAT_STATUS_FILE="$LIVE_HEARTBEAT_STATUS_FILE" \
    MONITOR_STATE_DIR="$LIVE_STATE" \
    DEPLOYMENT_ID_FILE="$LIVE_DEPLOYMENT_FILE" \
    ALERT_CURL_CONFIG_FILE="$LIVE_ALERT_CONFIG" \
    HEARTBEAT_CURL_CONFIG_FILE="$LIVE_HEARTBEAT_CONFIG" \
    "$CHECKER" > "$live_output" 2>&1
  then
    RUN_RC=0
  else
    RUN_RC=$?
  fi
}

run_live_stub "$TEST_ROOT/live-failure-1.log"
test "$RUN_RC" -eq 1 || fail "first live-stub failure must fail"
run_live_stub "$TEST_ROOT/live-failure-2.log"
test "$RUN_RC" -eq 1 || fail "second live-stub failure must fail"
run_live_stub "$TEST_ROOT/live-alert-503.log"
test "$RUN_RC" -eq 1 || fail "third live-stub failure must fail"
test "$(state_value alert_delivered "$LIVE_STATE/state")" -eq 0 ||
  fail "webhook 503 marked alert delivered"
LIVE_EVENT_ID=$(state_value incident_event_id "$LIVE_STATE/state")
test "$(find "$LIVE_CAPTURE_DIR" -type f -name 'payload-*.json' | wc -l | tr -d ' ')" -eq 1 ||
  fail "webhook 503 must capture exactly one alert attempt"

write_value "$LIVE_ALERT_STATUS_FILE" 204
run_live_stub "$TEST_ROOT/live-alert-204.log"
test "$RUN_RC" -eq 1 || fail "continued live-stub incident must remain failed"
test "$(state_value alert_delivered "$LIVE_STATE/state")" -eq 1 ||
  fail "webhook 204 did not mark alert delivered"
test "$(find "$LIVE_CAPTURE_DIR" -type f -name 'payload-*.json' | wc -l | tr -d ' ')" -eq 2 ||
  fail "webhook retry must create exactly two transport attempts"

write_value "$LIVE_SITE_MODE_FILE" healthy
run_live_stub "$TEST_ROOT/live-recovery-204.log"
test "$RUN_RC" -eq 0 || fail "live-stub recovery and heartbeat must pass"
test "$(find "$LIVE_CAPTURE_DIR" -type f -name 'payload-*.json' | wc -l | tr -d ' ')" -eq 3 ||
  fail "recovery webhook attempt missing"
for payload_number in 1 2 3
do
  payload_id=$(sed -n 's/.*"event_id":"\([^"]*\)".*/\1/p' \
    "$LIVE_CAPTURE_DIR/payload-$payload_number.json")
  test "$payload_id" = "$LIVE_EVENT_ID" || fail "webhook retry changed stable event id"
done
grep -Fq '"event":"alert"' "$LIVE_CAPTURE_DIR/payload-1.json" ||
  fail "first webhook payload is not alert"
grep -Fq '"event":"recovery"' "$LIVE_CAPTURE_DIR/payload-3.json" ||
  fail "third webhook payload is not recovery"
test "$(grep -Fxc 'delivery|alert|status=503' "$LIVE_CALL_LOG")" -eq 1 ||
  fail "non-2xx alert transport not exercised exactly once"
test "$(grep -Fxc 'delivery|alert|status=204' "$LIVE_CALL_LOG")" -eq 1 ||
  fail "2xx alert retry not exercised exactly once"
test "$(grep -Fxc 'delivery|recovery|status=204' "$LIVE_CALL_LOG")" -eq 1 ||
  fail "2xx recovery transport not exercised exactly once"
test "$(grep -Fxc 'delivery|heartbeat|status=204' "$LIVE_CALL_LOG")" -eq 5 ||
  fail "completed failed and healthy cycles must all deliver heartbeat"
if grep -R -Fq "$SECRET_CANARY" \
  "$TEST_ROOT/live-failure-1.log" \
  "$TEST_ROOT/live-failure-2.log" \
  "$TEST_ROOT/live-alert-503.log" \
  "$TEST_ROOT/live-alert-204.log" \
  "$TEST_ROOT/live-recovery-204.log" \
  "$LIVE_STATE" "$LIVE_CALL_LOG" "$LIVE_CAPTURE_DIR" 2>/dev/null
then
  fail "secret canary leaked from the live delivery code path"
fi
pass live-stub-webhook-status-retry-and-secret-redaction

BAD_FIXTURE="$TEST_ROOT/bad-fixture"
clone_fixture "$HEALTHY" "$BAD_FIXTURE"
printf '0\n1\n' > "$BAD_FIXTURE/dns.exit"
if MONITOR_STATE_DIR="$TEST_ROOT/bad-fixture-state" \
  "$CHECKER" --dry-run "$BAD_FIXTURE" > "$TEST_ROOT/bad-fixture.log" 2>&1
then
  fail "multiline raw fixture was accepted"
else
  test "$?" -eq 2 || fail "bad raw fixture must exit 2"
fi
pass raw-fixture-schema-fails-closed

unit_value() {
  unit_file=$1
  unit_section=$2
  unit_key=$3
  awk -v wanted_section="$unit_section" -v wanted_key="$unit_key" '
    /^[[:space:]]*[#;]/ || /^[[:space:]]*$/ { next }
    /^\[[^]]+\]$/ { section = substr($0, 2, length($0) - 2); next }
    section == wanted_section && index($0, wanted_key "=") == 1 {
      print substr($0, length(wanted_key) + 2)
    }
  ' "$unit_file"
}

assert_unit_value() {
  unit_file=$1
  unit_section=$2
  unit_key=$3
  unit_expected=$4
  unit_count=$(unit_value "$unit_file" "$unit_section" "$unit_key" | wc -l | tr -d ' ')
  unit_values=$(unit_value "$unit_file" "$unit_section" "$unit_key")
  test "$unit_count" -eq 1 || return 1
  test "$unit_values" = "$unit_expected"
}

validate_service() {
  service_file=$1
  for service_contract in \
    'Unit|Description|ailiu.online external availability check' \
    'Unit|Wants|network-online.target' \
    'Unit|After|network-online.target' \
    'Service|Type|oneshot' \
    'Service|User|ailiu-monitor' \
    'Service|Group|ailiu-monitor' \
    'Service|EnvironmentFile|/etc/ailiu-monitor/check-site.env' \
    'Service|ExecStart|/opt/ailiu-monitor/check-site.sh' \
    'Service|StateDirectory|ailiu-monitor' \
    'Service|StateDirectoryMode|0700' \
    'Service|UMask|0077' \
    'Service|NoNewPrivileges|true' \
    'Service|PrivateTmp|true' \
    'Service|ProtectSystem|strict' \
    'Service|ProtectHome|true' \
    'Service|ReadWritePaths|/var/lib/ailiu-monitor' \
    'Service|CapabilityBoundingSet|' \
    'Service|AmbientCapabilities|' \
    'Service|LockPersonality|true' \
    'Service|MemoryDenyWriteExecute|true' \
    'Service|ProtectClock|true' \
    'Service|ProtectControlGroups|true' \
    'Service|ProtectKernelLogs|true' \
    'Service|ProtectKernelModules|true' \
    'Service|ProtectKernelTunables|true' \
    'Service|RestrictNamespaces|true' \
    'Service|RestrictRealtime|true' \
    'Service|RestrictSUIDSGID|true' \
    'Service|SystemCallArchitectures|native' \
    'Service|TimeoutStartSec|50s' \
    'Service|StandardOutput|journal' \
    'Service|StandardError|journal'
  do
    IFS='|' read -r section key expected <<EOF
$service_contract
EOF
    assert_unit_value "$service_file" "$section" "$key" "$expected" || return 1
  done
  awk '
    /^[[:space:]]*[#;]/ || /^[[:space:]]*$/ { next }
    /^\[[^]]+\]$/ {
      section = substr($0, 2, length($0) - 2)
      if (section != "Unit" && section != "Service") exit 1
      next
    }
    index($0, "=") == 0 { exit 1 }
    section == "Unit" && $0 !~ /^(Description|Wants|After)=/ { exit 1 }
    section == "Service" && $0 !~ /^(Type|User|Group|EnvironmentFile|ExecStart|StateDirectory|StateDirectoryMode|UMask|NoNewPrivileges|PrivateTmp|ProtectSystem|ProtectHome|ReadWritePaths|CapabilityBoundingSet|AmbientCapabilities|LockPersonality|MemoryDenyWriteExecute|ProtectClock|ProtectControlGroups|ProtectKernelLogs|ProtectKernelModules|ProtectKernelTunables|RestrictNamespaces|RestrictRealtime|RestrictSUIDSGID|SystemCallArchitectures|TimeoutStartSec|StandardOutput|StandardError)=/ { exit 1 }
    END { if (section == "") exit 1 }
  ' "$service_file" || return 1
}

validate_timer() {
  timer_file=$1
  for timer_contract in \
    'Unit|Description|Run the ailiu.online availability check every minute' \
    'Timer|OnBootSec|1min' \
    'Timer|OnUnitActiveSec|1min' \
    'Timer|AccuracySec|5s' \
    'Timer|Persistent|true' \
    'Timer|RandomizedDelaySec|0' \
    'Timer|Unit|check-site.service' \
    'Install|WantedBy|timers.target'
  do
    IFS='|' read -r section key expected <<EOF
$timer_contract
EOF
    assert_unit_value "$timer_file" "$section" "$key" "$expected" || return 1
  done
  awk '
    /^[[:space:]]*[#;]/ || /^[[:space:]]*$/ { next }
    /^\[[^]]+\]$/ {
      section = substr($0, 2, length($0) - 2)
      if (section != "Unit" && section != "Timer" && section != "Install") exit 1
      next
    }
    index($0, "=") == 0 { exit 1 }
    section == "Unit" && $0 !~ /^Description=/ { exit 1 }
    section == "Timer" && $0 !~ /^(OnBootSec|OnUnitActiveSec|AccuracySec|Persistent|RandomizedDelaySec|Unit)=/ { exit 1 }
    section == "Install" && $0 !~ /^WantedBy=/ { exit 1 }
    END { if (section == "") exit 1 }
  ' "$timer_file" || return 1
}

validate_service "$SERVICE" || fail "canonical service rejected"
validate_timer "$TIMER" || fail "canonical timer rejected"

mutate_after_section() {
  input_file=$1
  section_name=$2
  mutation_line=$3
  output_file=$4
  awk -v section="[$section_name]" -v mutation="$mutation_line" '
    { print }
    $0 == section && !done { print mutation; done = 1 }
    END { if (!done) exit 1 }
  ' "$input_file" > "$output_file"
}

for service_mutation in \
  'NoNewPrivileges=false' \
  'ProtectSystem=false' \
  'ExecStart=+/bin/sh -c bad' \
  'User=root' \
  'CapabilityBoundingSet=CAP_NET_ADMIN' \
  'ReadWritePaths=/' \
  'EnvironmentFile=-/tmp/../unsafe' \
  'After=network.target'
do
  mutation_file="$TEST_ROOT/service-mutation-$(printf '%s' "$service_mutation" | tr '/= +' '_____')"
  mutation_section=Service
  case $service_mutation in After=*) mutation_section=Unit ;; esac
  mutate_after_section "$SERVICE" "$mutation_section" "$service_mutation" "$mutation_file"
  if validate_service "$mutation_file"; then
    fail "unsafe service mutation accepted: $service_mutation"
  fi
done

wrong_section_file="$TEST_ROOT/service-mutation-wrong-section"
mutate_after_section "$SERVICE" Unit 'NoNewPrivileges=false' "$wrong_section_file"
if validate_service "$wrong_section_file"; then
  fail "wrong-section service directive was accepted"
fi

for timer_mutation in \
  'OnUnitActiveSec=1s' \
  'OnUnitActiveSec=5min' \
  'Unit=other.service'
do
  mutation_file="$TEST_ROOT/timer-mutation-$(printf '%s' "$timer_mutation" | tr '/= +' '_____')"
  mutate_after_section "$TIMER" Timer "$timer_mutation" "$mutation_file"
  if validate_timer "$mutation_file"; then
    fail "unsafe timer mutation accepted: $timer_mutation"
  fi
done
pass systemd-canonical-parser-and-negative-mutations

test "$PASS_COUNT" -eq 14 || fail "expected 14 test groups, found $PASS_COUNT"
printf 'TEST SUMMARY: 14 passed\n'
