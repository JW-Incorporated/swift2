#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write) — auto-format every file Claude edits.
# Keeps diffs clean so agents never "fix" formatting they weren't asked to touch.
#
# DELIBERATELY DISABLED FOR swift2 (2026-08-13). This is a considered decision,
# not an unfilled kickoff blank — do not "helpfully" set it to prettier later
# without re-checking the three reasons below.
#
#   1. The repo is overwhelmingly NOT prettier-clean: `npx prettier --check .`
#      reports ~13.7k files with style issues, including all of
#      `supabase/seed/**`, `tsconfig.base.json` and `vitest.config.ts`. Auto-
#      formatting on save would therefore rewrite an ENTIRE file every time an
#      agent changed one line of it — the exact "reformat code you weren't
#      asked to touch" that CLAUDE.md § Mechanics forbids, and a review
#      nightmare on content PRs.
#   2. It would break `build`. `apps/web/lib/longlive/*.generated.ts` are not
#      prettier-clean either, and `scripts/check-generated-in-sync.mjs`
#      compares committed text against freshly generated text. One formatted
#      generated file => `npm run check:generated` exits 1 => red PR.
#   3. There is nothing to keep green. CI runs no prettier/format step at all
#      (see .github/workflows/ci.yml), so formatting on save buys no check.
#
# `npm run format:write` remains available to run deliberately, on purpose,
# scoped to files someone actually intends to reformat.
#
# If a future project DOES want this, set FORMAT_CMD for the stack, e.g.:
#   FORMAT_CMD="npx prettier --write"     # JS/TS
#   FORMAT_CMD="black"                    # Python
#   FORMAT_CMD="gofmt -w"                 # Go
# and exclude generated files before enabling it.

FORMAT_CMD=""

[ -z "$FORMAT_CMD" ] && exit 0

# Verified-runnable Python resolver (Windows Store fake-python3 stub defense) —
# the kit's generic copy called `python3` directly, which silently no-ops on
# this machine. Same resolver the other three hooks use.
PYBIN=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "" >/dev/null 2>&1; then PYBIN="$c"; break; fi
done
[ -z "$PYBIN" ] && { echo "[kit] WARNING: python not found; post-edit.sh is NOT enforcing" >&2; exit 0; }  # fail open: no python, no formatting

f=$("$PYBIN" -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)

# Never touch generated output — check-generated-in-sync.mjs compares it byte-wise.
case "$f" in *.generated.*) exit 0 ;; esac

[ -n "$f" ] && [ -f "$f" ] && $FORMAT_CMD "$f" >/dev/null 2>&1

exit 0
