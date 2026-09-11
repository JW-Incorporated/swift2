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

# --- unrelated command stays allowed ---
assert_allowed "plain unrelated command" \
  "echo hello"

if [ "$FAIL" -ne 0 ]; then
  echo "guard.test.sh: FAILURES ABOVE"
  exit 1
fi
echo "guard.test.sh: all assertions passed"
