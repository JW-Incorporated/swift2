#!/usr/bin/env bash
# PreToolUse guard (matcher: Bash) — deterministic backstop for the
# "human-only actions" list in CLAUDE.md. Prose can be ignored; this can't.
# Blocks catastrophic commands even in fully-autonomous / skip-permissions
# sessions. Edit PATTERNS at kickoff to fit the project. Fails open by design:
# if anything errors, the command proceeds and normal permissions apply.

input=$(cat)

# Resolve a runnable Python: the Windows Store ships a fake `python3` stub that
# exists on PATH but exits nonzero — verify each candidate actually runs.
PYBIN=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "" >/dev/null 2>&1; then PYBIN="$c"; break; fi
done
[ -z "$PYBIN" ] && exit 0  # fail open: no python, no guard — normal permissions still apply

"$PYBIN" - "$input" <<'PY'
import json, os, re, sys, time

try:
    data = json.loads(sys.argv[1])
    cmd = data.get("tool_input", {}).get("command", "") or ""
except Exception:
    sys.exit(0)

# `--env-file=<path>` is how this repo's own `db:migrate` and `db:seed:*`
# scripts load worker env (see package.json). It LOADS variables into a
# process; it does not read secrets out into the transcript. Scrub those
# arguments before the .env test so the project's documented commands keep
# working — a deny scoped too wide silently breaks the workflow it protects.
cmd_env = re.sub(r"--env-file[=\s]\S+", " ", cmd)

PATTERNS = [
    (r"\brm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+", "recursive/forced rm"),
    (r"\bgit\s+push\b[^\n]*(\s--force\b|\s-f\b|\s--force-with-lease\b)", "force push"),
    (r"\bgit\s+reset\s+--hard\b", "hard reset"),
    (r"\bgit\s+clean\b", "git clean"),
    (r"--no-verify\b", "verification bypass (--no-verify)"),
    (r"\bchmod\s+(-R\s+)?777\b", "chmod 777"),
    (r"\bgh\s+(secret|variable)\s+(set|delete)\b", "gh secret/variable mutation"),

    # --- swift2-specific, below this line ---

    # CLAUDE.md "Never discard uncommitted work" is a standing project rule the
    # generic kit has no equivalent for. settings.json already denies these at
    # the permission layer; repeating them here makes them hold in
    # skip-permissions / fully-autonomous sessions too.
    (r"\bgit\s+restore\b", "git restore (discards uncommitted work)"),
    (r"\bgit\s+checkout\s+--\s", "git checkout -- (discards uncommitted work)"),

    # Dispatching the send paths via CI instead of running them locally.
    (r"\bgh\s+workflow\s+run\b[^;&|]*\bsocial-(poster|delete-media)\b",
     "dispatching the social poster workflow (real posts / real deletions)"),
]

# Real secret files only — .env.example/.sample/.template/.dist stay readable.
# Trailing class includes shell metachars so `cat .env;` can't slip the deny.
# Lookahead is end-anchored: .env.examples / .env.sampledata must NOT slip through.
ENV_PATTERN = (
    r"(^|[\s/'\"])\.env(?!\.(example|sample|template|dist)([\s'\";|&<>)]|$))"
    r"(\.[A-Za-z0-9_.-]+)?([\s'\";|&<>)]|$)",
    "touching .env files")

