# Long Live status page — operations

Bots v2 W4 (`docs/plans/bots-v2/PLAN.md`, C1 and C6). The owner's daily
update is one permanent, pinned GitHub issue labeled `status-page`, titled
`📋 Long Live — Status`, not a Discord message. Its body is rewritten by
`scripts/marjorie/status-page.mjs` — deterministic, no LLM — so it is always
the same shape and costs no model tokens.

## What the page shows

| Section | Source |
|---|---|
| Needs you | Every open `HUMAN-ACTIONS.md` item: number, title, one-line why, link to the entry (the detailed instructions). `[DECIDE]` items add how-to-decide lines, the options, and `decide #N <choice>`; others show `done #N`. |
| Shipped (last 7 days) | Merged PRs by Pacific day. Housekeeping is dropped by `NOISE_RULES` in `scripts/marjorie/lib/status-shipped.mjs` (dependabot, growth snapshots, cie scans, social ledger/poster fold-backs, Tree drafts, output sampling, human-action bookkeeping, chase filings, merch automation). One test per rule — change the list there, not here. |
| Next up | Newest open `weekly-plan` issue (absent is fine) and open non-draft PRs (cap 8). |
| Growth | Latest `social/metrics/YYYY-MM-DD.json` followers vs the snapshot nearest seven days earlier. |
| Tree | Posts in `social/posted/` published in the last 7 days; open `social-draft` PRs awaiting approval. |
| Marjorie's note | Her ≤12-line judgment, written by the morning brief routine. Kept across re-renders. |

## When it updates

`.github/workflows/marjorie-status.yml`, job `render`: every 3 hours (`7 */3 * * *`),
on a push to `main` touching `HUMAN-ACTIONS.md` or `social/**`, and on
`workflow_dispatch`. The brief's `deliver` job also re-renders before pinging.
A source that cannot be read (a GitHub endpoint, a file) is named in a
warning line on the page instead of being shown as empty.

Preview without writing anything: `node scripts/marjorie/status-page.mjs --dry-run`
(live read-only `gh` data).

## Replying

Comment on the status issue. Only the owner's own account (`sffan15-sys`, with
`OWNER`/`MEMBER`/`COLLABORATOR` association) is ever acted on; this repo is public and every
other comment, and every bot comment, is ignored — the workflow's `if` and
`status-reply.mjs` both check.

- `done #N` — closes a blocking/upgrade item.
- `decide #N <choice>` — closes a `[DECIDE]` item and records the choice in
  the ledger. If the item lists options (a `Decide:` step line), the choice
  must be one of them; extra words after the option are kept as detail.
- Either one opens a `Close HA #N` PR from `status-page/ha-close-N-<comment id>`
  through `ha-close.mjs`'s `closeHumanAction`, with auto-merge, using
  `SOCIAL_POSTER_PAT` so required checks run. The bot answers with an ack
  comment (PR link) and re-renders; the page keeps the item, marked
  `⏳ Closing now`, until the PR lands on `main`.
- Wrong shape (`done` on a decision, an unknown option, a closed item) gets a
  reply with the right syntax and closes nothing.
- **Closing is all it does.** A decision such as `assign` or `defer` is
  recorded, not executed; Marjorie reads the ledger and acts on it.
- Any other owner comment goes to Marjorie right away. The `reply` job answers with
  a `👀 Passed to Marjorie` comment and dispatches `routine-marjorie-status-reply.yml`
  (dispatch-only, the Discord chat routine's twin: `scripts/marjorie/status-relay.mjs`
  re-reads the comment from GitHub and passes it to the agent only if it is the
  owner's own comment on a status-page issue; prompt
  `docs/agents/runner-prompts/marjorie-status-reply.md`). She acts inside the chat
  routine's authority list and answers with one comment on the issue. Her reply is a
  bot comment, so nothing loops. If the dispatch fails the bot says so and the
  next morning brief still reads the comment.
- A choice that means *skip* (`skip`, `defer`) closes the item as `skip` in the
  ledger, which the chase reads as "held"; `skip` is accepted even when an item
  does not list it.
- Only one reply job runs at a time (shared concurrency group), and a second
  `done #N` for an item whose closing PR is still open is answered with a pointer
  to that PR instead of opening another.

## The daily brief

`routine-marjorie-brief.yml` still runs at 12:00 UTC on Opus, but it no longer
opens a `Founders' Brief` issue. The agent writes the note with
`node scripts/marjorie/status-note.mjs write --body-file <path>`; the `deliver`
job then re-renders the page, files the note's `- For Tree:` ask (unchanged
L1 behavior), and posts one line to `#longlive-marjorie`:
`📋 Status updated — <link>`. The email fallback is intact (same
`post-or-mail.mjs`). Delivery is recorded as `<!-- marjorie-ping date=… -->`
in the issue body; `brief-guard.mjs` reads it to keep a day from delivering
twice, and the watchdog's "brief exists" check reads the note's date
(`status-note.mjs today`).

Re-pointed at the status issue: `reply-poll.mjs` finds the day's Discord thread from
the `msg=` id in the page's ping stamp and relays replies as comments there;
`chat-post.mjs`'s turn log lands there too; dispatch-chase reads held markers from the
page body. `stamp-held` (run by `deliver`) shows the chase's held items on the page in
a "Held" section and records the hidden `marjorie-held` markers beside them, outside
Marjorie's sanitized note, so the brief never re-announces an item. Left alone:
`marjorie-brief-delivery-recovery.yml` still works on legacy `founders-brief` issues.

### Cleanup after this ships

As of 2026-09-30 there are 36 open `founders-brief` issues (#3357 through
#4630) — the old briefs were never auto-closed. Once the first status-page
ping has landed, close them in one pass with a note pointing at the status
issue (`gh issue list --label founders-brief --state open --json number`, then
`gh issue close <n> --comment "Superseded by the status page."` for each).
Closing #4630 also ends the reply poller's and chat turn log's work, which is
intended.

## Link previews

Every Marjorie webhook post and the `[chat failed]` bot notice carry
`flags: 4` (SUPPRESS_EMBEDS) in code (`scripts/marjorie/lib/discord.mjs`,
`lib/chat-delivery.mjs`) — not channel permissions, which would also remove
deliberate image embeds. Tree and community senders are other workstreams.

## First run and pinning

The first `--apply` creates the issue (label `status-page`) and tries to pin
it with the GraphQL `pinIssue` mutation using the workflow token. If GitHub
refuses, the issue still exists and updates; pin it once by hand (issue page →
Pin issue). The label is also in `scripts/marjorie/bootstrap-labels.mjs` and is
exempt from the work-ownership sweep (`EXEMPT` in `scripts/check-work-ownership.mjs`,
`LEDGER_LABELS` in `scripts/ops/unowned-sweep.mjs`) — it is a publication, not a task.

## Known limits

- A note write and a render can race; `status-note.mjs` re-reads and retries
  once, and fails loudly if the write still did not stick.
- The page body is capped at 60,000 characters (GitHub's limit is 65,536); the
  Shipped list is trimmed first.
- Journal comments from the brief land on the status issue inside a collapsed
  `<details>` block, one a day.
