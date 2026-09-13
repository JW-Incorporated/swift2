# M5 — Talk to the bots (Discord chat for Marjorie and Tree)

Written 2026-09-13 by the Fable review session that closed M4, from a
direct product call by Joey the same day: "I want to be able to talk to
both of them in Discord today … Marjorie has to have power." Sibling specs
in this directory are the source of truth for everything they cover; this
one covers only the conversational loop. Epic #4180.

## Behavior you will see

- You write a message in `#longlive-marjorie` (top level or in any thread).
  Within about ten minutes Marjorie replies **in the same thread** (a
  top-level message gets a thread started for it) and marks your message
  👀 when she picks it up and ✅ when her reply is posted. The delay is
  GitHub Actions' floor (a 5-minute poll plus a routine's start-up), not a
  choice; the reply says nothing about being late.
- The same in `#longlive-tree` gets Tree. Tree's replies are conversation
  only; approvals stay reactions on Tree's own posts, exactly as before, and
  a reply from Tree is never an approval, a post, or a caption change.
- Marjorie **acts before she answers.** "Blocker X is already done" → she
  closes the human action or the issue, edits the day's brief issue, and
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
  bot's own 👀 reaction. Founder ids live in a repo variable
  `DISCORD_FOUNDER_IDS` (comma-separated); anything else is ignored.
- **Reactions are the state.** 👀 = claimed by a run (added *before* the
  routine starts), ✅ = replied, ❌ = the workflow failed and posted
  `[chat failed]`. No cursor file, no issue comments as a ledger; a re-run
  can never double-reply because a claimed message is filtered out.
- **Context handed to the routine** (one JSON file per message, written by
  the poll job and passed as a workflow artifact): channel, thread id,
  message id, author, text, the last 15 messages of the thread (or the
  channel, for a top-level message) with author names, and which bot.
- **Reply** = one Markdown file the agent writes to `.scratch/chat-reply.md`
  (≤1800 chars; the workflow truncates with "…" and a link to the run when
  longer). Posted by a `run:` step through the channel's existing webhook
  (`DISCORD_MARJORIE_WEBHOOK_URL` / `DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL`)
  with `thread_id`. Webhooks cannot create threads, so a top-level founder
  message is answered by first creating a thread on it with the bot token
  (`POST /channels/{id}/messages/{id}/threads`), then posting via webhook.
- **Turn log**: each reply run appends one line to the day's brief issue
  (`founders-brief`) as a comment `💬 chat: <channel> — <first 80 chars> →
  <what was done>`, so the next morning's brief and MR2 can count them.

## Mechanics

1. **`bot-chat-poll.yml`** — cron `*/5 * * * *` plus `workflow_dispatch`.
   One job, `run:` steps only, environment `social` (owns
   `DISCORD_BOT_TOKEN`), permissions `actions: write`. Script
   `scripts/marjorie/chat-poll.mjs`: for each channel, list active threads
   (`GET /guilds/{id}/threads/active`, filtered to the channel) and the
   channel itself, read messages newer than 24 h, keep founder messages
   without the bot's 👀, oldest first, at most 3 per channel per run. For
   each: add 👀, write the context file, `gh workflow run
   routine-marjorie-chat.yml` (or `routine-tree-chat.yml`) with inputs
   `message_id`, `channel_id`, `thread_id` and upload the context as an
   artifact named `chat-<message_id>`. `GITHUB_TOKEN` may dispatch
   workflows when the job declares `actions: write` (the 403 in #4223 was
   the App installation token inside the agent, not this path). Reuse
   `reply-poll.mjs`'s fetch/backoff and `isRootOrWebhookMessage`.
2. **`routine-marjorie-chat.yml` / `routine-tree-chat.yml`** — callers of
   `routine-template.yml`, `workflow_dispatch` only, model `claude-opus-5`,
   `max_turns: 25`, `timeout_minutes: 15`, concurrency group per bot (queued,
   never cancelled). A pre-step downloads the artifact to
   `.scratch/chat-context.json` (the template needs a small optional
   `pre_run_artifact` input; every existing caller passes nothing and is
   unaffected). Prompts `docs/agents/runner-prompts/marjorie-chat.md` and
   `tree-chat.md` read the context file, load the charter, act, and write
   the reply file. Marjorie's caller uses `checkout_token_secret:
   SOCIAL_POSTER_PAT` + `expose_dispatch_token: true` so she can re-dispatch
   routines the way `routine-marjorie-ops.yml` already does; Tree's does
   not (Tree dispatches nothing from chat).
3. **Post step** (`run:`, after the agent, `if: always()`): read the reply
   file; empty or missing → post `[chat failed] <run url>` and react ❌;
   otherwise create the thread if needed, post via webhook, react ✅, append
   the turn-log comment. The bot token and webhooks never enter the agent's
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
   the open plan PR and comments on `tree-filed` issues. Charter amendment
   in `docs/agents/tree.md`: "never post, never reply" becomes "never posts
   to social platforms and never approves; answers founder questions in
   `#longlive-tree` threads through the chat routine." Merges on green like
   Marjorie's charter (#4185 rule).
6. **Reply poller stays.** `marjorie-reply-poll.yml` keeps relaying brief-
   thread replies to the brief issue; the chat routine reads that issue
   too, so a reply in the brief thread gets both an issue comment and an
   in-thread answer. No double action: the routine checks the issue's
   comments for its own `💬 chat:` line before acting.
7. **Cost**: at most 3 messages per channel per poll, one Opus turn each,
   25 turns; a busy hour is ≤36 routine runs, a normal day a handful. Plan
   usage, not dollars (`docs/decisions.md` #838). Kill switch: repo variable
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
- Edited: `.github/workflows/routine-template.yml` (optional artifact
  pre-step), `docs/agents/marjorie.md`, `docs/agents/tree.md`,
  `docs/decisions.md`, `MAP.md`, `HUMAN-ACTIONS.md` (#69 amended),
  `docs/plans/marjorie-overhaul/PLAN.md`, `checkpoints.json` (MR2 counts
  chat turns).

## Open questions

- **Founder-only or anyone?** Founder ids only for now; opening it to a
  role is a one-line change to the filter.
- **Latency.** A Gateway bot on Hermes' VM would make replies near-instant
  but crosses the channel-ownership decision of 2026-09-12 and needs the VM;
  revisit only if the 10-minute loop feels too slow after a week.
- **Reactions permission.** 👀/✅/❌ need "Add Reactions" for the bot on
  both channels; if Joey grants only View + History, the build falls back to
  a `chat-claimed` comment marker on the brief issue and the spec is
  amended. HA #69 now asks for all four permissions on both channels.