# --- The social poster's REAL-SEND paths -----------------------------------
# scripts/social/post-queue.mjs publishes to the live Instagram/X accounts the
# moment it runs, and delete-media.mjs deletes live media. Neither has a
# dry-run flag, and a duplicate publish is the mechanism behind the 2026-07-17
# triple-post incident (issue #2031).
#
# Matching on a path regex was wrong in both directions: it missed
# `cd scripts/social && node post-queue.mjs` and `bash -c '...'`, while
# denying `npx eslint scripts/social/post-queue.mjs`. So instead of pattern-
# matching the text, work out what each command segment actually EXECUTES:
# walk past env assignments, runner binaries and flags, and look at the first
# real program token. The script is denied only in that executable position.
#   node scripts/social/post-queue.mjs   -> DENY   (executed)
#   cd scripts/social && node post-queue.mjs -> DENY (executed)
#   ./scripts/social/post-queue.mjs      -> DENY   (executed)
#   bash -c 'node .../post-queue.mjs'    -> DENY   (executed)
#   npx eslint .../post-queue.mjs        -> allow  (eslint is executed)
#   grep -rn "post-queue.mjs" scripts/   -> allow  (grep is executed)
#   npx vitest run .../post-queue.test.ts -> allow (different file)
SEND_SCRIPTS = {"post-queue.mjs", "delete-media.mjs"}
RUNNERS = {"node", "node.exe", "npx", "npx.cmd", "tsx", "ts-node", "bun",
           "deno", "bash", "sh", "zsh", "env", "time", "nohup", "xargs"}


def _segments(command):
    """Split into independently-executed segments.

    Quotes are dropped so `bash -c '...'` is inspected, and backticks / $( )
    are treated as SEPARATORS (not whitespace) so a command substitution such
    as ``echo `node .../post-queue.mjs` `` is examined as its own segment.
    """
    c = command.replace("'", " ").replace('"', " ")
    return re.split(r"[;&|`\n]+|\$\(|\)|\{|\}", c)


def executes_send_script(command):
    for seg in _segments(command):
        toks = seg.split()
        i = 0
        # Skip leading environment assignments: FOO=bar node x.mjs
        while i < len(toks) and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", toks[i]):
            i += 1
        while i < len(toks):
            tok = toks[i]
            base = tok.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
            if base in SEND_SCRIPTS:
                return True          # reached in executable position
            if base in RUNNERS:
                i += 1               # a runner: whatever follows is the target
                continue
            if tok.startswith("-"):
                i += 1               # a flag on the current runner
                continue
            break                    # a real program; the script would be its ARG
    return False


def deny(label):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason":
            f"Blocked by guard hook: {label}. This is on the human-only "
            "list in CLAUDE.md — stop and ask the human."}}))
    sys.exit(0)


for pat, label in PATTERNS:
    if re.search(pat, cmd):
        deny(label)

if re.search(ENV_PATTERN[0], cmd_env):
    deny(ENV_PATTERN[1])

if executes_send_script(cmd):
    deny("running the social poster's real-send path "
         "(publishes to / deletes from the LIVE accounts)")

# --- Shared-checkout session lock -------------------------------------------
# Twice in one session two agents in this SAME working directory flipped HEAD
# under each other (an orchestrator's `commit` landed on a different agent's
# branch; another agent found itself mid-task on `main`). Nothing was lost,
# partly by luck. `git worktree add` is the sanctioned fix (encouraged, never
# blocked below) — this only stops a SECOND session from also switching
# branches / HEAD in this exact checkout while one is already active.
#
# Escape hatch for a human who genuinely wants a shared checkout:
#   CLAUDE_ALLOW_SHARED_CHECKOUT=1
#
# BRANCH_CHANGE_PATTERNS deliberately does not match `git worktree add` (a
# different subcommand — "worktree", not "checkout"/"switch"/"branch" — so it
# never collides with these patterns) and does not match `git checkout -- ` /
# `git restore` (already denied above, before this code runs).
BRANCH_CHANGE_PATTERNS = [
    r"\bgit\s+checkout\b",
    r"\bgit\s+switch\b",
    r"\bgit\s+branch\s+(-[a-zA-Z]*[mMf][a-zA-Z]*)\b",
]


def changes_branch_or_head(command):
    return any(re.search(p, command) for p in BRANCH_CHANGE_PATTERNS)


