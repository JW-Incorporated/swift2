#!/usr/bin/env bash
# Source me: `. scripts/watchdog/gh-retry.sh`, then `gh_retry gh issue list ...`.
# Runs the command up to 3 times (backoff 5s, 15s), retrying only on a non-zero
# exit and logging a ::warning:: per retry. After the 3rd failure it returns the
# command's own exit code, so callers behave exactly as they did without it.
# Added 2026-10-06: one transient "GraphQL: Something went wrong" blip in a
# daily-only alert path used to skip a whole day of alerts. GH_RETRY_SLEEPS
# (space-separated seconds) overrides the backoff, for tests.
gh_retry() {
  local sleeps=(${GH_RETRY_SLEEPS:-5 15}) attempt=1 rc=0
  while true; do
    "$@" && return 0
    rc=$?
    [ "$attempt" -ge 3 ] && return "$rc"
    echo "::warning::'$1 $2 $3' failed (exit $rc), retry $attempt/2 in ${sleeps[$((attempt - 1))]}s" >&2
    sleep "${sleeps[$((attempt - 1))]}"
    attempt=$((attempt + 1))
  done
}
