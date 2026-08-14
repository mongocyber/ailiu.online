#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

pass() {
  printf 'PASS: %s\n' "$1"
}

require_clean_worktree() {
  phase=$1
  git diff --quiet ||
    fail "worktree has unstaged tracked changes at $phase"
  git diff --cached --quiet ||
    fail "worktree has staged changes at $phase"
  test -z "$(git ls-files --others --exclude-standard)" ||
    fail "worktree has untracked files at $phase"
}

require_clean_worktree "verification entry"
pass "clean worktree at entry"

command -v node >/dev/null 2>&1 || fail "Node.js is required"
node_major=$(node -p 'Number(process.versions.node.split(".")[0])')
case "$node_major" in
  ''|*[!0-9]*) fail "unable to determine Node.js major version" ;;
esac
test "$node_major" -ge 20 ||
  fail "Node.js 20 or newer is required; found major $node_major"
pass "Node.js 20+"

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/ailiu-verify.XXXXXX")
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

for required_file in \
  AGENTS.md \
  CLAUDE.md \
  docs/OPERATIONS.md \
  docs/ai/PROJECT_CONTEXT.md \
  docs/ai/RULE_ACCOUNTABILITY.md \
  .github/pull_request_template.md \
  ops/monitoring/check-site.sh \
  ops/monitoring/check-site.env.example \
  ops/monitoring/check-site.service \
  ops/monitoring/check-site.timer \
  ops/monitoring/test-check-site.sh
do
  test -f "$required_file" || fail "missing required file: $required_file"
done
pass "required core surfaces exist"

require_tracked_regular_mode() {
  required_path=$1
  expected_mode=$2
  tracked_entry=$(git ls-files -s -- "$required_path")
  tracked_count=$(printf '%s\n' "$tracked_entry" | awk 'NF { count++ } END { print count + 0 }')
  test "$tracked_count" -eq 1 ||
    fail "monitoring artifact must be tracked exactly once: $required_path"
  actual_mode=$(printf '%s\n' "$tracked_entry" | awk 'NF { print $1 }')
  test "$actual_mode" = "$expected_mode" ||
    fail "monitoring artifact mode mismatch for $required_path: $actual_mode"
  test -f "$required_path" && test ! -L "$required_path" ||
    fail "monitoring artifact must be a regular non-symlink: $required_path"
}

require_tracked_regular_mode ops/monitoring/check-site.sh 100755
require_tracked_regular_mode ops/monitoring/test-check-site.sh 100755
for monitoring_data_file in \
  ops/monitoring/check-site.env.example \
  ops/monitoring/check-site.service \
  ops/monitoring/check-site.timer
do
  require_tracked_regular_mode "$monitoring_data_file" 100644
done
pass "tracked monitoring artifacts and exact modes"

sh -n ops/monitoring/check-site.sh || fail "monitor checker shell syntax"
sh -n ops/monitoring/test-check-site.sh || fail "monitor test shell syntax"

monitor_test_log="$temp_dir/monitor-tests.log"
ops/monitoring/test-check-site.sh > "$monitor_test_log" 2>&1 || {
  sed -n '1,80p' "$monitor_test_log" >&2
  fail "offline monitoring fixture suite"
}
for monitor_test_name in \
  raw-transport-healthy \
  deterministic-failure-classification \
  persistent-failure-count-across-classes \
  third-failure-single-logical-alert \
  single-recovery-after-all-checks-pass \
  repeated-incidents-remain-independent \
  transient-failures-do-not-create-events \
  alert-retry-keeps-stable-event-id \
  recovery-retry-keeps-stable-event-id \
  corrupt-state-fails-closed \
  lock-and-state-path-safety \
  live-stub-webhook-status-retry-and-secret-redaction \
  raw-fixture-schema-fails-closed \
  systemd-canonical-parser-and-negative-mutations
do
  test "$(grep -Fxc "TEST PASS: $monitor_test_name" "$monitor_test_log")" -eq 1 ||
    fail "missing or duplicate monitoring test evidence: $monitor_test_name"
done
test "$(grep -c '^TEST PASS:' "$monitor_test_log")" -eq 14 ||
  fail "monitoring fixture suite emitted an unexpected test set"
test "$(grep -Fxc 'TEST SUMMARY: 14 passed' "$monitor_test_log")" -eq 1 ||
  fail "monitoring fixture suite summary mismatch"
test "$(grep -Fxc 'ALERT_CURL_CONFIG_FILE=' ops/monitoring/check-site.env.example)" -eq 1 ||
  fail "alert curl config example must remain empty"
