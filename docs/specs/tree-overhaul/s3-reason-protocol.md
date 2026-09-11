# S3 — Reason protocol + feedback ledger

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 3 build)
**Extends:** the B1 approval mechanism (`docs/social/RULINGS-SOCIAL-2.md`, `docs/decisions.md` 2026-09-11). Supersedes nothing.

---

## Behavior you will see

Today a brief from Tree lands in `#longlive-social` and you react ✅ or ❌. After this there are three reactions:

- **✅** — approve. Nothing else needed. It posts on schedule, exactly as now.
- **✏️** — approve *with a fix*. React ✏️, then **reply to that same brief message** with the caption you want instead. Within 15 minutes Tree swaps your text in, re-signs it, and merges. Your words are what ships, verbatim.
- **❌** — kill it. React ❌, then **reply saying why**, in whatever words you like: "too salesy", "wrong photo", "we posted this in June".

The reply is the point. ✏️ and ❌ both need one. React without replying and nothing happens yet — the draft just sits. Once a day Tree posts one short nudge:

> Draft 2 on PR #4130 — you reacted ❌ but I don't have a reason yet. Reply to that message and I'll record it.

No reason, no action. A bare ❌ will never again silently close the whole thing.

Every reason you write is kept and read back to you. Tree quotes them in Monday's brief, and stops making the same mistake.

---

## Data

### 1. Feedback ledger — `social/feedback/<ISO-week>.jsonl`

One append-only JSONL file per ISO week, named `2026-W38.jsonl` (ISO-8601 week, UTC). One line per resolved reaction. Committed to `main` by the poll job.

```jsonc
{
  "ts": "2026-09-17T15:42:11Z",        // when the poll resolved it, not when the founder reacted
  "pr": 4130,
  "file": "social/queue/2026-09-18-eras-scarf-x.json",
  "platform": "x",
  "campaign": "thread:hidden-clues:origin-story:2026-09",
  "pillar": "thread:hidden-clues",      // campaign family, derived — never hand-written
  "action": "edit",                      // "approve" | "edit" | "reject"
  "reason": "the hook buries the date, lead with it",
  "originalBody": "There's a detail in the...",
  "editedBody": "On 22 Oct 2012, Taylor...",   // present only when action === "edit"
  "approver": "discord:338508192755482626",
  "messageId": "1416...",                // the brief message the reaction sat on
  "replyId": "1416..."                   // the reply carrying the reason; null for "approve"
}
```

Field rules:

- **`action: "approve"` rows are written too**, with `reason: null` and `replyId: null`. Frictionless ✅s are the denominator for T7's autonomy ladder and for the edit-rate trend — without them the ledger only measures failure.
- **`pillar` is derived, never authored.** `thread:hidden-clues:origin-story:2026-09` → `thread:hidden-clues`; `heartbeat:on-this-day` → `heartbeat:on-this-day`; `launch:mood-chat:announce` → `launch:mood-chat`; a null `campaign` → `null`. Rule: the campaign family as defined in `docs/marketing/social-strategy.md` §1, i.e. the first two colon-segments, or the whole value when it has fewer than three.
- **`reason` is the founder's reply verbatim** — mentions neutralized (`neutralizeMentions`), trimmed, capped at 2000 characters.
- Rows are never edited or deleted. A reversal is a new row.

### 2. Queue-item provenance — `social/queue/**.json`

An ✏️ adds one object so the edit travels with the post into `social/posted/`:

```jsonc
"edit": {
  "by": "discord:338508192755482626",
  "at": "2026-09-17T15:42:11Z",
  "message": "1416...",
  "fromBody": "There's a detail in the..."
}
```

`edit` sits deliberately **outside** `contentHashPayload` (`scripts/social/lib/queue.mjs` — `platform`, `body`, `media`, `altText`, `scheduledAt`, `campaign`), so adding it cannot void a stamp. `body` *is* in the payload, so the poll must write the new `body` **before** calling `stampFiles`; the resulting `contentHash` then covers the edited text. That is exactly right — the founder approved their own words, and any later change to them voids the stamp as usual.

### 3. Reaction → action table (generic — reused by S6 and T4)

A **reaction target** is any webhook-authored message whose last line matches the existing `REF_LINE_RE`, `^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$`. The third capture generalizes from "file path" to a **scope token**:

| Scope token | Kind | Meaning |
|---|---|---|
| `*` | `pr` | every reactable item on the PR |
| `social/queue/**.json` | `draft` | one social draft |
| `social/reddit/**.json` | `reddit` | one Reddit prompt (S6) |
| `proposal:<n>` | `proposal` | proposal *n* in Tree's Monday brief (T4) |

| Reaction | Reply required | `draft` | `reddit` (S6) | `proposal` (T4) |
|---|---|---|---|---|
| ✅ | no | stamp, then merge | mark the item done | accepted; Tree implements it next run |
| ✏️ | **yes** | replace `body` with the reply, write `edit`, stamp, merge | replace the prompt text with the reply | accepted *as amended by the reply* |
| ❌ | **yes** | `git rm` the file, comment `reject: <file> — <reason>`; on `*`, close the PR with the reason | drop the item, record the reason | rejected |

