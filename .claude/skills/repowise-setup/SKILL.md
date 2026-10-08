---
name: repowise-setup
description: The only sanctioned way to install, upgrade, re-index, or
  audit Repowise in a project — invoke whenever repowise is being added
  to a repo, refreshed after a big refactor, or its install checked.
---

# Repowise setup — install / refresh / audit

Repowise's own installer is not kit-safe: bare `repowise init` edits
`~/.claude/settings.json` machine-wide, installs Read-interception hooks
unreviewed, and injects text into the project's CLAUDE.md. This skill is
the wrapper that makes it safe. guard.sh denies bare `repowise init`.

## Worth-it test (run first)

Skip repowise entirely for projects under ~20 source files (static
sites, single-script tools) — index overhead outweighs savings. State
the call in one line and stop.

## Preconditions

1. `python --version` → 3.11+ (repowise requires it).
2. `git rev-parse --show-toplevel` EQUALS the project dir (parent home
   dir is itself a git repo on this machine — success alone means
   nothing).
3. `git status` clean, or dirt classified per ROLLOUT.md rules. A clean
   tree is what makes the post-init audit diff readable.
4. No other live session on this repo (ROLLOUT.md lock rules).

## Install

1. `python -m pip install --upgrade repowise --quiet`
   - Windows trap (hit in pilot): pip drops `repowise.exe` into the
     Python `Scripts\` dir, which is often NOT on PATH — invoke it by
     absolute path throughout. `python -m repowise` does NOT work (the
     package ships no `__main__`).
2. Run init with the safe flags — both belt and braces:
   `REPOWISE_SKIP_EDITOR_SETUP=1 repowise init --yes --no-prose --no-editor-setup`
   - `--no-prose` = free structural index. `--prose` (LLM-written
     subsystem pages) burns API spend → owner approval first.
   - No LLM API key → init records `embedder: mock`; `search_codebase`
     then runs on full-text search. Fine — structural tools unaffected.
3. **Post-init audit — MANDATORY, never skip:**
   - `git status --porcelain` + `git diff`. Pilot result (v0.45.0,
     backtest-os, 2026-08-23): with the safe flags, init touched
     NOTHING outside `.repowise/` — no CLAUDE.md injection, no
     AGENTS.md/.codex writes, no `~/.claude/settings.json` edit
     (hash-verified). Audit anyway on every version: earlier releases
     did inject into CLAUDE.md, and behavior drifts. If an injection
     appears, revert it — the project CLAUDE.md is hand-authored.
   - Verify `~/.claude/settings.json` is untouched (hash a pre-init
     copy). If edited, revert and log a trap in STATE.md.
   - Add `.repowise/` to `.gitignore` YOURSELF — v0.45.0 init does not
     do it, despite upstream docs claiming otherwise.
4. **Wire MCP explicitly** — init does NOT write a repo-root
   `.mcp.json` (that lived in the editor-setup path we skip):
   `repowise agents add --target=claude-code --scope=project -y --format=json`
   — `--scope=project` keeps it repo-local; the JSON report lists every
   file touched (expect exactly `.mcp.json`). Then edit the new
   `repowise` server entry's `command` to the exe's ABSOLUTE path
   (PATH trap above), and commit nothing that the repo gitignores.
   - Trap: repowise's JSON parser is strict — a UTF-8 BOM (invisible
     3-byte prefix PowerShell often writes) in an existing `.mcp.json`
     fails `agents add` with "not valid JSON". Strip the BOM; NEVER
     delete the file — it may wire other servers the project needs.
5. Config overlay — edit `.repowise/config.yaml` (key names verified
   against v0.45.0 source; re-verify if the version has moved):

       decisions:
         session_mining: false
       mcp:
         tools: lean

   - `session_mining: false` is a privacy line, not a tuning choice: it
     reads Claude session transcripts under `~/.claude/projects/**`
     machine-wide, across ALL projects. Owner opt-in only.
   - `lean` = get_answer, get_context, get_symbol, search_codebase,
     get_risk, get_why — fewer tool schemas, less per-turn overhead.
6. Smoke-test before relying on it. Same-session option (no restart):
   drive `repowise.exe mcp <repo> --transport stdio` with a small
   Python byte-pipe client — initialize, `tools/list` (lean profile =
   exactly 6 tools), one `get_context` call (arg is `targets`, an
   array) and one `search_codebase` call. Do NOT pipe JSON-RPC from
   PowerShell — its pipeline mangles the first line's encoding. Full
   in-session check on next restart: `mcp__repowise__*` tools listed,
   one cited `search_codebase` result.
7. Commit everything as ONE revertable commit labeled `kit-v3.3
   repowise` per ROLLOUT.md discipline — respecting the repo's own
   merge rules (PR repos get a PR, never a direct push).

## Refresh (after a large refactor / many landed changes)

Re-run Install steps 2–3 (same flags, same mandatory audit). Index
artifacts are gitignored; only config/wiring changes would show in git.

## Uninstall

Delete `.repowise/`, remove the repowise entry from `.mcp.json`, revert
the `.gitignore` line. `pip uninstall repowise` only if no other project
on the machine uses it.

## Never

- Bare `repowise init` (guard-denied).
- `repowise <anything>` inside hooks, statusline, or per-step
  automation — the CLI has a ~6 s fixed startup floor; the MCP server
  is the fast path.
- Repowise's Read-interception hooks — not until the kit backlog item
  (isolated-repo compatibility test with guard.sh) is done.
