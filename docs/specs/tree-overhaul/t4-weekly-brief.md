# T4 — The Monday brief, in the channel, two-way

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 3 build)
**Depends on:** S3 (the generic reaction table and reply ingestion), T1 (one name), T2 (the rationale line per slot).

---

## Behavior you will see

Every Monday morning, Tree posts its week in `#longlive-social` — the same place you already approve drafts, instead of an email you have to go find.

You get, in order:

1. **Five lines of scorecard** — posts shipped, follower change, failures, how many drafts you approved / edited / rejected, and how long it took you to answer.
2. **What changed and why** — two or three sentences. "You rejected both product posts for sounding like ads, so I've dropped the product beat from the heartbeat rotation and replaced it with era deep-cuts."
3. **The next 14 days**, one line per slot with the reason it's there.
4. **Up to three proposals**, numbered, each its own message. React ✅ or ❌ on each. That's the whole approval — no form, no PR.
5. **Up to two questions**, if Tree genuinely needs your judgement.

**Reply in the thread on any message** (or just reply to the message) and Tree reads it. If you answer before **Wednesday midnight UTC**, Tree re-plans the rest of the week that same day rather than waiting a week. After Wednesday your reply still counts — it shapes next Monday.

The weekly email still arrives, unchanged, as a copy for the record. The conversation is in Discord now.

---

## Data

### Message layout

The brief is a sequence of webhook messages, every one carrying the S3 `ref:` line so reactions bind unambiguously. `<sha>` is the plan PR's head SHA.

| # | Content | `ref:` scope token |
|---|---|---|
| 1 | header: scorecard (5 lines) + "what changed and why" | `brief` |
| 2 | calendar, days 1–7 | `calendar:1` |
| 3 | calendar, days 8–14 | `calendar:2` |
| 4..6 | one proposal each (≤3) | `proposal:1`, `proposal:2`, `proposal:3` |
| last | questions (≤2) + how to reply | `questions` |

Splitting the calendar across two messages is not cosmetic: 14 days is 28 campaign slots (2 beats/day per `docs/marketing/social-strategy.md` §2), and 28 rationale lines exceed Discord's 2000-character message limit. Two messages of 14 slots fit with room to spare, and they chunk further through the existing `chunkPreservingRefLine` if a week runs long.

Only `proposal:<n>` messages are reactable. ✅/❌ on `brief`, `calendar:*` or `questions` is recorded in the ledger as feedback with no action — a founder ❌-ing the whole brief is telling Tree something, and it should land as a lesson (T5), not as an error.

### The five scorecard lines

```
**Posts this week:** X 7 · IG 7 · FB 7 (21 total)
**Follower change (7d, vs 2026-09-08):** IG +14 · X +2 · FB +0
**Failed posts this week:** 0
**Your verdicts:** 9 ✅ · 2 ✏️ · 1 ❌ — 25% needed a change from you
**Time to your answer:** median 3h 10m, slowest 19h
```

Lines 1–3 are today's `renderScorecard` verbatim. Lines 4–5 are new:

- **line 4** counts `social/feedback/<week>.jsonl` rows by `action` (S3). "Needed a change from you" = `(edit + reject) / total`, the number T7's ladder reads and the number that should trend to zero.
- **line 5** is brief-to-reaction latency (item S8). Because Discord exposes no per-reaction timestamp, it is measured as **brief message timestamp → the poll run that resolved it**, which over-reports by up to the 15-minute poll interval. Labelled `median` and `slowest`, never a false precision, and the over-report is documented in the script rather than hidden.

When a window has no rows, each line says so in words (`no drafts went to you this week`), never `0%` or `NaN`.

### Proposal message shape

```
**Proposal 2 of 3 — drop the product-peek heartbeat pillar**

You rejected both product posts this month ("sounds like an ad", "we're not
a shop"). Product-peek is 1 of 5 heartbeat pillars, so dropping it costs
~3 slots a fortnight, which era-deep-cut absorbs.

If you ✅ this I'll rewrite the heartbeat rotation in
docs/marketing/social-strategy.md and open it as a PR for you to merge.
If you ❌ it I'll keep the pillar and try a different angle on it.

React ✅ or ❌. Reply in the thread if it's neither.
ref: PR #4141 · <sha> · proposal:2
```

