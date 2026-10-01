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
| Strategy | The `## Summary` (<= 6 bullets) of `docs/strategy/growth-strategy.md` on main, when that file last changed (commit date), a link to the whole file, and how to steer it. Absent file = no section. |
| For fans (7 days) | What a visitor would notice: merged content PRs (with an era link when the changed seed maps to one), social posts that went live (`social/posted/`, with links), user-facing features and fixes (merged PRs touching `apps/web/**` or `packages/experience/**`, not tests/docs/CI; a `feat`/`fix` title scoped to web/app when the file list is unavailable), app updates (`apps/mobile/**`), and fan feedback (`user-feedback` issues from the site's Feedback button: count + latest three). Plus Marjorie's plain-language recap between `<!-- fan-recap:start -->` markers, written by the morning brief (`status-note.mjs write-recap`). Logic: `lib/status-fans.mjs`. |
| Behind the scenes (7 days) | The merged-PR list, collapsed in a `<details>` block, minus what is shown under For fans. Housekeeping is dropped by `NOISE_RULES` in `scripts/marjorie/lib/status-shipped.mjs` (dependabot, growth snapshots, cie scans, social ledger/poster fold-backs, Tree drafts, output sampling, human-action bookkeeping, chase filings, merch automation). One test per rule — change the list there, not here. |
| Next up | Newest open `weekly-plan` issue (absent is fine): the `### To grow`, `### To make content better` and `### Other` sub-sections of its `## Next up` (read until the next `##`); a plan without sub-sections falls back to the flat bullets. Plus open non-draft PRs (cap 8). |
| Growth | Latest `social/metrics/YYYY-MM-DD.json` followers vs the snapshot nearest seven days earlier, and site usage: 7-day visitors and pageviews vs the week before, top 5 pages and referrers (Vercel Web Analytics via `lib/growth-traffic.mjs`, cached daily in the issue body by `status-traffic.mjs` — the only step holding `VERCEL_TOKEN`). |
| Tree | Posts in `social/posted/` published in the last 7 days; open `social-draft` PRs awaiting approval. |
| Marjorie's note | Her ≤12-line judgment, written by the morning brief routine. Kept across re-renders. |

## When it updates

`.github/workflows/marjorie-status.yml`, job `render`: every hour (`7 * * * *`),
on a push to `main` touching `HUMAN-ACTIONS.md` or `social/**`, and on
`workflow_dispatch`. A close PR merged by auto-merge (PAT) triggers the push run; the
hourly run is the backstop if a merge ever lands without one. The brief's `deliver` job
also re-renders (and pings) right after Marjorie writes her note.
A source that cannot be read (a GitHub endpoint, a file) is named in a
warning line on the page instead of being shown as empty.

### The change ping

One short Discord line in `#longlive-marjorie` whenever the page materially changed,
and nothing when it did not: `📋 Status updated — +1 needs you · 2 closed · 3 shipped · 1 post live · strategy updated — <link>`
(no link previews, no mentions). `render --notify` (`lib/status-ping.mjs`) hashes the meaningful parts
(waiting and closing items, shipped PRs, live posts, feedback, the plan, the strategy summary, the
fan recap and the note — never the timestamp, growth numbers or the in-flight PR list) against a hidden
`<!-- status-ping {...} -->` baseline in the issue body: same hash, no ping. At most one ping an hour,
unless a Needs-you item was added; held changes pile into the next ping. The baseline moves only when the
line was delivered, so a Discord failure is retried by the next render (the brief's run also falls back to
email, as before). Only `render` and the brief's `deliver` job post (the `ops` environment holds the
webhook); a reply-triggered re-render never posts or moves the baseline.
Preview without writing anything: `node scripts/marjorie/status-page.mjs --dry-run`
(live read-only `gh` data).

## Replying

Comment on the status issue. Only the owner's own account (`sffan15-sys`, with
`OWNER`/`MEMBER`/`COLLABORATOR` association) is ever acted on; this repo is public and every
other comment, and every bot comment, is ignored — the workflow's `if` and
`status-reply.mjs` both check.