Rules holding for every kind:

- **✅ needs no reply** and is unchanged from today.
- **✏️ or ❌ with no approver reply is `pending`** — the poll acts on nothing, logs nothing, re-evaluates next run.
- **✅ and ❌ together** → ❌ wins (a reversal is a rejection) and still needs a reason.
- **✏️ and ✅ together** → treat as ✏️ if a qualifying reply exists, else ✅ (the founder added a fix on top of an approval).
- **A reply from a Discord user not in `SOCIAL_APPROVERS` is ignored entirely.** It is not a reason and does not unblock a pending reaction.

### 4. Reply detection

Discord returns `message_reference: { message_id, channel_id, guild_id }` on any reply, inside the same `GET /channels/{id}/messages?limit=100` page the poll already fetches. **No extra API call.** A reply qualifies as a reason when all hold:

1. `message_reference.message_id` equals the brief message's id;
2. `author.id`, as `discord:<id>`, is in `SOCIAL_APPROVERS`;
3. `content` is non-empty after trimming;
4. its `timestamp` is after the brief message's timestamp.

Condition 4 is weaker than "after the reaction was placed" because **Discord exposes no per-reaction timestamp**. Stated as a known limitation rather than faked: a founder could in principle reply first and react second, and the reply still counts. That is the behaviour a human would expect anyway.

If **several** qualifying replies exist, the latest wins for `replyId`, and all of them are concatenated into `reason` in chronological order separated by newlines — a founder who types three short lines meant all three. For `action: "edit"`, the **latest reply alone** becomes the new body (concatenating three drafts of a caption would produce nonsense).

### 5. The nudge

When a reaction is `pending` for lack of a reply, the poll posts **one** message per target per 24 hours through `SOCIAL_APPROVAL_WEBHOOK_URL`:

```
Draft 2 on PR #4130 — you reacted ❌ but I don't have a reason yet.
Reply to that message with why and I'll record it and act on it.
nudge: PR #4130 · <messageId>
```

**No new state file.** The poll already reads the last 100 channel messages; it finds its own prior nudges by the `nudge:` line and suppresses a repeat within 24h for the same `messageId`. If that nudge has scrolled out of the last 100 messages, a repeat is acceptable and better than silence.

---

## Mechanics

### `scripts/social/social-approval-poll.mjs`

1. **Ingest replies from the messages already fetched.** Build `repliesByParent: Map<messageId, Message[]>` from any message carrying `message_reference.message_id`, filtered to `SOCIAL_APPROVERS` authors. Zero additional Discord calls.
2. **Add ✏️.** `const PENCIL = '%E2%9C%8F%EF%B8%8F'` (U+270F U+FE0F). The variation selector **must** be included — Discord treats `✏` and `✏️` as different reaction keys, and the emoji picker inserts the `️`-suffixed form. `getMessageApprovals` returns `{ approvedBy, rejectedBy, editedBy }`.
3. **Resolve each target** through one pure helper, `classifyReaction(reactions, replies)` → `{ action: 'approve'|'edit'|'reject'|'pending'|'none', reason, editedBody, approver, replyId }`. This is the single function S6 and T4 reuse; it is unit-tested without Discord.
4. **Edit path.** Write the new `body`, add `edit`, then call `stampFiles` on the edited file **in the same run**, then one `git add`/`commit`/`push`. One commit, not two — a half-applied edit that pushed an unstamped body would brief-mismatch on the next run and strand the draft.
5. **Reject path.** Unchanged in shape, but carrying words: the comment becomes `reject: <file> — <reason>`, and the header close comment `reject: founder reacted ❌ on the brief — <reason>`. The `reject:` prefix is preserved verbatim because `docs/agents/runner-prompts/growth-draft.md` greps for it.
6. **Never close on a bare ❌.** The current unconditional `execGh(['pr','close',...])` on `rejectHeader` moves inside the `reject` branch, which requires a reason by construction.
7. **Ledger write.** After all per-PR work, append every resolved row to `social/feedback/<ISO-week>.jsonl` **on `main`**, one commit per run (`social-feedback: N reaction(s) recorded`), pushed directly.
8. **Idempotency.** Before appending, read the current week's file *and* the previous week's (to survive a week boundary mid-resolution) and skip any row whose `(pr, file, messageId, action)` tuple already exists. Reactions are stable, so re-running an already-resolved target must be a no-op.

### The stale-SHA problem ✏️ makes acute (#4127)

An ✏️ commit moves the PR's head SHA, so on the next run **no** Discord message matches `prView.headRefOid` and the PR drops silently out of the poll — the same trap #4127 describes for stamp commits, except ✏️ makes it a certainty rather than a race. Required, and specified here rather than deferred:

> A message whose `ref:` SHA is stale is still authoritative for a scope token whose queue file already carries an `approval` object with `approval.message === <that message's id>` and a `contentHash` still matching the file on disk. **Freshness is required to *create* an approval, never to keep honouring one.**

