#!/usr/bin/env bash
# Durable dedupe ledger for the reply notifier (social-reply-notifier.yml).
#
#   reply-ledger.sh fetch   download reply-ledger.json from the dedicated
#                           `social-reply-ledger` branch; if the branch does not
#                           exist yet, create it with an empty ledger FIRST — so
#                           a push problem fails the run before anything is sent
#                           to Discord, never after.
#   reply-ledger.sh push    push the file back if it changed.
#
# The branch holds exactly one file and is written with plumbing (scratch index
# + commit-tree), never a checkout, so it cannot touch the working tree. It is
# separate from `social-ledger` on purpose: that branch's writers snapshot whole
# namespaces, and a stray file there would be dropped or collide with them.
# Writes are serialized by the workflow's concurrency group.
set -euo pipefail

BRANCH="social-reply-ledger"
FILE="${REPLY_LEDGER_PATH:-${RUNNER_TEMP:-/tmp}/reply-ledger.json}"
ORIG="$FILE.orig"
EMPTY='{"version":1,"seeded":{},"seen":{},"disabledLogged":{}}'

branch_exists() {
  git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1
}

push_file() {
  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"
  local blob idx parent tree commit attempt
  blob=$(git hash-object -w "$FILE")
  idx=$(mktemp -u)
  for attempt in 1 2 3; do
    parent=()
    if branch_exists; then
      git fetch -q origin "$BRANCH"
      parent=(-p "$(git rev-parse FETCH_HEAD)")
    fi
    rm -f "$idx"
    GIT_INDEX_FILE="$idx" git update-index --add --cacheinfo "100644,$blob,reply-ledger.json"
    tree=$(GIT_INDEX_FILE="$idx" git write-tree)
    commit=$(git commit-tree "$tree" "${parent[@]}" -m "reply-notifier: ledger $(date -u +%Y-%m-%dT%H:%M:%SZ)")
    if git push -q origin "$commit:refs/heads/$BRANCH"; then
      echo "reply ledger pushed -> $commit"
      return 0
    fi
    sleep 2
  done
  echo "::error::reply-notifier: could not push $BRANCH after 3 attempts"
  return 1
}

case "${1:-}" in
  fetch)
    if branch_exists; then
      git fetch -q origin "$BRANCH"
      git show "FETCH_HEAD:reply-ledger.json" > "$FILE"
    else
      echo "$BRANCH does not exist — creating it with an empty ledger"
      echo "$EMPTY" > "$FILE"
      push_file
    fi
    cp "$FILE" "$ORIG"
    ;;
  push)
    if cmp -s "$FILE" "$ORIG"; then
      echo "reply ledger unchanged"
    else
      push_file
      cp "$FILE" "$ORIG"
    fi
    ;;
  *)
    echo "usage: reply-ledger.sh fetch|push" >&2
    exit 2
    ;;
esac
