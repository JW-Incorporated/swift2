# Wave M2 — Watchdog handling + the reply poller

Paste everything below this line into a fresh **Sonnet** session in Swift2. Prerequisites: M1 merged and its live gates proven on #4180; no Tree wave open in this checkout. M2 and M3 are independent — never run both in one checkout.

---

You are executing Wave M2 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180). Read `PLAN.md`, then `docs/specs/marjorie-overhaul/w1-watchdog-handling.md` in full and the "Founder replies → issue comments" section of `c2-brief.md` plus the reply-reader paragraph of `c1-delivery.md`. The specs are the source of truth. Up to 6 concurrent subagents; `executor` per task in its own worktree outside `Documents\Claude\Projects\`; you confirm real CI yourself, merge, exit.

**Hard rules carried in:** the same list as M1 (`waves/m1-comms.md`, "Hard rules carried in") — read it. In addition: `routine-marjorie-ops.yml` runs Sonnet with `allowed_tools` scoped to `gh issue`, `gh run`, `gh workflow run`, `gh pr`, Read/Grep and `post-or-mail.mjs` — never `gh variable`/`gh secret`, never a push to `main`; Marjorie never edits product code or content; a human action she files is a v2 item in `HUMAN-ACTIONS.md` via PR, never a Discord post to `#human-action-*`. Codex review on `routine-marjorie-ops.yml`, the poller, and any `watchdog.yml` change.

## Tasks

- **W1 handler routine** — `routine-marjorie-ops.yml` (via `routine-template.yml`, hourly sweep of open `watchdog-alert` issues; **no** per-alert dispatch step in `watchdog.yml` — the architect cut it), `docs/agents/runner-prompts/marjorie-ops.md` carrying the handler table for all 14 alerts as instructions, `scripts/marjorie/lib/alert-router.mjs` + tests (title → handler, including the two dynamic patterns; handled-state so she never re-handles). What she may do herself is exactly what the spec's table allows (re-dispatch a quiet workflow, re-run a failed check, nudge a stuck PR within the existing re-run budget); everything else becomes a human action or an in-channel line. Confirm `watchdog.yml`'s dynamic `routine-*.yml` list covers the new routine and add `plan-recheck-marjorie.yml` to the watch list; remove the two expired checks the spec names. `watchdog.yml` ends shorter than it started — paste the line count before/after.
- **FB export human action** — the text is already final in `w1-watchdog-handling.md`. Wire it so that alert #4009's handler files it verbatim as the next `HUMAN-ACTIONS.md` number via PR. Real test: alert #4009 is open now — the first real `routine-marjorie-ops` run should produce that PR. (#4129 is the other open alert; use it as the second live case.)
- **Reply poller (moved here from M4)** — a `run:`-step job with `DISCORD_BOT_TOKEN`, modelled on `social-approval-poll.yml`, that turns founder replies in the brief's `#longlive-marjorie` thread into comments on the brief issue. Never an agent step; the bot needs View Channel on `#longlive-marjorie` — if it lacks it, file the one-click human action and continue. Do **not** touch Tree's prompts or `#longlive-tree` — that is M4.

## Done means

A synthetic quiet-routine alert (spec's method) was resolved by a real `routine-marjorie-ops` run: dispatch, in-channel line, close — cite the run URL and the issue; the FB export human action exists in `HUMAN-ACTIONS.md` on `main` with the spec's literal steps, filed by the routine's PR; one real thread reply became an issue comment (or the View Channel human action is filed and the poller is proven against a channel the bot can read); `watchdog.yml` shorter than before; `MAP.md` rows. Tick M2 on #4180, update `STATE.md`, stop.