def parse_target_branch(command):
    """Best-effort branch name for the lock's informational `branch` field —
    never used for a security decision, only shown to a human reading the
    lock or a denial message. Must never raise or return shell debris (a
    redirect/pipe token isn't a branch name); falls back to "unknown"."""
    try:
        m = re.search(r"\bgit\s+(checkout|switch)\b(.*)", command)
        if m:
            subcmd, rest = m.group(1), m.group(2)
        else:
            m = re.search(r"\bgit\s+branch\b(.*)", command)
            if not m:
                return "unknown"
            subcmd, rest = "branch", m.group(1)

        # Stop tokenizing at the first shell operator/redirect — everything
        # after `2>&1`, `|`, `&&`, `;`, `>` etc. belongs to the rest of the
        # shell command line, not to this git invocation's arguments.
        op_re = re.compile(r"^\d*(>{1,2}|<{1,2})|^[|&;]")
        toks = []
        for raw in rest.split():
            if op_re.match(raw):
                break
            toks.append(raw)

        non_flag = [t for t in toks if t and not t.startswith("-")]

        if subcmd == "branch":
            # -m/-M/-f: the NEW name is the last argument, whether given as
            # one arg (`-m new`, renaming the current branch) or two
            # (`-m old new`).
            return non_flag[-1] if non_flag else "unknown"

        # checkout/switch: `-b`/`-c`/`-B` (create-and-switch) name the new
        # branch in the argument right after the flag — anything after THAT
        # (e.g. a start-point) is not the branch we care about.
        for i, t in enumerate(toks):
            if t in ("-b", "-c", "-B") and i + 1 < len(toks):
                candidate = toks[i + 1]
                if candidate and not candidate.startswith("-"):
                    return candidate

        return non_flag[0] if non_flag else "unknown"
    except Exception:
        return "unknown"


if os.environ.get("CLAUDE_ALLOW_SHARED_CHECKOUT") != "1" and changes_branch_or_head(cmd):
    session_id = data.get("session_id") or ""
    lock_dir = os.path.join(data.get("cwd") or os.getcwd(), ".git")
    lock_path = os.path.join(lock_dir, "claude-session.lock")
    now = time.time()

    # Sessions in this repo run long (multi-hour PLAN.md executions per
    # CLAUDE.md, checkpointed only at ~50% context). A short TTL would
    # false-deny a real, still-running session mid-task; a crashed session
    # bricking the repo for a founder is the worse failure. 6 hours covers a
    # long working session while still self-healing within the same day.
    LOCK_TTL_SECONDS = 6 * 60 * 60

    existing = None
    try:
        with open(lock_path, "r", encoding="utf-8") as f:
            existing = json.load(f)
    except Exception:
        existing = None  # missing, unreadable, or corrupt -> no lock (fail open)

    holder = existing.get("session_id") if isinstance(existing, dict) else None
    holder_branch = existing.get("branch") if isinstance(existing, dict) else None
    ts = existing.get("ts") if isinstance(existing, dict) else None
    fresh = isinstance(ts, (int, float)) and (now - ts) < LOCK_TTL_SECONDS

    if session_id and holder and holder != session_id and fresh:
        holder_desc = (f"on branch '{holder_branch}'"
                        if holder_branch and holder_branch != "unknown"
                        else "on a branch this hook couldn't determine")
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason":
                "Blocked by guard hook: shared-checkout session lock. "
                "Another agent session is active in this working directory "
                f"(fresh lock at .git/claude-session.lock, holder {holder_desc}"
                ") — switching branches here risks flipping HEAD under it, "
                "the exact incident this guards against. Do this instead: "
                "create your OWN worktree outside "
                "Documents\\Claude\\Projects\\, e.g. "
                "`git worktree add C:\\Users\\<you>\\AppData\\Local\\Temp\\"
                "claude-worktrees\\<branch-name> -b <branch-name>`, and work "
                "there. Read-only inspection may stay in this checkout. If a "
                "human genuinely wants a shared checkout, set "
                "CLAUDE_ALLOW_SHARED_CHECKOUT=1."}}))
        sys.exit(0)

    # Allowed (no lock, own lock, or a stale/abandoned lock) -> write/refresh
    # it. Never let this fail the command it's guarding.
    if session_id:
        try:
            with open(lock_path, "w", encoding="utf-8") as f:
                json.dump({"session_id": session_id, "ts": now,
                           "branch": parse_target_branch(cmd)}, f)
        except Exception:
            pass

sys.exit(0)
PY
