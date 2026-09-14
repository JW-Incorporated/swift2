# M7 — The clock (routines started from the home server)

Written 2026-09-14 from Joey's decision in chat ("yes, let's run the clock on
the server"; issue #4290, `docs/decisions.md` 2026-09-14). Part of M7:
`m7-doorbell.md` Pieces 4 names it; this file carries its mechanics and
acceptance. Epic #4180.

## Why

GitHub drops most of this repo's scheduled runs. Measured 2026-09-14: the
5-minute chat poll fired 3 times in 14 hours, the hourly watchdog twice in
11, and neither the Tree Monday run nor the Marjorie brief fired at their
slots. Nothing was queued, so runs are dropped, not delayed. A
`workflow_dispatch` is a push and is unaffected.

## Mechanics

- **The table**, `scripts/doorbell/schedule.json`, is the only place a
  slot lives: one row per routine, `{ "workflow": "<file>.yml", "cron":
  "<5 fields, UTC>", "inputs": {} }`. It starts with every workflow that
  carries a `schedule:` today (`grep -l "cron:" .github/workflows/*.yml`,
  53 on 2026-09-14) at the same UTC cron it has there. A unit test
  asserts the table and the workflows agree, so a cron edited in one
  place fails CI until the other follows.
- **Firing.** `clock-core.mjs` is pure: given the table, the last fire
  time per row and `now`, it returns the rows due. The loop in
  `doorbell.mjs` evaluates it once a minute, dispatches each due row with
  `DOORBELL_GITHUB_TOKEN` (`POST …/actions/workflows/<file>/dispatches`,
  `ref: main`), and records the fire time in memory. A failed dispatch is
  logged and retried next minute, for up to 10 minutes past the slot.
- **No double runs.** Before dispatching, the clock lists the workflow's
  runs created in the last `max(slot interval, 10 min)` (`GET
  …/actions/workflows/<file>/runs?created=>=…`); if one exists, from any
  trigger, it skips. So a GitHub cron that does fire is not doubled, and
  a restart mid-minute does not re-fire. Workflows the clock dispatches
  must accept `workflow_dispatch` with no required inputs, or carry the
  inputs in the table row.
- **Actor and identity.** Runs the clock starts show the key's owner as
  the triggering actor, `event: workflow_dispatch`. Any workflow step that
  branches on `github.event_name == 'schedule'` must be found (`grep
  "event_name" .github/workflows`) and made to treat a clock dispatch the
  same way; list every such change in the PR.
- **Watching the clock.** The stuck-reply alarm workflow gains a
  `stage=clock-silent` input. The poll's own pass (which still runs when
  GitHub's cron fires) checks the newest `workflow_dispatch` run of
  `bot-chat-poll.yml` by the key's owner: if the clock has been live and
  that run is older than 20 minutes, it dispatches the alarm once, which
  opens the standing `Clock is not firing` alert in `#longlive-marjorie`.
- **Config.** `CLOCK_LIVE`, a committed constant beside `DOORBELL_LIVE`,
  starts `false`, flips by PR after the live proof. `--check` prints the
  table's next 10 fires.

## Acceptance criteria

- **The clock, live.** With `CLOCK_LIVE` on, `bot-chat-poll.yml` and
  `routine-marjorie-ops.yml` each show a `workflow_dispatch` run by the
  key's owner within 2 minutes of every slot for one hour (12 poll runs,
  1 ops run), with no doubled runs. Run ids on #4180. Unit tests: a due row
  fires once; a row with a run already in its window skips; a failed
  dispatch retries and gives up after 10 minutes; the table matches the
  workflows' own crons; `--check` lists the next fires.
- **The clock, watched.** A `dry_run` alarm with `stage=clock-silent`
  prints the standing alert body; the poll dispatches it when the newest
  clock run is older than 20 minutes.

## Files affected

- **New:** `scripts/doorbell/schedule.json`; `scripts/doorbell/lib/clock-core.mjs` + `.test.ts`.
- **Edited:** `scripts/doorbell/doorbell.mjs` (the minute loop, `--check`),
  `scripts/marjorie/chat-poll.mjs` (the clock-silent check),
  `.github/workflows/bot-chat-alarm.yml` (`stage=clock-silent`),
  `scripts/marjorie/lib/chat-inbox.mjs` (`CLOCK_LIVE`), any workflow step
  that branches on `github.event_name == 'schedule'`, `MAP.md`.
