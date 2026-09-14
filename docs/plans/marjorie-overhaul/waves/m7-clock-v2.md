# Wave M7 clock v2 — the routines' clock, redesigned

Paste everything below this line into a **fresh** session in Swift2. Swift2's
debug protocol says a stuck design is rebuilt from a clean context, not in
the session that failed.

**Before you start:**
- the doorbell is installed (HA #75 closed);
- Joey has answered the scope question on #4290 (options A / B / C below).

If either is missing, stop and say so.

---

You are rebuilding the M7 clock (`docs/specs/marjorie-overhaul/m7-clock.md`,
decision #4290, epic #4180).

The first build (branch `feature/m7-clock`, never merged) failed Codex review
twice. It went up the debug ladder, and the architect ruled on a redesign.
Read `DEBUG.md` on that branch in full first:

```
git show origin/feature/m7-clock:DEBUG.md
```

Its last section, "Architect ruling", is the contract for this wave.

That branch is your reference. Reuse its cron parser (`clock-core.mjs`
`parseCron`/`matches`/`nextFires`), `schedule.json` and `schedule.test.ts`,
and the workflow gate changes (`watchdog.yml`, `backup-restore-drill.yml`,
`social-approval-notify.yml`, `codeql.yml`, `routine-vault-run-check.mjs`).
Take its remote-table refresh, `policyProblems` and the handled-slot file
only as examples of what not to do.

## Design (the architect's ruling, summarised)

- **Table pinned per tag.** Main may only turn the clock off, through the
  `CLOCK_LIVE` line: `live = pinnedLive && mainLive === true`. The clock stays
  off at boot until main has been read once, and **fails closed** after three
  failed refreshes (30 minutes).
- **Process-start gating.** A slot is due only if `slot >= processStartMs`;
  `handled` lives in memory. Each POST is attempted once and never retried.
  The run-list GET may retry within 10 minutes.
- **Dispatch-time limits:**
  - a rolling 60-minute cap and a per-row minimum gap, in memory;
  - CI checks the pinned table against the full cycle, not a sample: at most
    40 per hour, at least 5 minutes per row;
  - `StartLimitBurst` and `WatchdogSec` in the unit.
- **Gap watch.** The poll counts missed 5-minute poll slots: any main run of
  the poll, from a cron or a dispatch, serves a slot. Two or more missed
  slots raise `clock-silent`. `checkClock` and the watch share one verdict
  function. State in the spec that when the clock and the cron are both dead,
  detection waits for a surviving cron.
- **Mechanical fixes:**
  - a body-read failure is `ok: false`;
  - the dedup query uses `branch=main`, filtered in code;
  - `since` is passed in `checkClock`;
  - CI asserts `CLOCK_LIVE` implies a valid, non-future `CLOCK_LIVE_SINCE`.
- **Scope, per Joey's answer on #4290:**
  - **A:** `bot-chat-poll`, `routine-marjorie-ops`, `watchdog` only.
  - **B:** A plus every other row that is harmless if doubled, as a second tag.

  Social posting, backups and AI routines stay on GitHub cron until each has
  a per-slot idempotency guard.

## Hard rules carried in

- The M1 list (`waves/m1-comms.md`). Never discard uncommitted work.
- The key and the Discord token live only on the host.
- The clock never touches `scripts/social/**` or `social/queue/`.
- The repo is public: no founder text anywhere.
- `gh secret` / `gh variable` are guard-denied, so flags are committed
  constants flipped by PR.
- Work in a worktree outside `Documents\Claude\Projects\`.
- Tests use a scratch vitest config; always run `npm run lint`.
- Commit WIP after every green step.

## Review plan: two Codex rounds, no third

1. **Round 1 reviews the design, before any code.** Write the amendment
   block into `m7-clock.md` and review it:
   `codex:rescue --background`, results via `codex-companion.mjs result <id>`.
2. **Round 2 reviews the diff.**

If round 2 rejects, stop: update `DEBUG.md` and take the debug ladder. Never
open a round 3.

## Tasks

1. The spec amendment and the `docs/decisions.md` entry (the auth surface:
   pinned table, off-only remote). Codex round 1.
2. Build on `feature/m7-clock-v2`, a new branch off main. Unit tests prove:
   - a slot from before process start is not due;
   - a POST is never retried after a 5xx or a timeout;
   - an unreadable body means no POST;
   - a feature-branch run does not cover a slot;
   - the off switch works while main's table is broken, and three failed
     refreshes turn the clock off;
   - the rate cap and row gap hold, and a table outside the cap fails CI;
   - the gap watch: cron-only runs raise no alert, two missed slots do, and
     no alert fires inside the grace;
   - `checkClock` gives the same verdict as the watch.

   Codex round 2 reviews the diff; then open the PR with auto-merge.
3. Tag `doorbell-v2` and file the update human action by PR:
   ```
   sudo git fetch --depth 1 origin tag doorbell-v2
   sudo git checkout -q doorbell-v2
   sudo systemctl restart longlive-doorbell
   ```
4. **Live proof** (after Joey reports the update done):
   - flip `CLOCK_LIVE` and set `CLOCK_LIVE_SINCE` by PR;
   - watch one hour: the in-scope rows start within 2 minutes of every slot,
     `workflow_dispatch` by the key's owner, none doubled;
   - run a `dry_run` `clock-silent` alarm;
   - put run ids on #4180, and close #4290 with the hour's run list.

## Done means

- The one-hour proof is on #4180 with zero doubles, and #4290 is closed.
- Unit tests are green and lint shows 0 errors.
- Both Codex rounds are clean.
- `MAP.md`, `docs/ops/doorbell.md` and `STATE.md` are updated.
- M7 is ticked on #4180 and in `PLAN.md`.
