# M5 — Talk to the bots (Discord chat for Marjorie and Tree)

Written 2026-09-13 by the Fable review session that closed M4, from a
direct product call by Joey the same day: "I want to be able to talk to
both of them in Discord today … Marjorie has to have power." Sibling specs
in this directory are the source of truth for everything they cover; this
one covers only the conversational loop. Epic #4180.

## Behavior you will see

- You write a message in `#longlive-marjorie` (top level or in any thread).
  Within about fifteen minutes Marjorie replies **in the same thread** (a
  top-level message gets a thread started for it) and marks your message
  👀 when she picks it up and ✅ when her reply is posted. The delay is a
  5-minute poll plus a routine's start-up; the reply says nothing about
  being late.
- The same in `#longlive-tree` gets Tree. Tree's replies are conversation
  only; approvals stay reactions on Tree's own posts, exactly as before, and
  a reply from Tree is never an approval, a post, or a caption change.
- Marjorie **acts before she answers.** "Blocker X is already done" → she
  closes the human action or the issue, comments on the day's brief issue
  (amended at build: the charter forbids editing its body after posting), and
  says what she changed with the number. A question she can answer from the
  repo gets the answer with a file or issue cited. A request the fleet can
  act on becomes a GitHub issue (`marjorie-filed`, the right desk label) or
  a routine dispatch, and she names it. A decision only a founder can make
  is answered with the options and her recommendation, nothing filed.
- Tree answers about strategy, the week's plan, the scorecard, and the
  lessons ledger, citing the plan PR or the brief. A request that changes
  the plan becomes a numbered proposal in the open plan PR's comments, so
  the existing replan mechanics pick it up; Tree never mutates
  `social/queue/` or posts from chat.
- Both bots know how they talk to each other: through numbered issues
  (`marjorie-filed` / `tree-filed`, spec `l1-loop.md`) surfaced in each
  other's briefs, never directly. Asked "can you talk to Tree?", Marjorie
  says exactly that and cites the last such issue if one exists.
- Silence is a bug. Every founder message gets exactly one reply or an
  `[chat failed]` line in the same channel from the workflow itself (a
  `run:` step, never the agent), so you never wonder whether it was seen.

## Data

- **Inbox** = messages in the two channels (and their active threads) from
  a founder's Discord user id, newer than 24 h, that do not yet carry the
  bot's own 👀 reaction. Founder ids come from the repo variable
  `DISCORD_FOUNDER_IDS` (comma-separated) when it is set, else from the two
  founder ids already committed in `scripts/social/lib/approvers.mjs`;
  anything else is ignored. *(Amended at build: the variable does not exist
  and creating one is founder-only; the same ids are already in the repo.)*
- **Reactions are the state.** 👀 = claimed by a run (added *before* the
  routine starts), ✅ = replied, ❌ = the workflow failed and posted
  `[chat failed]`. No cursor file, no issue comments as a ledger; a re-run
  can never double-reply because a claimed message is filtered out.
- **Context handed to the routine** (one JSON file per message,
  `.scratch/chat-context.json`): channel, thread id, message id, author,
  text, the message it replies to, the thread's root, the last 15 messages
  of the thread (or the channel, for a top-level message) with author names,
  and which bot. *(Amended at build: written by the chat routine's own first
  job — `chat-poll.mjs context`, a `run:` job under `environment: social` —
  and handed to the agent job as a same-run artifact, not by the poll. A
  cross-run artifact download needs `actions: read` on `routine-template.yml`,
  and a reusable workflow cannot request a permission its caller didn't grant
  without breaking every existing caller.)*
