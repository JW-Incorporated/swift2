#!/usr/bin/env bash
# Stop hook — enforces the checkpoint discipline mechanically.
# If code has changed but STATE.md hasn't been touched in a while, block the
# stop once and demand a checkpoint. This is the deterministic version of
# "STATE.md is rewritten last" — prose Claude could skip, this it can't.
# Fails open on any error. STALE_SECONDS: how old STATE.md may be while code
# changes exist (default 20 min — tune at kickoff).

input=$(cat)

# Verified-runnable Python resolver (Windows Store fake-python3 stub defense).
PYBIN=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "" >/dev/null 2>&1; then PYBIN="$c"; break; fi
done
[ -z "$PYBIN" ] && exit 0  # fail open

"$PYBIN" - "$input" <<'PY'
import json, os, subprocess, sys, time

STALE_SECONDS = 1200

try:
    data = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)

# Never loop: if we already blocked once this stop, let it through.
if data.get("stop_hook_active"):
    sys.exit(0)

if not os.path.exists("STATE.md"):
    sys.exit(0)  # kit not adopted here / wrong cwd — stay silent

try:
    out = subprocess.run(["git", "status", "--porcelain"],
                         capture_output=True, text=True, timeout=5).stdout
except Exception:
    sys.exit(0)

dirty = [l for l in out.splitlines() if l.strip()]
# Exact-name match (endswith), not substring — STATE.md.bak is code, STATE.md isn't.
code_changed = any(
    not l.rstrip().endswith(("STATE.md", "MAP.md", "PAUSE.md")) for l in dirty)
state_age = time.time() - os.path.getmtime("STATE.md")

if code_changed and state_age > STALE_SECONDS:
    print(json.dumps({
        "decision": "block",
        "reason": "Checkpoint gate: the working tree has code changes but "
                  "STATE.md is stale. Update STATE.md now (changes, verified-by, "
                  "autonomous decisions, next obvious step) and MAP.md if files "
                  "were added/moved/deleted. Then stop."}))
    sys.exit(0)

sys.exit(0)
PY
