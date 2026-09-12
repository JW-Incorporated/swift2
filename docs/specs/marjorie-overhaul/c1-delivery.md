# C1 — Marjorie's Discord delivery module

Wave M1 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`,
epic #4180). Design only; M1 builds it.

## Behavior you will see

A new Discord channel, `#longlive-marjorie`, starts carrying everything
Marjorie has to say. Each morning her Founders' Brief appears there as a
message from "Marjorie". Through the day, every watchdog alert appears there
the moment it opens — and a second line when it clears. Submission triage
that needs your answer appears there too.

Long messages arrive as two or three consecutive messages rather than one
truncated one, split at paragraph breaks so nothing is cut mid-sentence. No
message ever pings `@everyone` or `@here`, even if a quoted user submission
contains that text.

If Discord itself is down, you get one email instead, with `[discord failed]`
at the front of the subject line. That is the only email any of this can
produce, it is decided by an HTTP status code rather than by judgment, and
seeing one means "Discord was broken", not "this was important".

You will not see Marjorie post anywhere else. She never posts in
`#longlive-tree` (that channel stays reaction-pure so the approval poller's
✅ always means what it thinks it means), never in `#longlive`, and never in
`#human-action-*`.

## Data

Nothing persisted. The module is a transport: text in, delivery result out.

| Name | Kind | Where | Value |
|---|---|---|---|
| `DISCORD_MARJORIE_WEBHOOK_URL` | environment secret | new `ops` environment, `main`-only deployment branch | Discord webhook URL for `#longlive-marjorie` |
| `MARJORIE_EMAIL` | repo variable | already exists | fallback sender (unchanged) |
| `GMAIL_APP_PASSWORD` | repo secret | already exists | fallback auth (unchanged) |

HA #66 (open, filed 2026-09-12) is the founder action that creates the `ops`
environment and deposits the webhook. **No `ops` environment exists today** —
verified against every `environment:` key in `.github/workflows/*` (only
`social-brief`, `social`, `tree-mail` exist).

`DISCORD_BOT_TOKEN` is **not** used for posting. It already exists as an
environment secret in the `social` environment, read-only (View Channel +
Read Message History), `main`-only.

### Reaching the secret — the part that does not work today

An environment secret is visible **only to a job that declares that
environment**, and a job has exactly one. Three consequences, all verified,
and all of them break the naive design:

1. **`routine-template.yml` has no `environment` key at all.** No routine
   job — brief, ops, or triage — can read an `ops` secret as things stand.
   Watchdog alert #4129's own body says the same thing out loud: *"not
   **Environment**-scoped secrets."*
2. **`upsert-alert.sh` has six caller workflows, not two**:
   `watchdog.yml`, `production-backup.yml`, `backup-restore-drill.yml`,
   `production-backup-drill.yml`, `mobile-parity.yml`, `social-audit.yml`.
   A caller without `environment: ops` gets an empty webhook, the post fails,
   and the fallback mails — producing exactly the bot email this wave exists
   to remove.
3. **`social-poster.yml`'s notify steps are inside its `post` job, which is
   bound to `environment: social`** (`:147-152`). The `ops` webhook is
   unreachable from there and a second environment cannot be added to a job.

**Resolution, in order of preference:**

- **`routine-template.yml` gains an `environment` input** (string, default
  `""`), applied as `environment: ${{ inputs.environment }}`. An empty
  string is treated as no environment by Actions — **M1 must prove this on an
  existing routine before relying on it**, because a regression here breaks
  all 13 routines at once. It is the acceptance criterion below, not an
  assumption.
- **The brief does not need that input.** It uses a second job:
  `needs: run`, `environment: ops`, which re-reads the day's
  `founders-brief` issue body and posts it. This is the pattern
  `routine-tree-weekly-plan.yml:84-101` already uses, so it is proven. The
  agent job never touches the webhook.
- **The four drill/audit callers and `watchdog.yml` get `environment: ops`**
  on the job that calls `upsert-alert.sh`.
- **`social-poster.yml` gets neither** — its notices are handled differently;
  see `c3-email-retired.md`.

## Mechanics

### The module — `scripts/marjorie/lib/discord.mjs` (new)

```js
export async function post(text, { thread, webhook, fetchImpl } = {})
```

Returns `{ ok, chunks, delivered, status, error }`. Never throws on a
delivery failure — the caller decides whether to fall back.

Behavior, in order:

1. `neutralizeMentions(text)`, then `chunkForDiscord(text, 2000)`.
2. POST each chunk in order to `${webhook}?wait=true` with
   `{ content, username: 'Marjorie', avatar_url, allowed_mentions: { parse: [] } }`.
   When `thread` is set, append `&thread_id=${thread}`.
