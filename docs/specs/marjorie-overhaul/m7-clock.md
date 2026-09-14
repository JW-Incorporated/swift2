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

## V2 amendment — 2026-09-14 (authoritative)

This block supersedes the original Mechanics, Acceptance criteria and Files
affected below where they conflict. Contract: `waves/m7-clock-v2.md` and the
Architect ruling in `origin/feature/m7-clock:DEBUG.md`; scope decided on #4290.

### Authority and activation

- The installed tag pins all executable code, the repository, workflow names,
  crons and inputs. Exactly two rows, both with empty inputs:
  `bot-chat-poll.yml` (`*/5 * * * *`) and `routine-marjorie-brief.yml`
  (`0 12 * * *`). No schedule triggers are removed and no other rows added.
- A tag-local `PINNED_CLOCK_LIVE = true` authorizes this fixed table in v2.
  The operational constants `CLOCK_LIVE = false` and `CLOCK_LIVE_SINCE = ''`
  start on main beside `DOORBELL_LIVE`. After the host update, a separate PR
  sets them true and to its activation timestamp. Effective host authority is
  `pinnedLive && mainLive === true`: main can withhold or restore the pinned
  capability, never authorize a disabled tag or widen its table. This is the
  off-only remote constraint; it does not mean a permanent off latch.
- At boot the clock is off until a successful main read. Every ten minutes,
  one serialized bounded GET reads only the literal CLOCK_LIVE export from
  the public file as text, never imports or evaluates it. The remote table
  is never fetched. Missing/ambiguous flag lines and unreadable responses
  are failures. Three consecutive failed refreshes disable the clock until
  a good read; after 30 minutes without a good read it is off regardless of
  timer/request delays. No request outlives its 15-second deadline.
- A main workflow commit can change what those two workflows execute on main.
  Pinning the host table does not pin workflow implementation or constrain
  the key itself, which retains Actions write. Repository review/CI protects
  that boundary. No remote code executes on the host, no key reaches Actions,
  and no flag or table change grants additional host permissions.

### Slots, requests and limits

- Capture processStartMs before asynchronous startup. Only slots at or after
  that instant are eligible. An in-memory handled set records each slot
  before its POST; POSTs are attempted once, including timeout/5xx. No disk
  ledger, catch-up from before boot, or POST retry. A restart loses a slot
  rather than repeating it. A backward wall-clock jump pauses dispatch
  until the last observed time is reached.
- Tick once per minute, serialized. A failed read-only run-list GET may be
  tried again within ten minutes of the slot. Recheck live, slot age and
  limits immediately before sending. A newer slot of the same row supersedes
  an older pending slot; the poll never catches up two slots at once.
- Dedup queries include `branch=main`, and code also filters head_branch,
  schedule/workflow_dispatch events and timestamps. Require a readable array
  and complete result (no unobserved pagination); malformed, truncated or
  unreadable data means no POST. A response Date skew above 90 seconds also
  prevents dispatch. No raw response or exception text is logged.
- For the poll, coverage uses disjoint five-minute windows [slot, slot+5m).
  The brief uses [slot, slot+10m]. Thus one poll run cannot cover two slots.
  A later GitHub cron remains possible; the brief guard prevents its second
  agent run. The poll's existing claims/concurrency make its races harmless.
- Count attempts (including failed POSTs), in memory, in the rolling previous
  60 minutes: at most 40, and at least five minutes between attempts for a
  row. Check/reserve synchronously before POST. Future timestamps continue
  to count after a backward jump. CI proves a full-cycle bound analytically:
  each row's circular minute-set gap is >=5, and the sum of minute-set sizes
  is <=40. Hour/day/month filters only remove fires, so this bound covers
  every rolling hour of the Gregorian cycle, including calendar boundaries.
- `github-rest.mjs` returns ok:false if a non-204 body cannot be read/parsed.
  `--check` remains offline and prints the pinned table's next ten fires.

### Brief guard

- Add a first plain job with actions:read, issues:read, checkout pinned main,
  no agent or production credentials, and a pure tested decision helper.
  `run` needs this job and its explicit proceed output; delivery remains
  dependent on successful `run`. Never edit the assembler or L1 files.
- Except a manual force=true dispatch, only the earliest main schedule or
  dispatch run created that UTC day proceeds (exclude itself, order by
  created_at then numeric id). This deterministic ordering covers concurrent
  starts; earlier cancelled/failed runs still count. A rerun also ends at the
  guard. API failures or incomplete reads fail closed before the agent.
- Also stop when a founders-brief issue created that UTC day already has a
  discord-message-id marker in its body or comments, including closed issues.
  Read all relevant pages. Never print issue bodies/comments or founder text.
  A manual force input deliberately bypasses both checks; it is never in the
  clock's pinned inputs. Normal retry after failure requires that override.

### Shared gap watch and proof

- One shared verdict serves poll watch and alarm checkClock; checkClock passes
  CLOCK_LIVE_SINCE. A valid since grants 30 minutes of startup grace. Check
  five-minute slots from max(now-60m, since+30m) through now-10m. Each main
  schedule or dispatch run serves only its containing [slot, slot+5m) window,
  regardless of actor or conclusion. Two missed slots raise clock-silent.
  Unreadable run history is a failed check, never proof of health. Missing or
  future since gives no grace; CI rejects it whenever CLOCK_LIVE is true.
- Alarm title and body begin `Clock is not firing`, contain metadata only,
  and explain that if both host clock and GitHub cron are dead, detection
  waits for a surviving cron. The existing standing-alert path deduplicates
  notifications. A dry_run prints the body but posts/dispatches nothing.
- Unit tests prove every mechanism listed in the v2 brief, including the
  workflow text dependency/force input and guard decision. Full CI gates merge;
  local tests use the prescribed scratch config, lint must have zero errors.
- Round 1 is this design, before code; round 2 is the implementation diff.
  A round-2 rejection stops work with DEBUG.md, never a third review.
- Live acceptance: twelve consecutive poll slots in an hour, each served
  within two minutes by a key-owner dispatch or GitHub cron, no doubled clock
  dispatches; metadata/run URLs on #4180. Dry-run clock-silent body confirmed.
  At the next 12:00 UTC exactly one brief posts, and any later cron that day
  stops at the guard. Close #4290 and tick M7 only after both halves hold.
  If noon is more than two hours away, record poll proof and put the noon
  check first in STATE.md Next, then stop for the follow-up session.

### Deployment and affected files

Unit gains StartLimitIntervalSec=3600, StartLimitBurst=5, WatchdogSec=180,
NotifyAccess=all. A bounded systemd-notify subprocess reports WATCHDOG=1 only
after the clock loop makes progress (including a handled read failure), never
from an independent heartbeat masking a hung loop. No extra npm dependency.
The update HA names doorbell-v2 and, from /opt/longlive-doorbell, runs the
three prescribed commands with these approved additions before restart:
`sudo cp scripts/doorbell/longlive-doorbell.service /etc/systemd/system/longlive-doorbell.service`
and `sudo systemctl daemon-reload` (Joey approval in chat, 2026-09-14).
Stop for Joey's done before activation/proofs; no credentials are copied.

Touch set: scripts/doorbell clock modules/table/tests, doorbell.mjs/tests,
github-rest.mjs/tests, service; scripts/marjorie shared clock-watch and brief
guard modules/tests, chat-poll/alarm/inbox and their tests; brief and alarm
workflows/tests; this spec, decisions, MAP, ops, STATE, PLAN, HUMAN-ACTIONS.
No social files, other routine gates, L1 files or assemble-brief.mjs changes.

## Original mechanics (historical; v2 amendment above supersedes)

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
