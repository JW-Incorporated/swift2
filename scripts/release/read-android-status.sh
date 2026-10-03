#!/usr/bin/env bash
# Reads the EAS Android store-build job status for workflow run $RUN_ID.
# `eas workflow:status --json` PRINTS the full JSON and then exits 11 when the
# run is FAILURE (12 when CANCELED) (eas-cli build/commands/workflow/status.js),
# so 0/11/12 all mean "JSON printed"; anything else is a real failure.
# Emits `result=` / `build_id=` lines on stdout (append to $GITHUB_OUTPUT);
# all logging goes to stderr. Selection logic: select-android-build.mjs.
set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
OUT="$WORK/status.json"
ERR="$WORK/status.err"
SEL="$WORK/android_job.out"

RESULT=unknown
BUILD_ID=

rc=0
eas workflow:status "${RUN_ID:-}" --non-interactive --json > "$OUT" 2> "$ERR" || rc=$?
echo "eas workflow:status exit code: $rc" >&2

case "$rc" in
  0 | 11 | 12)
    node "$HERE/select-android-build.mjs" "$OUT" > "$SEL" || true
    RESULT=$(sed -n 's/^result=//p' "$SEL")
    BUILD_ID=$(sed -n 's/^build_id=//p' "$SEL")
    RESULT=${RESULT:-unknown}
    ;;
  *)
    echo "eas workflow:status failed; last 20 lines of stderr:" >&2
    tail -n 20 "$ERR" >&2
    ;;
esac

echo "Android store-build job: $RESULT; build id: ${BUILD_ID:-none}" >&2
echo "result=$RESULT"
echo "build_id=$BUILD_ID"