The poll partitions each PR's refs into `current` (SHA matches — may create approvals) and `honoured` (SHA stale, file already validly stamped naming this message — may only proceed to merge). A genuinely new commit from a drafter still changes `body`, which voids `contentHash`, which drops the file out of `honoured` — so the property that matters is preserved.

**Why honouring an unsigned field is safe.** `approvalSigPayload` is `${v}|${by}|${at}|${pr}|${contentHash}` — `message` is *not* signed. That is fine here: the `honoured` path can only **merge a file that already carries a valid signature over its own content**, never mint one. A forged `message` value therefore grants nothing an attacker does not already have (the ability to write a file whose `sig` they cannot produce). No change to the signature payload is needed, and none should be made — changing the payload string invalidates every prior signature.

### `.github/workflows/social-approval-poll.yml`

- Grant `contents: write` on `main` for the ledger commit (the job already pushes to PR branches).
- The ledger push races other `main` pushes: on non-fast-forward, `git pull --rebase` once and retry once; on a second failure `::warning::` and carry the rows to the next run. The rows are re-derivable from Discord, so a lost push is never lost data.

### `scripts/social/approval-prompt.mjs`

Rewrite the header instruction line:

```
Approve: ✅. Approve with a fix: ✏️ then reply with the caption you want.
Reject: ❌ then reply with why. ✏️ and ❌ do nothing until you reply.
React on a draft for that one, or here for all of them.
Merging the PR yourself does NOT approve — it kills the drafts.
```

### New — `scripts/social/lib/feedback.mjs`

Pure helpers, unit-tested, I/O only through injected readers: `isoWeek(date)`, `pillarOf(campaign)`, `classifyReaction(...)`, `appendRows(existingLines, rows)`. Everything worth testing lives here rather than in the poll, per the precedent stated in `lib/queue.mjs`'s header comment.

---

## Acceptance criteria

1. ✏️ on a draft with an approver reply yields: `body` equal to the reply verbatim; an `edit` object naming that approver and message; `approvalStatus(item, {approvers, key}).ok === true` against the edited content; the PR merged.
2. ✏️ with no reply leaves the file untouched, writes no ledger row, and leaves the PR unmerged across two consecutive runs.
3. ❌ with a reply removes only that file, comments `reject: <file> — <reason>` containing the reply verbatim, and writes an `action: "reject"` row.
4. ❌ with no reply **does not close the PR** and **does not remove the file**; one nudge naming that message is posted, and only one within 24h.
5. ✅ writes an `action: "approve"` row with `reason: null` and otherwise behaves exactly as today.
6. A reply authored by a Discord id not in `SOCIAL_APPROVERS` satisfies the reply requirement for no reaction.
7. Running the poll twice against an unchanged channel produces no duplicate ledger rows and no second nudge.
8. A PR stamped in run *N* whose head SHA has advanced past every brief's `ref:` line still merges in run *N+1* (the #4127 regression test).
9. `classifyReaction` unit tests cover: ✅ alone · ✏️+reply · ✏️ alone · ❌+reply · ❌ alone · ✅+❌ · ✏️+✅+reply · non-approver reply · multiple replies.
10. `pillarOf` is unit-tested against one real campaign value from each of the six families in `docs/marketing/social-strategy.md` §1.

---

## Files affected

| Path | Change |
|---|---|
| `scripts/social/social-approval-poll.mjs` | ✏️ reaction, reply ingestion, edit path, reason-carrying reject, no bare-❌ close, ledger write, stale-SHA honouring, nudge |
| `scripts/social/lib/feedback.mjs` | **new** — `isoWeek`, `pillarOf`, `classifyReaction`, `appendRows` |
| `scripts/social/approval-prompt.mjs` | header instruction line |
| `.github/workflows/social-approval-poll.yml` | `contents: write`, ledger push retry |
| `social/feedback/.gitkeep` | **new** directory |
| `social/README.md` | document `edit` on a queue item and the `social/feedback/` ledger |
| `docs/agents/runner-prompts/growth-draft.md` | the drafting run reads the ledger, not only `reject:` comments (detail in T5) |
| `tests/` (beside the existing social tests) | `feedback.test.ts` + poll integration cases |

---

## Open questions

None blocking. Decided here — all reversible:

- **Ledger on `main`, not the PR branch.** A rejected PR is closed and its branch deleted; a ledger living there would be destroyed by the very action it records.
- **JSONL over a single JSON file.** Append-only, line-level conflict-free between runs, `jq`-readable.
- **One file per ISO week.** Matches the Monday cadence T5 distils on and keeps each file readable whole.
- **✅ rows are logged.** Needed as T7's denominator and for the edit-rate trend.
- **Latest reply wins for an edit; all replies concatenate for a reason.** A founder typing several lines of *explanation* meant all of them; several *drafts of a caption* means the last one.
- **`edit` stays out of the content hash**, and the signature payload is left untouched.