Required in every proposal: what Tree wants to change · the evidence (quoting the founder's own reasons from the ledger where they exist) · what it costs · what happens on ✅ and on ❌. A proposal without evidence from the ledger or the scorecard is not a proposal, it is a preference, and the runner prompt says so.

### Thread-reply ingestion

A founder reply reaches Tree by either route, and neither is privileged:

1. **A thread reply.** Discord attaches a `thread` object to the message a thread was started from. The poll reads `message.thread.id` and fetches `GET /channels/<threadId>/messages?limit=100`.
2. **A plain reply**, via `message_reference`, already implemented for S3.

Both are filtered to `SOCIAL_APPROVERS` authors. Each qualifying reply becomes one comment on Tree's plan PR:

```
**From Joey in #longlive-social** (on: Proposal 2 of 3 — drop the product-peek heartbeat pillar)

> keep it but only when there's an actual new product, not as filler

discord-reply: 1416...
```

The trailing `discord-reply: <id>` is the dedupe key: before posting, the poll lists the PR's comments and skips any id already present. This is the same "no new state file" approach S3 uses for nudges, and for the same reason — a state file that must be committed to `main` is a new failure mode for no gain.

### The Wednesday cut-off

When a qualifying approver reply lands on a plan brief **and** `now` is before **Wednesday 23:59:59 UTC** of that brief's own ISO week, the poll dispatches a mid-week re-plan:

```
gh workflow run routine-tree-weekly-plan.yml -f mode=replan -f pr=<n>
```

At most **one** re-plan dispatch per plan PR. The poll posts `replan-dispatched: <ISO-week>` as a PR comment immediately before dispatching, and refuses to dispatch if that marker already exists — so a founder sending five replies on Tuesday triggers one re-plan, not five.

A reply arriving **after** the cut-off is still ingested as a PR comment. It is not dropped, it is deferred: Tree's step 0 reads last week's PR comments at the start of every run, so it lands in next Monday's plan. The brief's `questions` message says this in one line, so the deadline is never a surprise.

**`mode=replan`** differs from a normal run: it re-reads the plan PR's comments, rewrites `social/calendar.md` **from the current day forward only** (never rewriting slots already drafted and approved), amends the same plan PR rather than opening a second one, and posts a short "what I changed" message in the existing brief's thread instead of a whole new brief.

---

## Mechanics

### New — `scripts/social/weekly-brief.mjs`

Builds and sends the brief. Mirrors `approval-prompt.mjs`'s structure deliberately: a pure `buildWeeklyBrief(plan, scorecard, {headSha, pr})` returning an array of `{content}` messages, and a thin `sendWeeklyBrief` reusing the same webhook, `TREE_WEBHOOK_USERNAME`, `TREE_AVATAR_URL`, `neutralizeMentions` and `chunkPreservingRefLine`. Everything worth testing is in the builder.

It returns the delivered message ids so the workflow can write the Discord permalink into the PR body:
`https://discord.com/channels/<guildId>/<channelId>/<messageId>`. `guildId` comes from the same `GET /webhooks/{id}/{token}` call that already resolves `channel_id`.

### `scripts/social/social-approval-poll.mjs`

1. Fetch thread messages for any candidate message carrying `message.thread`.
2. Extend the scope-token dispatch (S3) with `proposal:<n>`, `brief`, `calendar:<n>`, `questions`.
3. Post approver replies as plan-PR comments, deduped on `discord-reply:`.
4. Dispatch the Wednesday re-plan, guarded by the `replan-dispatched:` marker.
5. Write proposal verdicts to the ledger as `action: "approve"|"reject"` rows with `file: "proposal:2"` and `pr` set to the plan PR — so proposals are counted in T5's distillation and *excluded* from T7's per-campaign-type rates (the ladder counts drafts, not proposals; the filter is `file.startsWith('social/queue/')`).

### `scripts/social/weekly-scorecard.mjs`

`buildScorecard` gains `verdicts` and `latency` from the ledger; `renderScorecard` grows from 3 lines to 5. Existing three lines are byte-identical so Tree's PR body template does not change.

### `.github/workflows/routine-tree-weekly-plan.yml`

- Gains `workflow_dispatch` inputs `mode` (`plan` | `replan`, default `plan`) and `pr`.
- Step order becomes: write the calendar → open (or amend) the PR → run `weekly-brief.mjs` with the PR number and head SHA → write the Discord permalink into the PR body → dispatch `tree-mail.yml`.
- Needs `SOCIAL_APPROVAL_WEBHOOK_URL`, so it must run in the `social` GitHub environment like the poll does.

### `.github/workflows/tree-mail.yml`

The `tree-pr-mail` job's `pull_request` trigger is narrowed to exclude `tree/plan/**` branches, and a `workflow_dispatch` path taking a PR number is added. This removes a real race: today the mail fires on the PR event, which can beat the Discord post and mail a body with no permalink in it. Ordering it explicitly is simpler than making the mailer wait.

The email is otherwise unchanged — same subject, same verbatim PR body — and gains one first line: *"This is a copy. The live version, where you can react and reply, is in #longlive-social: <link>."*

### `docs/agents/runner-prompts/tree-weekly-plan.md`

Adds the brief's required shape, the ≤3 proposals / ≤2 questions caps, the "a proposal needs evidence" rule, and `mode=replan` behaviour. The existing PR-body four-section report stays — it is what the email carries and what the next run's step 0 reads.

---

## Acceptance criteria

1. A dispatched weekly-plan run posts the full message sequence to Discord, each message carrying a well-formed `ref:` line matching `REF_LINE_RE`, with scope tokens `brief`, `calendar:1`, `calendar:2`, `proposal:1..n`, `questions`.
2. A 14-day plan with 28 slots renders without any single message exceeding Discord's 2000-character limit.
3. ✅ on `proposal:2` writes a ledger row with `file: "proposal:2"` and the plan PR number; ❌ on it writes a `reject` row and **requires a reply** exactly as S3 specifies for every other scope.
4. A thread reply from an approver appears as a plan-PR comment quoting it verbatim and carrying `discord-reply: <id>`; running the poll again posts no duplicate.
5. A reply from a non-approver produces no PR comment and no dispatch.
6. A Tuesday reply dispatches `routine-tree-weekly-plan.yml` with `mode=replan` exactly once; a second and third reply the same day dispatch nothing further.
7. A Thursday reply produces a PR comment and **no** dispatch.
8. `mode=replan` amends the existing plan PR, leaves already-approved slots untouched, and posts into the existing thread rather than posting a new brief.
9. `renderScorecard` emits 5 lines, its first 3 byte-identical to today's output for the same fixture.
10. With an empty ledger, lines 4 and 5 render as sentences, not as `0%` or `NaN`.
11. The weekly email contains the Discord permalink in its first line, and `tree-mail.yml` does not fire twice for one plan PR.

---

## Files affected

| Path | Change |
|---|---|
| `scripts/social/weekly-brief.mjs` | **new** — builder + sender |
| `scripts/social/social-approval-poll.mjs` | thread fetch, new scope tokens, reply→PR-comment, replan dispatch |
| `scripts/social/weekly-scorecard.mjs` | `verdicts`, `latency`, 5-line render |
| `scripts/social/lib/feedback.mjs` | latency + verdict aggregation helpers |
| `.github/workflows/routine-tree-weekly-plan.yml` | `mode`/`pr` inputs, `social` environment, step order, permalink |
| `.github/workflows/tree-mail.yml` | narrowed trigger, dispatch path, "this is a copy" line |
| `docs/agents/runner-prompts/tree-weekly-plan.md` | brief shape, caps, evidence rule, replan |
| `docs/agents/tree.md` | the Monday brief as the primary founder surface |
| `tests/` | builder cases, chunk-limit case, replan-once case, empty-ledger render |

---

## Open questions

None blocking. Decided here — all reversible:

- **Discord is primary, email is a copy.** The founder already answers in Discord; a second inbox is where a two-way loop goes to die.
- **Proposals get one message each**, so a reaction binds to one proposal with no ambiguity — the same property the draft brief already relies on.
- **Only proposals are actionable**; reactions elsewhere are recorded as feedback. A founder ❌-ing the whole brief is signal, not an error case.
- **Wednesday 23:59 UTC**, matching the plan's own wording. It leaves Thu/Fri/Sat/Sun to execute a re-plan, which is the point of having a cut-off at all.
- **One re-plan per plan PR.** A founder replying five times on Tuesday means one conversation.
- **A late reply is deferred, never dropped**, and the brief says so.
- **`tree-mail.yml` is dispatched, not PR-triggered**, to kill the permalink race rather than paper over it.
- **Latency is honest about its ±15-minute floor** rather than reporting a precision the API cannot support.