test "$(grep -Fxc 'HEARTBEAT_CURL_CONFIG_FILE=' ops/monitoring/check-site.env.example)" -eq 1 ||
  fail "heartbeat curl config example must remain empty"
awk -F '=' '
  /^[[:space:]]*#/ || /^[[:space:]]*$/ { next }
  NF != 2 || $1 !~ /^[A-Z][A-Z0-9_]*$/ { exit 1 }
  { print $1 }
' ops/monitoring/check-site.env.example > "$temp_dir/monitor-env-keys-raw" ||
  fail "monitoring environment example is non-canonical"
LC_ALL=C sort "$temp_dir/monitor-env-keys-raw" > "$temp_dir/monitor-env-keys"
monitor_env_keys=$(cat "$temp_dir/monitor-env-keys")
expected_monitor_env_keys=$(printf '%s\n' \
  ALERT_CURL_CONFIG_FILE \
  DEPLOYMENT_ID_FILE \
  HEARTBEAT_CURL_CONFIG_FILE \
  HTTP_TIMEOUT_SECONDS \
  MONITOR_STATE_DIR \
  SITE_BASE_URL \
  SITE_HOST | LC_ALL=C sort)
test "$monitor_env_keys" = "$expected_monitor_env_keys" ||
  fail "monitoring environment example key allowlist mismatch"
pass "offline monitoring state, classification, secret, and systemd contracts"

agent_lines=$(wc -l < AGENTS.md | tr -d ' ')
if test "$agent_lines" -lt 50 || test "$agent_lines" -gt 100; then
  fail "AGENTS.md must contain 50-100 lines; found $agent_lines"
fi
test "$(grep -Fxc 'Capability: core' AGENTS.md)" -eq 1 ||
  fail "AGENTS.md must declare Capability: core exactly once"
for required_link in \
  'https://linear.app/mongocyber/issue/MON-106/external-proof-adopt-the-core-project-harness-in-ai流' \
  'docs/ai/PROJECT_CONTEXT.md' \
  'docs/ai/RULE_ACCOUNTABILITY.md' \
  '.github/pull_request_template.md'
do
  grep -Fq "$required_link" AGENTS.md ||
    fail "AGENTS.md is missing required link: $required_link"
done
test "$(grep -Foc './scripts/verify.sh' AGENTS.md)" -eq 1 ||
  fail "AGENTS.md must reference the single verify entry exactly once"
if grep -Eq '[0-9a-f]{40}' AGENTS.md; then
  fail "AGENTS.md must not copy an exact revision"
fi
if grep -Eiq 'AI CTO|control[ -]plane|permanent (writer|reviewer)|cap_facts|/skills/' AGENTS.md; then
  fail "AGENTS.md contains a non-neutral authority or external-skill dependency"
fi
pass "canonical instruction contract"

test "$(cat CLAUDE.md)" = '@AGENTS.md' ||
  fail "CLAUDE.md must contain only @AGENTS.md"
pass "CLAUDE.md import-only contract"

