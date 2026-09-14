# M7 — The doorbell (founder messages picked up in seconds)

Written 2026-09-13 by the session that built M5 and wrote M6, from Joey's
decisions in chat that evening (relay decisions 1–5 all "yes", 19:16 PDT;
recorded on #4180, and in `docs/decisions.md`). It follows the architect
agent's latency evaluation (logged in `STATE.md`, 2026-09-13 15:20 PDT).
`m5-chat.md` stays the contract for the chat loop. This spec changes only
how a founder message is picked up, and adds the no-reply alarm. Epic #4180.

## Why

A reply takes about 4.5 minutes today:
- up to 5 minutes waiting for the poll;
- then the chat routine itself, about 2.5 minutes of GitHub runner boots and
  agent time.

Hermes' bots answer in seconds because they keep a live Discord connection
open on the home server. The doorbell gives Marjorie and Tree that same live
ear, and nothing more. No AI and no GitHub key enters the Hermes runtime,
and there is still exactly one Marjorie and one Tree.

## Behavior you will see

- **You post** in `#longlive-marjorie` or `#longlive-tree`, at top level or
  in a thread.
  - Within about a second, 👀 appears on your message from Long Live
    Doorbell.
  - The reply arrives as it does today, but about 2.5–3.5 minutes after you
    post instead of about 4.5, followed by ✅.
- **Nothing else changes in Discord.** The doorbell:
  - never posts or replies;
  - never adds ✅ or ❌;
  - never reacts to a bot or webhook message.

  So approval prompts, and what a reaction on them means, are untouched.
- **A stuck reply:** 6 minutes after your message with no ✅ or ❌:
  - ⚠️ appears on the message;
  - an alert posts in `#longlive-marjorie` (email only if that Discord call
    fails);
  - Marjorie's ops routine starts at once to look.
- **The doorbell is down:** the 5-minute poll still answers you, as today,
  and "Doorbell is not answering" posts in `#longlive-marjorie`.

## Pieces

1. **The doorbell**, `scripts/doorbell/doorbell.mjs`: a small Node program
   with no dependencies.
   - It runs as a systemd service on the Hermes VM host, under its own
     unprivileged user, outside every Hermes container.
   - Its two tokens come from `/etc/longlive-doorbell.env` (mode 0640, owner
     `root:longlive-doorbell`):
     - `DOORBELL_DISCORD_TOKEN`: the Long Live Doorbell bot (HA #72, #73);
     - `DOORBELL_GITHUB_TOKEN`: `longlive-doorbell-dispatch` (HA #74).
   - Hermes never reads that file, and no Hermes agent can reach the process.
2. **The poll**, `bot-chat-poll.yml`, keeps its cadence. It is the fallback
   and the watcher of the doorbell.
3. **The alarm**, `bot-chat-alarm.yml`, is dispatch-only. It turns a stuck
   reply or a doorbell failure into a `watchdog-alert` issue through
   `scripts/watchdog/upsert-alert.sh`, the path that already reaches
   `#longlive-marjorie` and that Marjorie's hourly ops sweep already handles.
4. **The clock** (added 2026-09-14, Joey: "yes, let's run the clock on the
   server"; issue #4290). GitHub drops most of this repo's scheduled runs:
   the 5-minute poll fired 3 times in 14 hours, the hourly watchdog twice in
   11, and neither Monday routine fired on 09-14. The doorbell process also
   keeps the clock: it reads a committed schedule table and starts each
   routine on time with `workflow_dispatch`, which is a push and unaffected
   by the throttle. The GitHub `schedule:` triggers stay in every workflow as
   the fallback; the clock adds runs, it never removes any. Mechanics and
   acceptance: `m7-clock.md`.

## Mechanics

1. **Gateway.**
   - The doorbell connects to Discord's gateway with Node ≥22's global
     `WebSocket`.
   - Intents are `GUILDS | GUILD_MESSAGES` only, with no privileged intent.
   - It identifies, heartbeats, resumes after a drop, and reconnects with
     capped backoff.
   - Without Message Content it still receives every `MESSAGE_CREATE` with
     its ids, author and type. It never needs the text.
2. **Which messages.**
   - The two channels are resolved by name from `BOTS` in
     `scripts/marjorie/lib/chat-inbox.mjs`.
   - Thread parents come from `GUILD_CREATE` and the thread events, falling
     back to `GET /channels/{thread}`.
   - A message rings the bell only when **all** of these hold. The poll's
     own `isFounderMessage` is imported, so the two selections cannot drift.
     - It is in one of the two channels, or a thread under one.
     - It passes `isFounderMessage`: a founder id from `founderIds`, not a
       bot or webhook, not the thread root, and a human message type (0 or
       19).
     - It carries no `sticker_items`. The poll skips sticker-only messages,
       and without Message Content the doorbell cannot tell a sticker with
       text from one without.
     - It has not rung before: an in-memory set of the last 500 ids.
3. **Ring.** In order:
   - `PUT` 👀 as the doorbell. A refused reaction is logged, and it still
     dispatches.
   - `POST /repos/JW-Incorporated/swift2/actions/workflows/<routine>/dispatches`
     with `ref: main` and the inputs the poll sends (`dispatchArgs`:
     `message_id`, `channel_id`, `thread_id`).

   A failed dispatch is logged and left to the poll. The routine's `run-name`
   stays `<Bot> chat · <message id>`, so the poll's reconciliation finds
   doorbell-started runs exactly as it finds its own. There is no dispatch
   cap beyond one per message: founders are the only authors.
4. **The claim stays the poll's 👀.**
   - The poll recognises its claims by `reactions[].me` on its own bot token,
     and the doorbell's 👀 is not that.
   - So `chat-poll.mjs context` adds 👀 as the Long Live bot as its first
     write. A refused reaction is a warning.
   - From then on the poll treats the message as claimed, reconciles it after
     45 minutes like any other, and never dispatches it again.
   - A duplicate dispatch in the gap before `context` runs is already
     harmless. The per-message concurrency group queues it behind the first
     run, and its `context` job sees ✅/❌ and stops (`m5-chat.md` Mechanics
     2).
5. **The poll watches the doorbell.** This runs only while `DOORBELL_LIVE`,
   a committed constant in `lib/chat-inbox.mjs`, is `true`. It starts
   `false` and flips by PR after the live proof. For each message the poll
   would claim:
   - **Someone else's 👀 is on it** (the reaction count exceeds the poll's
     own). List runs by `run-name` (`listRuns`):
     - a run exists: skip; the doorbell handled it, and `context` will claim
       it;
     - no run and the message is under 60 s old: skip this pass;
     - no run and 60 s or older: dispatch the alarm with `stage=doorbell-dispatch-failed`,
       then claim and dispatch as today.
   - **No 👀 at all:**
     - 60 s or older: dispatch the alarm with `stage=doorbell-missed`, then
       claim and dispatch as today;
     - younger: claim and dispatch as today, with no alarm.

   The poll claims before the next pass, so it raises at most one alarm per
   message. *(Amended after Codex review of the build: the poll claims
   first, then raises the alarm, then dispatches, so a refused claim never
   repeats an alarm on the next pass. Only a run still going means the
   doorbell has the message: one that ended before `context` claimed it gets
   the poll's 👀 with no second dispatch, and the 45-minute reconcile settles
   it. Skipped messages do not count toward the three-per-channel cap.)*
   *(Amended at build: a sticker message raises no alarm, because
   the doorbell skips stickers by design. A rung message whose runs cannot be
   listed completely is left for the next pass, and that pass fails. A
   founder's own 👀 on their message reads as someone else's, which costs at
   most one `doorbell-dispatch-failed` alarm. `context` moved to
   `lib/chat-context.mjs` to keep `chat-poll.mjs` under 300 lines.)*
6. **The stuck alarm.**
   - The doorbell arms a 6-minute timer for each message it rings.
   - When the timer fires, it lists the users on the message's ✅ and ❌
     reactions (`GET …/reactions/{emoji}`). A ✅ or ❌ from any bot account
     settles it: founders are not bots, and the doorbell never adds either.
   - If neither is there, it adds ⚠️ and dispatches `bot-chat-alarm.yml` with
     `stage=stuck`. The ⚠️ stays on the message as the record.
   - Timers live in memory. A restart drops them, and the poll's 45-minute
     reconciliation stays the backstop.
7. **`bot-chat-alarm.yml`.**
   - `workflow_dispatch` only. Inputs: `bot`, `message_id`, `channel_id`,
     `thread_id`, `stage` (`stuck` | `doorbell-missed` |
     `doorbell-dispatch-failed`) and `dry_run`.
   - `run-name: Chat alarm · <stage> · <message id>`; concurrency group
     `bot-chat-alarm-<message id>`.
   - **`check`** (`social`; `contents: read`, `actions: read`; `run:` steps
     only).
     - For `stuck`, it re-reads delivery (`readDeliveryState`) and the runs
       by `run-name`. A reply, ✅ or ❌ now present ends the run with no
       alert.
     - It outputs the alert title and a body: ids, the message link, the run
       URL and state, and the message's age. It never includes message text
       (public repo).
   - **`alert`** (`ops`; `issues: write`, `actions: write`; skipped on
     `dry_run`, which prints the body instead):
     - `upsert-alert.sh open`, with title `Chat reply stuck · <Bot> ·
       <message id>` (a new issue, so it notifies) or the standing `Doorbell
       is not answering` / `Doorbell dispatch is failing` (one issue while
       it lasts);
     - `gh workflow run routine-marjorie-ops.yml`, so her alert handling
       runs now rather than at :18;
     - for `stuck` with no run at all, `gh workflow run bot-chat-poll.yml`.

     Marjorie's hourly sweep closes the alert once it is resolved, as for
     every watchdog alert.
8. **Timing record.**
   - `finish` adds `replied in <n>s` (the message's snowflake time to its ✅)
     to its run log and to the metadata-only `💬 chat:` turn log.
   - After a week of real replies, the 6-minute threshold becomes the slowest
     normal reply plus a margin. That is a PR, since the threshold is one
     constant in `doorbell-core.mjs`.
9. **Install and updates.**
   - The build files one HUMAN-ACTION for a shell on the VM host:
     1. install Node 22 LTS if `node -v` is below 22;
     2. create the `longlive-doorbell` system user;
     3. `git clone --depth 1 --branch <tag>` swift2 into
        `/opt/longlive-doorbell` (the repo is public, so no key is needed);
     4. write the two-line env file from the password manager;
     5. install `scripts/doorbell/longlive-doorbell.service` and run
        `systemctl enable --now longlive-doorbell`.

     It worked if `journalctl -u longlive-doorbell` shows `ready` with both
     channel names.
   - The unit runs with `Restart=always`, `RestartSec=30`, `NoNewPrivileges`,
     `ProtectSystem=strict`, `ProtectHome` and `PrivateTmp`.
   - The doorbell never updates itself. A token-holding process runs only a
     pinned tag, and an update is a short HA: fetch the new tag, check it
     out, restart.

## Security

- **The Discord token** can read the two channels and their threads and add
  reactions there. It can post nowhere in them (✗ Send overrides, HA #73).
  If leaked, founder chat in those two channels is readable.
- **The GitHub key** is fine-grained, limited to swift2, with Actions: Read
  and write, the narrowest scope that can dispatch a workflow.
  - Actions write is repo-wide, so a leaked key could start, re-run or
    cancel any workflow.
  - It cannot read code or secrets, push, or approve a social post, since
    approval is the signed ✅ stamp.
  - It expires 2027-09-13. `docs/ops/doorbell.md` records the date, and
    `checkpoints.json` gets a renewal check for 2027-08-13.
- **Tokens live only on the host.** They are never in the repo, Actions,
  Hermes, chat or Discord. A session never asks a founder to paste one.
- **Dispatch identity.** Runs the doorbell starts show the key's owner as
  the triggering actor. The founder-only guards in `context` and `finish`
  apply unchanged.

## Acceptance criteria

- **Live, both channels.** Joey posts a message in each channel:
  - 👀 from Long Live Doorbell within 5 s;
  - the routine run's triggering actor is the key's owner;
  - one reply, then ✅.

  Message-to-✅ times are on #4180.
- **Fallback.** With the service stopped and `DOORBELL_LIVE` on:
  - a message is answered by the poll, and `Doorbell is not answering` posts
    in `#longlive-marjorie`;
  - after a restart, the next message rings within 5 s.
- **Stuck path.**
  - A `dry_run` alarm for a replied message ends at `check` with no alert.
  - A `dry_run` for an unreplied message prints the stuck body.
  - Unit tests cover all three titles and bodies (no message text in any).
- **No duplicates.** Unit tests:
  - a doorbell ring plus a poll pass before `context` yields one reply;
  - the poll skips a message with someone else's 👀 when a run exists;
  - the poll alarms once and claims when no run exists after 60 s.
- **The doorbell never posts.**
  - A text test asserts `scripts/doorbell/**` has no `POST` to a `/messages`
    path and no ✅/❌ reaction.
  - Unit tests: bot, webhook, thread-root, non-founder and sticker messages
    never ring.
- **Runs from a bare clone.** A test asserts the doorbell's import graph is
  only `node:` builtins and relative repo paths, so no `npm install` is
  needed.
- **Workflow text tests.** `bot-chat-alarm.yml` holds secrets only in `run:`
  steps under `social`/`ops`, checks out `main`, and has no agent job.
- **Gates.** Unit tests are green, `npm run lint` has 0 errors, and Codex
  reviews the PR that adds the workflow (max two rounds).

## Files affected

- **New:**
  - the clock files: see `m7-clock.md`
  - `scripts/doorbell/doorbell.mjs`: the gateway loop, thin
  - `scripts/doorbell/lib/doorbell-core.mjs` + `.test.ts`: selection, ring,
    timer decision, config
  - `scripts/doorbell/longlive-doorbell.service`
  - `.github/workflows/bot-chat-alarm.yml`
  - `scripts/marjorie/chat-alarm.mjs` + `.test.ts`
  - `docs/ops/doorbell.md`: install, update, stop, logs, key expiry
- **Edited:**
  - `scripts/marjorie/chat-poll.mjs` + test: `context` claims with 👀; the
    poll's doorbell watch
  - `scripts/marjorie/lib/chat-inbox.mjs`: `DOORBELL_LIVE`, a helper for
    someone else's 👀
  - `scripts/marjorie/chat-post.mjs` `finish`: `replied in <n>s`
  - `scripts/marjorie/chat-workflows.test.ts`
  - `docs/specs/marjorie-overhaul/m5-chat.md`: an amendment note on pickup
  - `MAP.md`, `docs/plans/marjorie-overhaul/checkpoints.json`,
    `HUMAN-ACTIONS.md` (the install HA)
- **Not touched:**
  - the L1 files (`tree-weekly-plan.md`, `weekly-brief.mjs`,
    `assemble-brief.mjs`, `loop-asks.mjs`);
  - `social/queue/` and the approval poll;
  - anything in the Hermes repo.

## Open questions

- **Host details.** This assumes a Linux VM host with systemd and `sudo`.
  The install HA's first steps confirm the OS and `node -v`. If a service
  outside the Hermes containers is not possible there, run the doorbell as
  its own container: no mounts shared with Hermes, the same env file, the
  same code.
- **Getting under 2.5 minutes.** Most of a reply's time is four GitHub runner
  boots, the price of keeping secrets away from the agent, plus the agent
  itself. Measure first (Mechanics 8). One candidate: fold `post` into
  `finish` once `DISCORD_MARJORIE_WEBHOOK_URL` is also in `social` (HA #67
  asks for that).
- **The 6-minute threshold.** Joey asked for 2.5 minutes. A normal reply
  takes 2.5–3.5, so a 2.5-minute alarm would fire on healthy replies. The
  timing record sets the real number after a week.
