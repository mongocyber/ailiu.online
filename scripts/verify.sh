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

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/ailiu-verify.XXXXXX")
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

git status --porcelain=v1 --untracked-files=all > "$temp_dir/status-before"

for required_file in \
  AGENTS.md \
  CLAUDE.md \
  docs/ai/PROJECT_CONTEXT.md \
  docs/ai/RULE_ACCOUNTABILITY.md \
  .github/pull_request_template.md
do
  test -f "$required_file" || fail "missing required file: $required_file"
done
pass "required core surfaces exist"

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

matrix_header='| Rule | Trigger | Enforcement Layer | Evidence | Failure Action | Removal Condition |'
grep -Fxq "$matrix_header" docs/ai/RULE_ACCOUNTABILITY.md ||
  fail "Rule Accountability Matrix header is incomplete"
awk -F '|' '
  /^\| R[0-9]+ / {
    rows++
    for (column = 2; column <= 7; column++) {
      value = $column
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      if (value == "") {
        printf "incomplete Matrix field at line %d\n", NR > "/dev/stderr"
        exit 1
      }
    }
    if ($4 !~ /(Deterministic|Executable|Semantic|Human)/) {
      printf "missing enforcement layer at line %d\n", NR > "/dev/stderr"
      exit 1
    }
  }
  END {
    if (rows == 0) {
      print "Matrix has no rule rows" > "/dev/stderr"
      exit 1
    }
  }
' docs/ai/RULE_ACCOUNTABILITY.md ||
  fail "Rule Accountability Matrix rows are incomplete"

grep -Eo '\[R[0-9]+\]' AGENTS.md | tr -d '[]' | sort -u > "$temp_dir/agent-rules"
sed -n 's/^| \(R[0-9][0-9]*\) .*/\1/p' docs/ai/RULE_ACCOUNTABILITY.md |
  sort > "$temp_dir/matrix-rules"
test -s "$temp_dir/matrix-rules" || fail "Rule Accountability Matrix has no parseable IDs"
test -z "$(comm -23 "$temp_dir/agent-rules" "$temp_dir/matrix-rules")" ||
  fail "an AGENTS.md hard rule is missing from the Matrix"
test -z "$(comm -13 "$temp_dir/agent-rules" "$temp_dir/matrix-rules")" ||
  fail "the Matrix contains a rule absent from AGENTS.md"
test -z "$(uniq -d "$temp_dir/matrix-rules")" ||
  fail "Rule Accountability Matrix contains duplicate rule IDs"
pass "Rule Accountability Matrix completeness"

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

git status --porcelain=v1 --untracked-files=all > "$temp_dir/status-after"
cmp -s "$temp_dir/status-before" "$temp_dir/status-after" ||
  fail "verification changed tracked or untracked worktree state"
pass "worktree state unchanged"

printf 'VERIFY OK: ailiu.online core harness checks passed\n'