parse_rule_matrix() {
  matrix_file=$1
  output_file=$2
  contracts_file=$3

  : > "$contracts_file"

  awk -F '|' -v contracts_file="$contracts_file" '
    function report(message) {
      printf "%s at line %d\n", message, NR > "/dev/stderr"
      invalid = 1
    }
    function canonical_field(raw, value) {
      if (length(raw) < 3 || substr(raw, 1, 1) != " " ||
          substr(raw, length(raw), 1) != " ") {
        return ""
      }
      value = substr(raw, 2, length(raw) - 2)
      if (value == "" || value ~ /^[[:space:]]/ || value ~ /[[:space:]]$/) {
        return ""
      }
      return value
    }
    function valid_enforcement(value, parts, count, item, seen) {
      gsub(/, and /, ",", value)
      gsub(/ and /, ",", value)
      gsub(/, /, ",", value)
      count = split(value, parts, ",")
      if (count == 0) {
        return 0
      }
      split("", seen)
      for (item = 1; item <= count; item++) {
        if (parts[item] !~ /^(Deterministic|Executable|Semantic|Human)$/ ||
            seen[parts[item]]++) {
          return 0
        }
      }
      return 1
    }
    BEGIN {
      header = "| Rule | Trigger | Enforcement Layer | Evidence | Failure Action | Removal Condition |"
      separator = "| --- | --- | --- | --- | --- | --- |"
      phase = "preamble"
    }
    $0 == header {
      if (phase != "preamble" || header_seen) {
        report("duplicate or misplaced Matrix header")
      } else {
        header_seen = 1
        phase = "separator"
      }
      next
    }
    phase == "preamble" {
      next
    }
    phase == "separator" {
      if ($0 != separator) {
        report("Matrix separator must use the canonical six-column format")
      } else {
        separator_seen = 1
        phase = "rows"
      }
      next
    }
    phase == "rows" {
      rows++
      row_invalid = 0
      if (NF != 8 || $1 != "" || $8 != "") {
        report("Matrix row must be an opening-pipe, six-column canonical table row")
        next
      }
      for (column = 2; column <= 7; column++) {
        fields[column] = canonical_field($column)
        if (fields[column] == "") {
          report("Matrix row contains an empty or non-canonical field")
          row_invalid = 1
        }
      }
      rule_separator = index(fields[2], " — ")
      if (rule_separator < 2 ||
          substr(fields[2], rule_separator + 3) == "") {
        report("Matrix rule field must contain a canonical ID and title")
        row_invalid = 1
      } else {
        rule_id = substr(fields[2], 1, rule_separator - 1)
        if (rule_id !~ /^(R[1-9][0-9]*|O[1-9][0-9]*[A-Z]?)$/) {
          report("Matrix rule ID is non-canonical")
          row_invalid = 1
        }
      }
      if (!valid_enforcement(fields[4])) {
        report("Matrix row has an invalid enforcement layer")
        row_invalid = 1
      }
      if (!row_invalid) {
        if (seen[rule_id]++) {
          report("Matrix contains a duplicate rule ID")
        } else {
          print rule_id
          printf "%s|%s\n", rule_id, fields[4] >> contracts_file
          if (rule_id ~ /^R/) {
            r_rows++
          } else {
            o_rows++
          }
        }
      }
      next
    }
    END {
      if (!header_seen) {
        print "Matrix has no canonical header" > "/dev/stderr"
        invalid = 1
      }
      if (!separator_seen) {
        print "Matrix has no canonical separator" > "/dev/stderr"
        invalid = 1
      }
      if (rows == 0 || r_rows == 0 || o_rows == 0) {
        print "Matrix must contain canonical R and O rule rows" > "/dev/stderr"
        invalid = 1
      }
      if (invalid) {
        exit 1
      }
    }
  ' "$matrix_file" > "$output_file"
}