- Four commands, each legal on ANY open item (task or decision):
  `done #N [note]`, `skip #N <why>` (closes as `skip`, which is final),
  `close #N <why>` (withdraws it, e.g. "wrong question, not a founder call"), and
  `decide #N <anything>`. If a decision lists options (a `Decide:` step line) and the
  answer starts with one, that option is recorded (extra words kept as detail);
  any other answer is recorded verbatim, never refused. Only a bare `decide #N`
  is answered with a question.
- Every close lands through ONE rolling PR, `Close HA #A, #B — owner replied on
  the status page`, on the bot-owned branch `status-page/ha-closes`
  (`lib/status-closes.mjs`). The pending closes live in the PR body as hidden
  `<!-- ha-close {...} -->` records; the branch is always rebuilt from the tip of
  `main` plus that list (header count recomputed from the file), then force-pushed
  with a lease — the only force-push anywhere, never `main` or a human's branch.
  Auto-merge uses `SOCIAL_POSTER_PAT` so required checks run. Two replies a minute
  apart therefore cannot conflict. The `heal` job (hourly, and on a push to
  `main` touching `HUMAN-ACTIONS.md` or `social/**`) rebuilds the branch whenever main has moved under it, drops a close
  someone else already made, and closes the PR if nothing is left.
- The page reflects a reply at once: the reply job re-renders right after the PR
  opens, and an answered item leaves Needs you for a small
  `✅ Closing — merging now` line (your answer + the PR) until the PR merges, then
  the line disappears. The ack comment carries the PR link.
- A reply for an item a close PR already carries (rolling, chat routine, or older
  per-item PR) is answered with a pointer to it; the first answer stands.
- An `#N` that is not open gets "isn't open" and nothing happens.
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
- A `decide` answer whose first word is `skip` or `defer` also closes as `skip`.
- Only one reply job runs at a time (shared concurrency group); `heal` has its own
  lane and races it safely (force-with-lease; the loser rebuilds).

## The daily brief

`routine-marjorie-brief.yml` still runs at 12:00 UTC on Opus, but it no longer
opens a `Founders' Brief` issue. The agent writes the note with
`node scripts/marjorie/status-note.mjs write --body-file <path>` and the fan-view recap with
`status-note.mjs write-recap --body-file <path>` (3-5 plain bullets, no jargon); the `deliver`
job then re-renders the page, files the note's `- For Tree:` ask (unchanged
L1 behavior), and renders once more with `--notify`, which posts the shared change line
above if the page changed (the brief's new note counts). It no longer posts its own daily
line. `<!-- marjorie-ping date=… -->` is still stamped (date only, no Discord message id):
`brief-guard.mjs` reads it to keep a day from delivering twice, and the watchdog's
"brief exists" check reads the note's date (`status-note.mjs today`). Replies in `#longlive-marjorie` — including replies to the change ping — are handled by Marjorie's chat routine
(`bot-chat-poll` → `routine-marjorie-chat`), the owner's steering channel. The old `reply-poll.mjs` relay of
ping-thread replies onto this issue is retired (docs/decisions.md, 2026-10-01); `chat-inbox` skips only
approval/community `ref:` posts, so a reply to the ping is picked up as chat.
Re-pointed at the status issue: `chat-post.mjs`'s turn log lands there; dispatch-chase reads held markers from the
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

## Bursts and decisions (Bots v2 W7)

- **No owner comment is dropped.** The `reply` job's concurrency group keeps one pending run,
  so three comments in a burst used to lose the middle one. The job now sweeps the thread
  (`scripts/marjorie/lib/status-sweep.mjs`): it handles every owner comment after the newest
  `<!-- status-ack: ID -->` the workflow wrote, oldest first, and each reply carries its own
  ack marker. Re-running it finds nothing left to do. A stranger's comment is never handled
  and a marker from anyone but the workflow is never trusted. If the thread cannot be listed,
  only the triggering comment is handled.
- **A decision reaches its tickets.** On `decide #N <choice>` the job comments the decision,
  with a link to the owner's comment, on every issue or PR the item names
  (`scripts/marjorie/lib/decision-propagate.mjs`), once each (`<!-- decision-propagated: HA-N
  -->`). Marjorie's next brief moves the tickets the decision settles.
