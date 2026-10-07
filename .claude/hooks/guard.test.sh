#!/usr/bin/env bash
# Minimal fixture for guard.sh — no existing test harness for this file as of
# tree-overhaul epic #4117 task A5, so this is a from-scratch smoke test.
# Feeds guard.sh the same PreToolUse JSON shape Claude Code sends and asserts
# on whether it prints a `"permissionDecision": "deny"` payload.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

GUARD=".claude/hooks/guard.sh"
FAIL=0

assert_denied() {
  local desc="$1" cmd="$2"
  local out
  out=$(printf '%s' "$cmd" | python3 -c '
import json, sys
print(json.dumps({"tool_input": {"command": sys.stdin.read()}, "session_id": "test", "cwd": "."}))
' | bash "$GUARD")
  if echo "$out" | grep -q '"permissionDecision": *"deny"'; then
    echo "PASS: $desc (denied)"
  else
    echo "FAIL: $desc — expected deny, got: $out"
    FAIL=1
  fi
}

assert_allowed() {
  local desc="$1" cmd="$2"
  local out
  out=$(printf '%s' "$cmd" | python3 -c '
import json, sys
print(json.dumps({"tool_input": {"command": sys.stdin.read()}, "session_id": "test", "cwd": "."}))
' | bash "$GUARD")
  if echo "$out" | grep -q '"permissionDecision": *"deny"'; then
    echo "FAIL: $desc — expected allow, got denied: $out"
    FAIL=1
  else
    echo "PASS: $desc (allowed)"
  fi
}

# --- delete-x-site-screens.mjs (task A5) ---
assert_denied "node scripts/social/delete-x-site-screens.mjs" \
  "node scripts/social/delete-x-site-screens.mjs"
assert_denied "cd scripts/social && node delete-x-site-screens.mjs" \
  "cd scripts/social && node delete-x-site-screens.mjs"
assert_allowed "grep for delete-x-site-screens.mjs (not executed)" \
  "grep -rn delete-x-site-screens.mjs scripts/"

# --- gh workflow run remove-x-site-screens (task A5) ---
assert_denied "gh workflow run remove-x-site-screens" \
  "gh workflow run remove-x-site-screens"
assert_denied "gh workflow run remove-x-site-screens.yml" \
  "gh workflow run remove-x-site-screens.yml"
assert_allowed "gh workflow run unrelated.yml" \
  "gh workflow run unrelated.yml"

# --- gh secret/variable mutation vs the set-switch wrapper (2026-10-06) ---
assert_denied "gh secret set" "gh secret set X_API_KEY --body abc"
assert_denied "gh secret delete" "gh secret delete X_API_KEY"
assert_denied "gh variable delete" "gh variable delete SOCIAL_FREEZE"
assert_denied "raw gh variable set" "gh variable set SOCIAL_FREEZE --body false"
assert_denied "raw gh variable set with --repo" "gh variable set BOT_CHAT_ENABLED --repo JW-Incorporated/swift2 --body true"
assert_allowed "set-switch wrapper" \
  "node scripts/ops/set-switch.mjs BOT_CHAT_ENABLED true --reason \"launch\""
assert_allowed "gh variable get" "gh variable get SOCIAL_FREEZE"
assert_allowed "gh variable list" "gh variable list --repo JW-Incorporated/swift2"
assert_allowed "gh secret list" "gh secret list"

# flag-first CLI forms
assert_denied "gh -R variable set" "gh -R JW-Incorporated/swift2 variable set SOCIAL_FREEZE --body false"
assert_denied "gh --repo secret set" "gh --repo JW-Incorporated/swift2 secret set X_API_KEY --body abc"
assert_denied "gh -R variable delete" "gh -R o/r variable delete SOCIAL_FREEZE"
assert_denied "gh --repo secret remove" "gh --repo o/r secret remove X_API_KEY"

# REST writes to the Actions variables/secrets API
assert_denied "gh api -X PUT variables" \
  "gh api -X PUT repos/JW-Incorporated/swift2/actions/variables/SOCIAL_FREEZE -f value=false"
assert_denied "gh api --method PATCH variables" \
  "gh api --method PATCH repos/o/r/actions/variables/SOCIAL_FREEZE -f value=false"
assert_denied "gh api -X DELETE variables" \
  "gh api -X DELETE repos/o/r/actions/variables/SOCIAL_FREEZE"
assert_denied "gh api POST with fields (implied)" \
  "gh api repos/o/r/actions/variables -f name=X -f value=y"
assert_denied "gh api --input secrets" \
  "gh api repos/o/r/actions/secrets/X --input body.json"
assert_denied "gh api -X PUT environment secrets" \
  "gh api -X PUT repos/o/r/environments/social/secrets/X"
assert_denied "gh api -X PUT org variables" \
  "gh api -X PUT orgs/JW-Incorporated/actions/variables/X"
assert_denied "gh -R flag then api write" \
  "gh api --method=POST repos/o/r/actions/variables"
assert_denied "curl -X PATCH variables" \
  "curl -X PATCH -H 'Authorization: token t' https://api.github.com/repos/o/r/actions/variables/SOCIAL_FREEZE -d '{\"value\":\"false\"}'"
assert_denied "curl --request DELETE secrets" \
  "curl --request DELETE https://api.github.com/repos/o/r/actions/secrets/X"
assert_denied "curl -d implies POST" \
  "curl -d '{}' https://api.github.com/repos/o/r/actions/variables"
assert_allowed "gh api GET variables" "gh api repos/JW-Incorporated/swift2/actions/variables"
assert_allowed "gh api explicit GET" "gh api -X GET repos/o/r/actions/variables/SOCIAL_FREEZE"
assert_allowed "gh api GET with jq" "gh api repos/o/r/actions/variables --jq '.variables[].name'"
assert_allowed "curl GET variables" "curl https://api.github.com/repos/o/r/actions/variables"
assert_allowed "gh api write to an unrelated path" "gh api -X POST repos/o/r/issues -f title=t"

# --- unrelated command stays allowed ---
assert_allowed "plain unrelated command" \
  "echo hello"

if [ "$FAIL" -ne 0 ]; then
  echo "guard.test.sh: FAILURES ABOVE"
  exit 1
fi
echo "guard.test.sh: all assertions passed"