extract_source_rule_ids() {
  source_kind=$1
  source_file=$2
  output_file=$3

  awk -v source_kind="$source_kind" '
    source_kind == "R" &&
      ($0 ~ /^- \[R[1-9][0-9]*\] / || $0 ~ /^\[R[1-9][0-9]*\] /) {
      value = $0
      sub(/^-? ?\[/, "", value)
      sub(/\].*$/, "", value)
      print value
      next
    }
    source_kind == "O" &&
      ($0 ~ /^##+ [^[]+ \[O[1-9][0-9]*[A-Z]?\]$/ ||
       $0 ~ /^[1-9][0-9]*\. \*\*[^[]+ \[O[1-9][0-9]*[A-Z]?\]\*\*$/) {
      value = $0
      sub(/^.*\[/, "", value)
      sub(/\].*$/, "", value)
      print value
    }
  ' "$source_file" > "$output_file"
}

verify_rule_accountability() {
  agents_file=$1
  operations_file=$2
  matrix_file=$3
  scratch_dir=$4

  mkdir -p "$scratch_dir"
  parse_rule_matrix \
    "$matrix_file" \
    "$scratch_dir/matrix-rules-raw" \
    "$scratch_dir/matrix-contracts-raw" ||
    return 1
  extract_source_rule_ids R "$agents_file" "$scratch_dir/agent-rules-raw"
  extract_source_rule_ids O "$operations_file" "$scratch_dir/operations-rules-raw"

  for rule_source in agent operations matrix
  do
    LC_ALL=C sort "$scratch_dir/$rule_source-rules-raw" \
      > "$scratch_dir/$rule_source-rules"
    test -s "$scratch_dir/$rule_source-rules" || {
      printf '%s\n' "$rule_source rule source has no canonical IDs" >&2
      return 1
    }
    test -z "$(uniq -d "$scratch_dir/$rule_source-rules")" || {
      printf '%s\n' "$rule_source rule source contains duplicate rule IDs" >&2
      return 1
    }
  done

  grep '^R' "$scratch_dir/matrix-rules" > "$scratch_dir/matrix-r-rules" ||
    return 1
  grep '^O' "$scratch_dir/matrix-rules" > "$scratch_dir/matrix-o-rules" ||
    return 1
  test -z "$(comm -23 "$scratch_dir/agent-rules" "$scratch_dir/matrix-r-rules")" ||
    return 1
  test -z "$(comm -13 "$scratch_dir/agent-rules" "$scratch_dir/matrix-r-rules")" ||
    return 1
  test -z "$(comm -23 "$scratch_dir/operations-rules" "$scratch_dir/matrix-o-rules")" ||
    return 1
  test -z "$(comm -13 "$scratch_dir/operations-rules" "$scratch_dir/matrix-o-rules")" ||
    return 1

  for monitoring_contract in \
    'O9|Executable, Semantic, and Human' \
    'O9A|Deterministic and Executable' \
    'O9B|Deterministic, Executable, and Semantic' \
    'O9C|Deterministic and Executable' \
    'O9D|Semantic and Human'
  do
    test "$(grep -Fxc "$monitoring_contract" "$scratch_dir/matrix-contracts-raw")" -eq 1 ||
      return 1
  done
  test "$(grep -Fxc \
    '`IMPLEMENTED / VERIFIED WITH FIXTURES ONLY / NOT INSTALLED / NOT DEPLOYED / NOT LIVE`。' \
    "$operations_file")" -eq 1 || return 1
}

make_matrix_mutation() {
  mutation=$1
  output_file=$2

  awk -F '|' -v OFS='|' -v mutation="$mutation" '
    $0 == "| Rule | Trigger | Enforcement Layer | Evidence | Failure Action | Removal Condition |" &&
      mutation == "prose_before_table" {
      print "R999 — prose with | separators is not a Matrix table row"
      applied = 1
    }
    $0 == "| Rule | Trigger | Enforcement Layer | Evidence | Failure Action | Removal Condition |" &&
      mutation == "prose_cannot_replace_row" {
      print "O6D — prose mention | cannot replace a Matrix table row"
      applied = 1
    }
    index($0, "| R1 — ") == 1 && mutation == "leading_space" {
      print " " $0
      applied = 1
      next
    }
    index($0, "| R1 — ") == 1 && mutation == "three_leading_spaces" {
      print "   " $0
      applied = 1
      next
    }
    index($0, "| R1 — ") == 1 && mutation == "missing_opening_pipe" {
      print substr($0, 3)
      applied = 1
      next
    }
    index($0, "| R1 — ") == 1 && mutation == "missing_r_row" {
      applied = 1
      next
    }
    index($0, "| O6D — ") == 1 && mutation == "missing_o_row" {
      applied = 1
      next
    }
    index($0, "| O9C — ") == 1 && mutation == "missing_monitoring_row" {
      applied = 1
      next
    }
    index($0, "| O9A — ") == 1 && mutation == "downgrade_o9a_enforcement" {
      $4 = " Semantic "
      print
      applied = 1
      next
    }
    index($0, "| O9C — ") == 1 && mutation == "downgrade_o9c_enforcement" {
      $4 = " Semantic and Human "
      print
      applied = 1
      next
    }
    index($0, "| O6D — ") == 1 && mutation == "prose_cannot_replace_row" {
      next
    }
    index($0, "| O6D — ") == 1 && mutation == "padded_id" {
      sub(/^\| O6D/, "|  O6D")
      print
      applied = 1
      next
    }
    index($0, "| O6D — ") == 1 && mutation == "duplicate_id" {
      print
      print
      applied = 1
      next
    }
    index($0, "| O6D — ") == 1 && mutation == "canonical_row" {
      $2 = " O6D — Canonical parser probe "
      print
      applied = 1
      next
    }
    index($0, "| O6C — ") == 1 && mutation == "empty_trigger" {
      $3 = " "
      print
      applied = 1
      next
    }
    index($0, "| O6C — ") == 1 && mutation == "empty_enforcement" {
      $4 = " "
      print
      applied = 1
      next
    }
    index($0, "| O6C — ") == 1 && mutation == "invalid_enforcement" {
      $4 = " Advisory "
      print
      applied = 1
      next
    }
    index($0, "| O6C — ") == 1 && mutation == "empty_evidence" {
      $5 = " "
      print
      applied = 1
      next
    }
    index($0, "| O6C — ") == 1 && mutation == "empty_failure_action" {
      $6 = " "
      print
      applied = 1
      next
    }
    index($0, "| O6C — ") == 1 && mutation == "empty_removal" {
      $7 = " "
      print
      applied = 1
      next
    }
    {
      print
    }
    END {
      if (!applied) {
        exit 1
      }
    }
  ' docs/ai/RULE_ACCOUNTABILITY.md > "$output_file"
}

make_operations_mutation() {
  output_file=$1
  awk '
    $0 == "`IMPLEMENTED / VERIFIED WITH FIXTURES ONLY / NOT INSTALLED / NOT DEPLOYED / NOT LIVE`。" {
      print "`IMPLEMENTED / VERIFIED / INSTALLED / DEPLOYED / LIVE`。"
      applied = 1
      next
    }
    { print }
    END { if (!applied) exit 1 }
  ' docs/OPERATIONS.md > "$output_file"
}

run_operations_status_probe() {
  probe_dir="$temp_dir/probe-monitoring-status-live"
  probe_operations="$probe_dir/OPERATIONS.md"
  probe_log="$probe_dir/output.log"
  mkdir -p "$probe_dir"
  make_operations_mutation "$probe_operations" ||
    fail "unable to build monitoring status mutation probe"
  if verify_rule_accountability \
    AGENTS.md \
    "$probe_operations" \
    docs/ai/RULE_ACCOUNTABILITY.md \
    "$probe_dir/check" > "$probe_log" 2>&1
  then
    fail "invalid monitoring LIVE status mutation was accepted"
  fi
}

run_matrix_probe() {
  probe_name=$1
  mutation=$2
  expectation=$3
  probe_dir="$temp_dir/probe-$probe_name"
  probe_matrix="$probe_dir/RULE_ACCOUNTABILITY.md"
  probe_log="$probe_dir/output.log"

  mkdir -p "$probe_dir"
  make_matrix_mutation "$mutation" "$probe_matrix" ||
    fail "unable to build Matrix mutation probe: $probe_name"
  if test "$expectation" = pass; then
    verify_rule_accountability \
      AGENTS.md \
      docs/OPERATIONS.md \
      "$probe_matrix" \
      "$probe_dir/check" > "$probe_log" 2>&1 || {
        sed -n '1,20p' "$probe_log" >&2
        fail "valid Matrix mutation probe was rejected: $probe_name"
      }
  elif verify_rule_accountability \
    AGENTS.md \
    docs/OPERATIONS.md \
    "$probe_matrix" \
    "$probe_dir/check" > "$probe_log" 2>&1
  then
    fail "invalid Matrix mutation probe was accepted: $probe_name"
  fi
}

verify_rule_accountability \
  AGENTS.md \
  docs/OPERATIONS.md \
  docs/ai/RULE_ACCOUNTABILITY.md \
  "$temp_dir/live-accountability" ||
  fail "Rule Accountability Matrix is incomplete or inconsistent"

run_matrix_probe canonical-row canonical_row pass
run_matrix_probe prose-before-table prose_before_table pass
run_matrix_probe leading-space leading_space fail
run_matrix_probe three-leading-spaces three_leading_spaces fail
run_matrix_probe missing-opening-pipe missing_opening_pipe fail
run_matrix_probe padded-id padded_id fail
run_matrix_probe duplicate-id duplicate_id fail
run_matrix_probe missing-r-row missing_r_row fail
run_matrix_probe missing-o-row missing_o_row fail
run_matrix_probe missing-monitoring-row missing_monitoring_row fail
run_matrix_probe downgrade-o9a-enforcement downgrade_o9a_enforcement fail
run_matrix_probe downgrade-o9c-enforcement downgrade_o9c_enforcement fail
run_matrix_probe prose-cannot-replace-row prose_cannot_replace_row fail
run_matrix_probe empty-trigger empty_trigger fail
run_matrix_probe empty-enforcement empty_enforcement fail
run_matrix_probe invalid-enforcement invalid_enforcement fail
run_matrix_probe empty-evidence empty_evidence fail
run_matrix_probe empty-failure-action empty_failure_action fail
run_matrix_probe empty-removal empty_removal fail
run_operations_status_probe
pass "Rule Accountability Matrix parser and mutation probes"

for checklist_field in \
  'Target state:' \
  'Risk:' \
  'Baseline revision:' \
  'Candidate revision:' \
  'Changed paths:' \
  'Independent review:' \
  'Stop-line confirmation:'
do
  grep -Fq "$checklist_field" .github/pull_request_template.md ||
    fail "PR checklist is missing field: $checklist_field"
done
pass "native PR checklist fields"

npm run lint
pass "lint"
npm run build
pass "production build"

require_clean_worktree "verification exit"
pass "clean worktree at exit"

printf 'VERIFY OK: ailiu.online core harness checks passed\n'