3. **Retry once** on a non-2xx or a thrown network error, after a 2-second
   wait. On HTTP 429, honour `retry_after` from the response body instead of
   the fixed wait. One retry, then give up — this is the only retry.
4. Stop at the first chunk that fails both attempts; report which chunk index
   failed so the caller's fallback carries the whole message, not a fragment.

**Reuse, do not re-implement.** `neutralizeMentions` and `chunkForDiscord`
are imported from `scripts/community/discord-delivery.mjs`
(`discord-delivery.mjs:14-19` and `:76-110`) — both are already pure,
unit-tested, and shared by `scripts/social/weekly-brief.mjs:32`. This module
adds only what is genuinely missing today: the retry, thread support, and the
fallback contract. It is the fourth send loop in the repo and it should be
the last; if a fifth consumer appears, extract a shared `postToWebhook` into
`scripts/lib/discord-format.mjs` and re-point all of them. Not now — that
refactor touches `approval-prompt.mjs` and `weekly-brief.mjs`, both on the
posting path, and it buys nothing this wave needs.

### The fallback — `scripts/marjorie/post-or-mail.mjs` (new, thin CLI)

```
node scripts/marjorie/post-or-mail.mjs --subject "<subject>" --body-file <path> \
  [--url <url>] [--thread <id>] [--no-mail-fallback]
```

Calls `post()`. On `ok`, exits 0. On failure, writes
`{ subject: "[discord failed] <subject>", body, url }` to a temp JSON and
invokes `python3 scripts/watchdog/send-mail.py <that file>` — the existing
contract (`send-mail.py:12`, payload shape `:13`/`:77`), unchanged.

**Two traps this must handle, both verified in the source:**

- `send-mail.py` **exits 0 when `MARJORIE_EMAIL`/`GMAIL_APP_PASSWORD` are
  unset** (`send-mail.py:63-70`) — a silent no-op. The fallback therefore
  cannot treat exit 0 as "the founder was reached". `post-or-mail.mjs` must
  print one explicit line naming which path delivered (`discord`, `email`, or
  `neither`) and exit non-zero on `neither`, so a failed run is visible in the
  Actions log rather than green-and-silent.
- `send-mail.py`'s recipient is **hard-coded** to `sffan15@gmail.com`
  (`send-mail.py:29`), with no CC parameter. This is correct for the new
  world (decisions 2026-09-12 item 6: Wyatt is not separately notified) and
  needs no change.

`--no-mail-fallback` suppresses the email leg and exits 0 on a Discord
failure after logging it. One caller needs it: `upsert-alert.sh` under
`ALERT_ALSO_MAIL=1`, which is already mailing deliberately and must not mail
twice when Discord is also down (`c3-email-retired.md`).

**Exit-code contract, because a caller runs under `set -euo pipefail`:**
non-zero only when `delivered: neither` **and** `--no-mail-fallback` was not
passed. `upsert-alert.sh:26` sets `-e`, so a non-zero exit there aborts the
rest of the script — including, inside watchdog's per-workflow loop
(`:333-347`), every remaining workflow's check. Callers that cannot tolerate
an abort order their own mail leg first and pass `--no-mail-fallback`.

This CLI is the **only** judgment-free path from Marjorie to email. No agent
step ever decides to send mail.

### Webhook, not bot token — the call, and why

**Decision: post with the webhook.** Reversible; a later switch to the bot
token is a one-file change behind the same `post()` signature.

1. Every existing Discord post in this repo is a webhook post
   (`discord-delivery.mjs`, `weekly-brief.mjs`, `approval-prompt.mjs`). A bot
   post would be the only one of its kind and would need its own auth,
   rate-limit and error handling.
2. `#4180` lists "bot token permissions (Send Messages, Create Threads)
   unverified" as a blocker. A webhook has no scopes to verify — it is a URL
   that can do exactly one thing. Choosing the webhook removes the blocker
   instead of scheduling work to clear it.
3. **A webhook cannot read.** The write path is structurally incapable of
   pulling channel history, which matters because this module runs inside
   agent steps. The read capability stays in a separate credential used only
   by a plain `run:` step.
4. A webhook carries its own `username`/`avatar_url` per message, so
   "Marjorie" is a display identity with no bot account to provision.

The one thing a webhook cannot do is **create** a thread. It can post *into*
an existing thread (`?thread_id=`), which is all C2 and M4 need — the brief
message is the thread root and Discord threads a message on first reply.

### Reading replies (what M4 needs) — spec'd here, built in M4

