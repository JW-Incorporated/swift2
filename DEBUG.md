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