- **Reply** = one Markdown file the agent writes to
  `.scratch/out/chat-reply.md` (the template uploads `.scratch/out/`)
  (≤1800 chars; the workflow truncates with "…" when longer). *(Amended at
  build: no link to the run — the run's artifacts are deleted; mentions are
  neutralized and `ref:`-shaped lines defused BEFORE the cap, so what is
  checked is what is sent, always as one Discord message. Codex review of
  the routines PR found expansion after the cap could split a Tree reply and
  start the second message on a forged approval ref.)* Posted by a `run:` step through the channel's existing webhook
  (`DISCORD_MARJORIE_WEBHOOK_URL` / `DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL`)
  with `thread_id`. Webhooks cannot create threads, so a top-level founder
  message is answered by first creating a thread on it with the bot token
  (`POST /channels/{id}/messages/{id}/threads`; the thread takes the
  message's id), then posting via webhook. *(Amended at build: the thread is
  created in the `context` job, before the agent runs — Marjorie's webhook
  lives only in `ops` and the bot token only in `social`, so no one job can
  hold both. HA #69 granted Send Messages but not Create Public Threads; if
  Discord refuses the thread, the reply posts at channel top level with a
  link to the founder's message and the run logs a warning.)*
- **Turn log**: each reply run appends one line to the day's brief issue
  (`founders-brief`) as a comment `💬 chat: <channel> → <what was done>`,
  ending in a `<!-- chat-id: <message id> -->` marker, so the next morning's
  brief and MR2 can count them. *(Amended at build: no founder text — this
  repo is public, and a turn log is permanent. The design had the first 80
  characters. The agent's summary is told never to quote the founder.)*

## Mechanics

1. **`bot-chat-poll.yml`** — cron `*/5 * * * *` plus
   `workflow_dispatch` (a `dry_run` input claims and dispatches nothing).
   One job, `run:` steps only, environment `social` (owns
   `DISCORD_BOT_TOKEN`), permissions `actions: write` and `issues: write`.
   Script `scripts/marjorie/chat-poll.mjs poll`: for each channel, list
   active threads (`GET /guilds/{id}/threads/active`, filtered to the
   channel) and the channel itself, read messages newer than 24 h, keep
   founder messages without the bot's 👀, oldest first, at most 3 per
   channel per run. Hitting the ten-page safety cap before reaching the end
   of the 24-hour window fails the poll as incomplete coverage. For each new
   message: add 👀, then `gh workflow run
   routine-marjorie-chat.yml` (or `routine-tree-chat.yml`) with inputs
   `message_id`, `channel_id`, `thread_id`. A refused 👀 dispatches nothing,
   and a bot whose routine file is not on `main` yet is skipped. A 👀 is
   never removed and a claimed message is never dispatched again: after an
   ambiguous dispatch result, avoiding duplicate agent actions takes priority
   over automatic retry. Reconciliation waits until the founder message is at
   least 45 minutes old. For each eligible claim it lists runs created since
   that message (`--created >=<timestamp>`, limit 200); a list error or a full
   200-result page makes that claim inconclusive and fails the poll. Every
   matching `run-name` is inspected, and any queued or running match vetoes
   settlement. With a complete list and no active match, the poll reads what
   Discord shows through `lib/chat-delivery.mjs`, the check the routines'
   `finish` also uses. It stops if ✅ or ❌ arrived since the channel scan;
   adds ✅ when a reply is already there (delivered, but its ✅ failed); adds
   ❌ alone when a referenced notice is already there. Otherwise it bot-posts
   a referenced `[chat failed] … please send it again` line, then adds ❌ as
   the settlement lock. A failed read sends nothing and fails the poll. A
   refused notice leaves no ❌, so the next poll retries it; a successful
   notice is its own idempotency marker, so a refused or interrupted ❌ is
   retried without reposting. A reply is a webhook post under the bot's name
   in the thread started on the message, in the message's own thread before
   the next human message, or at top level opening `↪ <message link>` — no
   hidden marker, since Discord shows `<!-- -->` as text. A place
   the poll cannot read, a missing channel, or a founder message with a blank
   body (no Message Content intent) fails the run, so watchdog sees it.
   `GITHUB_TOKEN` may dispatch
   workflows when the job declares `actions: write` (the 403 in #4223 was
   the App installation token inside the agent, not this path). The Discord
   fetch/backoff and `isRootOrWebhookMessage` moved from `reply-poll.mjs` to
   `scripts/marjorie/lib/discord-bot.mjs`, and both scripts import them.
   The channels are found by name in the guild the Tree webhook names.
   *(Amended at build: the reply relay runs as this job's second step, so
   there is one Discord poll job, not two. A 15-minute cadence was built first
   on the belief that each fire drew on the org's $10/month Actions hard
   stop; billing data showed this public repo's minutes net $0, so the spec's
   5 minutes stands.)*
2. **`routine-marjorie-chat.yml` / `routine-tree-chat.yml`** — callers of
   `routine-template.yml`, `workflow_dispatch` only, model `claude-opus-5`,
   `max_turns: 25`, `timeout_minutes: 15`. Jobs: `context` (`social`:
   `chat-poll.mjs context`, creates the thread for a top-level message,
   uploads `chat-context`) → `run` (the template, `pre_run_artifact:
   chat-context`, `post_run_artifact: chat-reply`) → post → finish (Mechanics
   3). *(Amended at build: concurrency is per message, via the template's
   `concurrency_key` input, not per bot. A GitHub concurrency group keeps
   only one pending run and cancels the older pending one, so "queued, never
   cancelled" is not available and a per-bot group would drop the middle of
   three messages. Every existing caller passes none of the three new inputs
   and is unaffected.)* Each run is named `Marjorie chat · <message id>` /
   `Tree chat · <message id>` (`run-name`, the poll's reconcile key). Each
   chat workflow also has its own concurrency group per message, and its
   `context` job stops the run before the agent when the message already
   carries the bot's ✅ or ❌. Thus the poll's ❌ settlement lock also stops a
   late routine before agent work, while the all-match active-run veto protects
   a routine already past context. Prompts `docs/agents/runner-prompts/marjorie-chat.md` and
   `tree-chat.md` read the context file, load the charter, act, and write
   the reply file. Marjorie's caller uses `checkout_token_secret:
   SOCIAL_POSTER_PAT` + `expose_dispatch_token: true` so she can re-dispatch
   routines the way `routine-marjorie-ops.yml` already does; Tree's does
   not (Tree dispatches nothing from chat).
3. **Post step** (`run:`, after the agent, `if: always()`): read the reply
   file; empty or missing → post `[chat failed] <run url>` and react ❌;
   otherwise post via webhook, react ✅, append the turn-log comment.
   *(Amended at build: two jobs for Marjorie — `post` under `ops` posts the
   reply, if one was saved, through her webhook; `finish` under `social`
   settles. Tree's webhook is a repo secret, so its post and finish steps
   share one `social` job. `post` never sends `[chat failed]`: a webhook
   cannot reply to a message, so the poll could not dedup it. `finish` reads
   Discord first (`lib/chat-delivery.mjs`, as in Mechanics 1). A failed read
   sends nothing and fails the job; a message with ✅/❌ is left alone; a
   delivered reply gets ✅; an existing referenced notice gets ❌ alone;
   otherwise it bot-posts the referenced `[chat failed] <run url> — please
   send it again` line, then ❌, and a refused notice leaves no ❌. The agent
   job and the post step run only when `github.run_attempt` is 1, so
   "re-run failed jobs" never repeats an agent's actions or a post; a re-run
   can only settle. Every guard takes its ids from the dispatch inputs and
   the `context` job's outputs, which survive a re-run; artifacts may not.
   The turn-log comment is written only by the run that placed ✅/❌, and a
   failed one is a warning, not a failed job. These came from Codex's two
   reviews of the routines PR. Dispatching with
   `force_fail: true` skips the agent job, which is the failure smoke path.)* The bot token and webhooks never enter the agent's
   environment (`docs/agents/marjorie.md` invariant; `reply-poll.mjs:1-6`).
4. **Marjorie's authority in chat** (prompt, enforced by the PR diff and
   `allowed_tools`, same as M2): `gh issue create/comment/close/edit`, label
   edits, `gh pr create` for doc-only changes under `docs/` and
   `HUMAN-ACTIONS.md`, `GH_TOKEN="$GH_DISPATCH_TOKEN" gh workflow run` for any
   routine in `scripts/marjorie/runner-cadence.json`. Never: `social/queue/`,
   `scripts/social/post-queue.mjs`, secrets, force pushes, product code.
   Closing a human action = a PR that removes the entry (v2 format, the
   `human-actions` skill), which auto-merges on green.
5. **Tree's authority in chat**: read everything; write only PR comments on
   the latest plan PR and comments on `tree-filed` issues. *(Amended at
   build: "latest" means open or not. No plan PR has been opened yet, and
   Monday's step 0 reads `head:tree/plan/ --state all --limit 1`. Tree's
   agent job holds no PAT, dispatch token or git. Any reply line shaped like
   an approval prompt's `ref:` line is defused, so the approval poller can
   never read a chat reply as a prompt.)* Charter amendment
   in `docs/agents/tree.md`: "never post, never reply" becomes "never posts
   to social platforms and never approves; answers founder questions in
   `#longlive-tree` threads through the chat routine." Merges on green like
   Marjorie's charter (#4185 rule).
6. **Reply poller stays.** `reply-poll.mjs` keeps relaying brief-
   thread replies to the brief issue (since the build it runs as
   `bot-chat-poll.yml`'s second step; `marjorie-reply-poll.yml` is
   dispatch-only); the chat routine reads that issue
   too, so a reply in the brief thread gets both an issue comment and an
   in-thread answer. No double action: the routine checks the issue's
   comments for its own `💬 chat:` line before acting.
7. **Cost**: at most 3 messages per channel per poll, one Opus turn each,
   25 turns; a busy hour is ≤24 routine runs, a normal day a handful. Opus
   draws on plan usage, not dollars (`docs/decisions.md` #838). Each chat run
   is three or four short jobs plus the agent job, roughly 8–12 Actions
   minutes, which this public repo is not billed for. Kill switch: repo variable
   `BOT_CHAT_ENABLED=false` makes the poll job exit 0 before reading.

## Acceptance criteria

- **Live proof, both bots, cited on #4180 with message links and run URLs**:
  Joey asks each bot "what is your job?" and "can you talk to Tree /
  Marjorie?" and gets an in-thread reply from each within 15 minutes; both
  messages carry ✅.
- **Power proof**: Joey tells Marjorie in chat that a listed blocker is
  done; her reply cites the PR that removes the human action (or the issue
  she closed) and the brief issue shows her `💬 chat:` comment.
- A forced failure (dispatch with `inputs.force_fail=true` on the smoke
  path) posts `[chat failed]` and reacts ❌; a re-run of the poll does not
  re-claim that message.
- Unit tests for `chat-poll.mjs` (founder filter, 👀 filter, the 3-per-
  channel cap, thread-vs-top-level context) and the post step's truncation.
- `#longlive-tree` reaction semantics untouched: the approval poll's tests
  still pass and a bot chat reply carries no approval marker.
- No secret in any agent environment; the PR diff shows the bot token only
  in `run:` steps under `environment: social`.
- Docs: `docs/decisions.md` entry (chat loop + Tree's charter change),
  `docs/agents/marjorie.md` and `tree.md` amended, `MAP.md` rows,
  `docs/agents/routine-invariants.md` if a new invariant is introduced.

## Files affected

- New: `.github/workflows/bot-chat-poll.yml`, `routine-marjorie-chat.yml`,
  `routine-tree-chat.yml`; `scripts/marjorie/chat-poll.mjs` + `.test.ts`;
  `scripts/marjorie/chat-post.mjs` + `.test.ts`;
  `docs/agents/runner-prompts/marjorie-chat.md`, `tree-chat.md`.
  *(Added at build: `scripts/marjorie/lib/discord-bot.mjs` (the bot-token
  REST helper moved out of `reply-poll.mjs`), `lib/chat-inbox.mjs` (the
  poll's pure half), `scripts/marjorie/ha-close.mjs` + test (a
  deterministic human-action close — the agent has no Write tool),
  `scripts/marjorie/chat-workflows.test.ts`, `scripts/marjorie/lib/chat-delivery.mjs`
  + `chat-delivery.test.ts` (the shared "already answered?" check). The agent
  saves its reply with `chat-post.mjs save`. `finish` deletes the run's chat
  artifacts: this repo is public, and they hold founder messages.)*
- Edited: `.github/workflows/routine-template.yml` (optional artifact
  pre-step; added at build: `post_run_artifact`, `concurrency_key`),
  `marjorie-reply-poll.yml` and `watchdog.yml` (added at build),
  `scripts/check-routine-workflows.mjs` (dispatch-only routines, added at
  build), `scripts/marjorie/lib/discord.mjs` (`username` option),
  `docs/agents/runner-prompts/marjorie-brief.md` (a relay already answered
  in chat is not answered again), `docs/agents/marjorie.md`, `docs/agents/tree.md`,
  `docs/decisions.md`, `MAP.md`, `HUMAN-ACTIONS.md` (#69 amended),
  `docs/plans/marjorie-overhaul/PLAN.md`, `checkpoints.json` (MR2 counts
  chat turns).

## Open questions

- **Founder-only or anyone?** Founder ids only for now; opening it to a
  role is a one-line change to the filter.
- **Latency.** A Gateway bot on Hermes' VM would make replies near-instant
  but crosses the channel-ownership decision of 2026-09-12 and needs the VM;
  revisit only if the poll-plus-routine loop feels too slow after a week.
- **Tool grants versus authority — decided** (Joey, 2026-09-13, in chat).
  `Bash(gh:*)`/`Bash(node:*)` and Marjorie's PAT can technically do more than
  the prompts allow. Accepted for M5: prompt + tool grants + PR-diff review,
  the M2/M3 boundary. Hardening to trusted helpers is #4271.
- **Founder text in a run's artifacts — decided** (Joey, 2026-09-13, in
  chat). Any signed-in GitHub user can download a chat run's context (the
  message and up to 15 messages of history) while the run is in flight,
  normally ~10 minutes, with one-day retention as the backstop. Accepted.
  Nothing the chat routines write to GitHub quotes founder text: the prompts
  link to the message instead, and the turn log's summary is told never to.
- **Reactions permission.** 👀/✅/❌ need "Add Reactions" for the bot on
  both channels; HA #69 asked for it and was closed done on 2026-09-13.
  Unproven until the first live claim.
