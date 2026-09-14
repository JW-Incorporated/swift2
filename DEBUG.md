# DEBUG — M7 clock failed Codex review round 2 (design, not a bug)

Branch `feature/m7-clock` (pushed; **no PR opened, nothing live**). Spec:
`docs/specs/marjorie-overhaul/m7-clock.md` (with its two amendment blocks).
Epic #4180, decision #4290. The doorbell, poll watch and alarm are merged
(#4306, #4308, #4309, #4311) and do not depend on this branch.

## Symptom

Swift2's two-round Codex review cap is reached, and round 2 rejects:

- Round 1 (`task-mu1bi58a-yjzfxq`): 7 findings.
- Round 2 (`task-mu1c240v-z9xe2z`): 3 High and 5 Medium, with three round-1 fixes judged NOT FIXED.

A third round is barred: it would mean the fix approach is wrong.

## What the clock is

- A loop in the doorbell service on the Hermes VM host, using the key
  `longlive-doorbell-dispatch` (Actions read/write on a public repo). It
  `workflow_dispatch`es every cron slot in `scripts/doorbell/schedule.json`
  (55 rows, including live social posting and backups).
- **Dedup:** it skips a slot when a run was created since the slot minus 60 s.
- **Remote config:** it re-reads the table and `CLOCK_LIVE` from main every
  10 minutes, so the pinned tag needs no update per change.
- **Watch:** the poll watches the clock and raises `clock-silent`.

## Approach 1 (round 1) and why round 2 rejected it

| Round-1 finding | Fix tried | Round-2 verdict |
|---|---|---|
| Remote config widens authority | `policyProblems`: pinned workflows and inputs; ≤1 fire per 5 min; ≤40 per hour, sampled over the next 48 h | **NOT FIXED.** Time-sampled: `* * 20 9 *` passes on 09-14 and is kept without revalidation when the sha is unchanged. Calendar-hour buckets allow 60 dispatches in 10 minutes |
| Restart re-fires a slot | persist `handled` after each tick | **NOT FIXED.** Persistence runs after the whole `Promise.all`, so a restart between a POST and the save re-fires. There is no pending-dispatch record, and the remote-accept vs local-record gap stays |
| Slow requests / late dispatch | 15 s deadlines, parallel rows, time and live rechecked | FIXED, but see High #3 |
| Older refresh overwrites newer | serialized refresh, one sha, no rollback | FIXED |
| Clock never fired unnoticed | `CLOCK_LIVE_SINCE` plus 30 min grace | FIXED, but a future timestamp suppresses monitoring forever |
| False alarm on enabling | clock-titled runs, grace | **NOT FIXED** in `chat-alarm.mjs checkClock`, which drops `since` |
| Feature-branch health | watchdog and vault-run: main only | FIXED; the clock's own dedup query still lacks `branch=main` |

New in round 2:

- **High:** a run-list response with 200 headers but a timed-out body gives
  `data: null`, which counts as "no run", so the clock dispatches blind
  (`github-rest.mjs` json catch).
- **Medium:** a feature-branch run marks a production slot handled.
- **Medium:** an invalid table also rejects `CLOCK_LIVE=false`, so the off
  switch cannot turn the clock off.
- **Medium:** a healthy native cron that keeps covering slots makes the watch
  call the clock dead, because there are no clock-titled runs.
- **Medium:** a backward clock jump combined with a future handled entry
  suppresses slots.

## Files (the minimal set)

- `scripts/doorbell/lib/clock-core.mjs`: policy, `clockTick`, cron
- `scripts/doorbell/lib/clock.mjs`: refresh, persistence, tick loop
- `scripts/doorbell/lib/github-rest.mjs`: body-read handling
- `scripts/marjorie/lib/clock-watch.mjs`: watch, `CLOCK_LIVE_SINCE`, grace
- `scripts/marjorie/chat-alarm.mjs`: `checkClock`
- spec `docs/specs/marjorie-overhaul/m7-clock.md`

## What I would try next, and why (design, for the next rung to judge)

1. **Shrink the authority surface instead of policing it.**
   - Drop the remote table. The schedule is exactly the pinned tag's table,
     and a cron change is an update HA, like any code.
   - Keep one remote input, and only in the safe direction: main can turn the
     clock **off** (`CLOCK_LIVE=false`), never on or wider. "On" ships in the
     tag, or through a host-side `CLOCK_ENABLED=1` in the env file.
   - This removes High #1 and Medium "off switch" by construction.
2. **Durable idempotency where it lives: in GitHub, not on the host.**
   - Each dispatch carries a slot id (for example a `run-name` suffix, or an
     input the host can list by), and a slot is covered only by a run whose
     title names that slot on main.
   - A local pending record is written **before** the POST. An ambiguous
     result is reconciled by listing for that exact slot after a settle
     delay (≥2 min) before any retry.
   - Open question: 53 workflows would need a `slot` input or run-name.
     A cheaper alternative accepts the narrow ambiguity and makes every
     clock-dispatched workflow idempotent per slot through a concurrency
     group keyed on the slot.
3. **Hard, stateless dispatch limits at dispatch time:** a rolling 60-minute
   counter (persisted) and a per-workflow minimum gap, independent of any
   config sample.
4. **Watch a heartbeat, not dispatch absence.** The clock's tick outcome
   ("covered" or "dispatched") needs a GitHub-visible trace. For example:
   always dispatch the poll with `clock=true` and let the poll's own
   concurrency group drop duplicates, or add a tiny `clock-heartbeat.yml`.
   Also: validate `CLOCK_LIVE_SINCE` (not in the future, present when live)
   in CI.
5. **Mechanical fixes regardless of design:**
   - body-read failure is not ok;
   - `branch=main` in the dedup query;
   - pass `since` in `checkClock`;
   - reject future `CLOCK_LIVE_SINCE`.

Ladder: Codex has had both rounds → fresh-context Claude agent (design
proposal from this file and the files above) → `architect` if it returns
without a fix. Meanwhile the doorbell ships without the clock (tag
`doorbell-v1` from main), and the clock follows as `doorbell-v2`.

## Redesign proposed by the fresh-context agent (rung 2, 2026-09-14 07:33 PDT)

It judges the clock sound only if it does less.

- **(a) Reads from main.**
  - Only the `CLOCK_LIVE` line, and only to turn the clock off:
    `live = pinnedLive && mainLive === true`.
  - It starts off at boot until main is read once, and an unreadable read keeps the last value.
  - Refresh stays serialized, with no older commit applied.
  - The table is pinned per tag; `policyProblems`, `readRemote` and `sameTable` are deleted.
  - Residual: turning it off takes up to about 15 minutes.
- **(b) Dedup: attempt a slot at most once, recorded before sending.**
  - `recordAttempt` writes the ledger synchronously (fsync, rename, directory fsync) before any POST. If the write fails, nothing is sent.
  - An attempted slot is used up whatever the result, and never retried.
  - A slot is due only if `key@slot` is not in the ledger. A missing or corrupt state file means no slot from before boot fires.
  - Coverage query: `branch=main&per_page=30`, filtered to `head_branch === 'main'`, event `schedule` or `workflow_dispatch`, created between slot − 60 s and slot + 10 min.
  - A missing `workflow_runs` array, or `total_count` above the runs returned, means unreadable: no send.
  - If the `Date` header differs from the host clock by more than 90 s, nothing is sent.
  - Residual: a lost slot on a 5xx or a crash between record and POST (GitHub's cron covers it); a GitHub cron that fires more than 10 minutes late still doubles.
- **(c) Rate limits.**
  - At dispatch time, from the persisted ledger: a rolling 60-minute cap (future-dated entries count) and at least 4 minutes between a row's attempts.
  - CI static bound: the sum of each row's minute-field size stays within the cap, and each row's minute set has a circular gap of at least 5.
- **(d) The watch counts missed slots, not clock-named runs.**
  - `gapVerdict` looks at the 5-minute poll slots from `max(now−60m, since+30m)` to `now−10m`. A slot is served by any main run (schedule or dispatch) in its window; two or more missed slots alert.
  - `validSince` rejects a missing or future `CLOCK_LIVE_SINCE` (warning, no grace); CI also asserts `CLOCK_LIVE` implies a valid, non-future value.
  - `checkClock` and `watchClock` share `readVerdict`.
- **`github-rest.mjs`.** A non-204 response whose body fails to parse is `ok: false`; the `date` header is returned.
- **Recommended first version (`doorbell-v2`).**
  - Rows harmless if doubled only (the poll, watchdog, checks, reads). Social posting and backups stay on GitHub cron until each gets a guard: on `event==schedule`, exit if a main dispatch ran in the last 20 minutes.
  - AI routines are the founder's call.
- Next rung: `architect`.

## Architect ruling (rung 3, 2026-09-14 07:35 PDT)

**Mostly sound.** It closes the review by shrinking authority rather than
policing it. Amendments:

- **Fail closed on an unreadable main.**
  - Keeping the last good value lets a broken `chat-inbox.mjs` block the off
    switch.
  - Three consecutive failed refreshes (30 min) → the clock treats itself as
    off until a good read.
- **Replace the fsync ledger:** a slot is due only if `slot >= processStartMs`.
  - `handled` stays in memory only.
  - A crash between the POST and the memory write cannot re-fire, because the
    slot now predates process start.
  - No file, and no backward-jump hazard beyond the process lifetime.
  - Attempt once; never retry the POST. The read-only run-list GET may retry
    within 10 minutes. A crash loop fires nothing.
- **Accept:** a rolling 60-minute cap and a per-row gap at dispatch time, in
  memory. CI bound: ≤40 per hour and ≥5 minutes per row over the table's full
  cycle (not sampled). Plus systemd `StartLimitBurst`.
- **Accept the gap watch** with the caveat stated in the spec: if both the
  clock and the cron are dead, detection waits for a surviving cron. Add
  `WatchdogSec` to the unit.
- **Mechanical fixes (required):**
  - body-read failure → `ok: false`;
  - `branch=main` in the dedup query;
  - `since` passed in `checkClock`;
  - CI rejects a future `CLOCK_LIVE_SINCE`.
- **Scope (founder question):**
  - **A (recommended):** the clock drives only `bot-chat-poll`,
    `routine-marjorie-ops` and `watchdog`.
  - **B:** A plus every other row harmless if doubled, in a second tag.
  - **C:** all 55, rejected: a doubled `social-poster` run is a double post.

  Social posting, backups and AI routines stay on GitHub cron until each has a
  per-slot idempotency guard.
- **Fresh session:** new branch `feature/m7-clock-v2` and its own worktree.
  - Codex round 1 is a **design review of the amended spec, before code**;
    round 2 reviews the diff; no round 3.
  - Acceptance:
    - a unit test per mechanism;
    - "slot before process start is not due";
    - "table outside the cap fails CI";
    - one-hour live proof on the three rows, zero doubles;
    - `docs/decisions.md` entry;
    - `MAP.md` rows.
  - Guards: never discard uncommitted work; `codex:rescue --background`; never
    touch `scripts/social/**`.

This branch (`feature/m7-clock`) is not merged. It is the reference for v2:
its cron parser, schedule table and test, workflow gate changes and ops text
are reusable.