A poller job, **not** an agent step. Model it on `social-approval-poll.yml`,
which is already the proven pattern:

- Cron, plus `workflow_run` on the brief routine completing.
- `environment:` an environment whose deployment branches are `main` only.
- A plain `run:` step invoking a Node script — **no `claude-code-action`, no
  agent, in that job**. This is how `DISCORD_BOT_TOKEN` stays out of an agent
  context today (`social-approval-poll.yml:66,77-84`) and the rule is
  unchanged: agent processes never see the bot token.
- Read with `GET /channels/{threadId}/messages?limit=100`,
  `Authorization: Bot ${token}`, 429-aware (`social-approval-poll.mjs:208-229`,
  `:342`).
- Output is a GitHub issue comment on that day's brief issue. The poller
  writes to GitHub; it never decides anything.

Reuse the existing read-only `DISCORD_BOT_TOKEN` rather than minting a
second. It needs no new scope to read a channel it can already see — but it
must be granted View Channel on `#longlive-marjorie`, which is a founder
action M4 files, not M1.

## Acceptance criteria

1. `node -e "import('./scripts/marjorie/lib/discord.mjs')"` resolves and
   `post` is exported.
2. Unit tests with an injected `fetchImpl`: a 4100-character message posts as
   3 chunks in order; a message containing `@everyone` posts with the literal
   neutralised; a first-call 500 followed by a 200 delivers and reports one
   retry; two consecutive 500s return `ok: false` with the failing chunk
   index; a 429 with `retry_after` waits that long rather than 2 s.
3. `grep -c 'chunkForDiscord\|neutralizeMentions' scripts/marjorie/lib/discord.mjs`
   is non-zero **and** neither function is redefined in that file — reuse is
   verified by absence of a copy, not by comment.
4. `post-or-mail.mjs` with an unreachable webhook and `GMAIL_APP_PASSWORD`
   unset exits **non-zero** and prints `delivered: neither`.
5. A real `workflow_dispatch` run posts one message visible in
   `#longlive-marjorie`, and the run log shows a 2xx.
6. `git grep -n 'DISCORD_MARJORIE_WEBHOOK_URL' .github/workflows` shows it
   used only inside jobs declaring `environment: ops`, **and** every one of
   the six `upsert-alert.sh` callers declares it on the calling job.
6b. `routine-template.yml` accepts an `environment` input, and an existing
   unrelated routine (`routine-kevin-radar.yml` — cheap, Haiku, twice daily)
   runs green through it with the input **unset**. This is proven before any
   Marjorie routine depends on it.
6c. `post-or-mail.mjs --no-mail-fallback` against an unreachable webhook
   exits **0** and sends no mail.
7. No new `#longlive-tree` or `#longlive` post exists in any Marjorie code
   path: `git grep -n 'DISCORD_SOCIAL' scripts/marjorie/` returns nothing.

## Files affected

| File | Change |
|---|---|
| `scripts/marjorie/lib/discord.mjs` | **new** — `post()`, retry, thread support |
| `scripts/marjorie/lib/discord.test.ts` | **new** — the tests above |
| `scripts/marjorie/post-or-mail.mjs` | **new** — CLI, Discord-then-mail fallback |
| `scripts/community/discord-delivery.mjs` | none — imported, not edited |
| `scripts/watchdog/send-mail.py` | none — called through its existing contract |
| `MAP.md` | rows for the three new files |
| `HUMAN-ACTIONS.md` | HA #66 already open; no new item |

## Open questions

None blocking. Recorded decisions, all reversible and made here:

- **Webhook over bot token for posting** — reasons above.
- **Retry exactly once, then fall back.** A longer backoff inside a scheduled
  Action buys little and delays every other step; the email fallback is the
  real durability mechanism.
- **No shared `postToWebhook` extraction this wave.** Named as the follow-up
  if a fifth consumer appears.
- **Reuse `DISCORD_BOT_TOKEN` for M4's reader** rather than minting a second
  credential. **The bot needs View Channel on `#longlive-marjorie`** — a
  founder action. File it alongside HA #66 **now**, not in M4, so the reply
  poller is not blocked on a founder a second time.
- **The reply poller can ship in M2, not M4.** It is a pure `run:`-step
  mechanism with no dependency on Tree; only the Tree-facing prompt edits
  (L1) need to wait for Tree recheck R2 on 2026-09-21. Splitting it shortens
  the window in which a founder's thread reply is invisible to Marjorie from
  weeks to days.

One thing genuinely outside this spec's authority: whether the founders want
the fallback email to also fire when Discord succeeds but nobody reads the
channel for N days. That is a product question about attention, not delivery,
and it is not in scope for M1.
