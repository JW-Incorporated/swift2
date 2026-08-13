#!/usr/bin/env bash
# Statusline — the live gauge for the 50% checkpoint rule, plus a tripwire for
# silent model reroutes (if this doesn't say opus, run /model opus).

input=$(cat)

# Verified-runnable Python resolver (Windows Store fake-python3 stub defense).
PYBIN=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "" >/dev/null 2>&1; then PYBIN="$c"; break; fi
done
if [ -z "$PYBIN" ]; then echo "claude"; exit 0; fi

"$PYBIN" - "$input" <<'PY'
import json, subprocess, sys, time
from datetime import datetime

try:
    d = json.loads(sys.argv[1])
except Exception:
    print("claude"); sys.exit(0)

model = d.get("model", {}).get("display_name") or "?"

# used_percentage is null until the first message of a session — "?" is expected
# early, not a bug. The limit gauge below is the other half of the instrument.
p = d.get("context_window", {}).get("used_percentage")
if isinstance(p, (int, float)):
    ctx = f"{p:.0f}%" + (" !! CHECKPOINT" if p >= 50 else "")
else:
    ctx = "?"


def hhmm(v):
    """resets_at -> local HH:MM. Accepts ISO 8601 or epoch (s or ms)."""
    try:
        if isinstance(v, (int, float)):
            return time.strftime("%H:%M", time.localtime(v / 1000 if v > 1e11 else v))
        dt = datetime.fromisoformat(str(v).replace("Z", "+00:00"))
        return (dt.astimezone() if dt.tzinfo else dt).strftime("%H:%M")
    except Exception:
        return ""


# Usage-limit gauge — feeds the pause protocol's reset time. Absent/null early
# in a session and on plans without limits: emit nothing, never crash.
lim = ""
fh = (d.get("rate_limits") or {}).get("five_hour") or {}
lp = fh.get("used_percentage")
if isinstance(lp, (int, float)):
    lim = f"lim {lp:.0f}%"
    r = hhmm(fh.get("resets_at"))
    if r:
        lim += f" ->{r}"

branch = ""
cwd = d.get("cwd") or d.get("workspace", {}).get("current_dir")
if cwd:
    try:
        branch = subprocess.run(["git", "-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"],
                                capture_output=True, text=True, timeout=2).stdout.strip()
    except Exception:
        pass

parts = [f"[{model}]", f"ctx {ctx}"]
if lim:
    parts.append(lim)
if branch:
    parts.append(f"({branch})")
print(" ".join(parts))
PY
