# Review brief — Wave 1 output and the plan going forward

**For:** a fresh Fable session, at the founder's request (2026-09-11).
**Written by:** the Opus session that executed Wave 1, as a handoff. Read this
first, then `PLAN.md`, then the seven specs.

This is not a summary to be trusted. It is a map of what was decided, by whom,
on what evidence — with the weak points named, so you can go at those rather
than re-reading everything from scratch.

---

## What Wave 1 produced

Seven design specs in `docs/specs/tree-overhaul/` — `s3-reason-protocol`,
`t1-one-charter`, `t2-self-critique`, `t4-weekly-brief`, `t5-lessons-ledger`,
`t6-side-doors`, `t7-autonomy-ladder` — plus one `docs/decisions.md` entry each
(2026-09-12), `docs/roadmap.md` social ownership set to Tree (single owner), and
`MAP.md` rows. Merged as PR #4135 (`b1219c2dc`), founder-approved in chat.

**No code shipped.** Wave 1 was design only. Waves 3, 4 and 5 build it.

## What has already been reviewed, and by whom

A previous `architect` (Fable, read-only) pass reviewed all seven specs before
merge and returned 7 must-fix findings. All 7 were independently verified
against the real code by the orchestrator before being folded in — **two of
them corrected facts that a `researcher` agent had reported wrongly** in the
same session (`social/queue/` is *not* empty; the poll already declares
`contents: write`). Three of the seven were serious:

1. The feedback ledger was specified as a direct push to `main`, which is
   branch-protected — it could never have run. Moved to the `social-ledger`
   branch, the pattern issue #2040 already established.
2. T4 specified running the weekly-plan **agent** job inside the `social`
   GitHub environment to reach the Discord webhook. That would have handed an
   agent process `SOCIAL_APPROVAL_KEY` and `DISCORD_BOT_TOKEN` — the exact
   authority separation B1 rests on. The webhook is a plain repo secret; a
   separate deterministic job now sends the brief.
3. T7's autonomy grant file was forgeable — any agent could have written
   `status: "active"` and had the poll sign a policy stamp. Grants are now
   HMAC-signed with `status` inside the payload.

Four of the reviewer's five "you over-built this" notes were **rejected**, with
reasons recorded in PR #4135's body. Those rejections are fair game to revisit.

**So: a second reviewer adds most value by NOT re-running that pass.** The
factual-accuracy sweep has been done and verified. What has not been tested is
everything below.

---

## Where to push hardest

### 1. Does the set actually deliver the goal state?

`PLAN.md`'s goal state has seven clauses. Wave 1 designed for all of them, but
the mapping was never independently checked. In particular: *"per-post metrics
drive the Monday audit"* (T3) and *"every Reddit prompt comes from Tree with a
stated why"* (S6) have **no spec at all** — deliberately, since they build
directly against S3's generic reaction table, but nobody has confirmed that
table is actually sufficient for them. If it is not, that is a Wave 1 gap
discovered at Wave 3 build time, which is the expensive moment.

### 2. The specs are interlocked, and the dependency order is fragile

S3 → T2 (`rulesChecked`, ledger) → T5 (distillation) → T4 (proposals) → T7
(eligibility). One ordering bug is already known and recorded (T1/T2 make
`lane` and `critique` required in Wave 3 while the side doors cannot supply
them until T6 in Wave 4 — see `t1-one-charter.md`, "Wave-ordering constraint").
**Assume there are others.** That known one was found by review, not by design,
which suggests the sequencing was not systematically checked.

### 3. Invented numbers presented as thresholds

Several thresholds have no data behind them and are stated as though they do:

| Where | Number |
|---|---|
| T2 | queue threshold 18/25, floors of 3, `notEmbarrassed` ≥ 4 |
| T2 | calibration "spread ≥ 3.0 points" |
| T5 | codify at 3 firings; retire at 8 quiet weeks + 10 briefs; ≤3 new rules/week |
| T6 | merch 72h / appearance 48h deadlines; 1/day and 3/rolling-7d caps; `timely` ≥ 4 |
| T7 | ≥8 briefs, ≥95%, 0 ❌, 28-day window |

Each spec admits this locally. Nobody has asked whether they are *collectively*
coherent — e.g. whether T2's threshold and T6's `timely` gate can both bind
without starving the calendar. Worth one pass.

### 4. T2's rubric is self-assessment by the thing being assessed

Tree scores its own drafts, and the threshold is enforced in
`validateQueueItem` — but the checker can only verify that scores were
*written*, never that they were *honest*. The design's answer is T2's Monday
calibration (comparing Tree's pre-hoc scores to the founder's verdicts) and the
explicit "uncalibrated" verdict. **Is that enough?** It is the weakest
load-bearing assumption in the set: if a model learns to write 4s and 5s, every
downstream mechanism — including T7's eligibility — inherits the inflation.

### 5. Scope: is this too much machinery for zero users?

Seven specs, four new libraries, a new branch-based ledger, a lessons ledger, a
rubric, an autonomy ladder — for an account with no audience. The plan's own
posture section says "build the full end state now and test after," which is the
founder's call and not up for re-litigation. But the previous reviewer flagged
five specific over-builds and four were rejected. An independent read on whether
those rejections were right is worth more than a fresh general opinion.

---

## The T7 decision — read this before forming a view

T7 (the autonomy ladder) lets a campaign family earn "post and notify" — posts
ship on schedule and the founder is told afterwards, with a 24h ❌ to pull the
type back to the gate.

**Both the Wave 1 author and the previous Fable reviewer recommended against
building it.** The founder considered that and **overruled it on 2026-09-11:
T7 is approved for build.** That decision is recorded in `docs/decisions.md`
with the reasoning against preserved rather than deleted.

**Do not re-litigate the decision.** Do pressure-test the shape it now has:

- It is split. Wave 4 builds only the read-only half (`eligibility()`, the
  Monday ladder-standing block). **Wave 5** — a new wave — builds the acting
  half, gated on checkpoint R4 (2026-10-16), on the X delete path being proven
  against a real post, and on the founder *re-confirming* the acceptance at
  that time. Reasoning in `PLAN.md` → "Why T7 is its own wave, gated on R4".
- **The irreducible fact:** Instagram has no delete operation in its API at all
  (code 100 / subcode 33, confirmed for real during the 2026-07-17 duplicate
  incident). A policy-approved Instagram post cannot be retracted by any
  automation. The mitigation is X and Facebook deleted automatically, Instagram
  handed to a human as a `founder-task`.
- **The question worth asking:** is the split the right seam, and is R4 the
  right gate? An alternative nobody has costed is reopening the mandatory
  X+Instagram pairing rule (`checkCampaignPair`, 2026-08-26) so autonomy could
  apply to X only, where posts *are* deletable. That was dismissed in the spec
  as "impossible without a founder decision" — which is true, but it was never
  actually put to the founder as an option.

---

## Standing facts a reviewer will otherwise have to rediscover

- `main` is branch-protected; no job can push to it. `social-ledger` is the
  unprotected branch used for anything a workflow must write (issue #2040).
- The Discord webhook is a **plain repo secret**. The `social` environment
  additionally holds `SOCIAL_APPROVAL_KEY` and `DISCORD_BOT_TOKEN`; no agent
  job may ever run inside it.
- `contentHashPayload` is an explicit allowlist: `platform`, `body`, `media`,
  `altText`, `scheduledAt`, `campaign`. Everything else on a queue item is
  unhashed, which is why `critique`, `edit` and `lane` can be added freely.
- `approvalSigPayload` is `${v}|${by}|${at}|${pr}|${contentHash}` — `message`
  is **not** signed. Changing this string invalidates every existing stamp.
- Campaign families are **variable-arity** (`thread:<lens>:<angle>` is three
  segments, `heartbeat:<pillar>` is two). Five families produce queue items;
  the sixth, Human reach, is a GitHub issue and has no `campaign` value.
- `social/queue/` currently holds four live drafts awaiting the gate.
- Discord exposes **no per-reaction timestamp**. Any latency metric is bounded
  below by the 15-minute poll interval, and the specs say so rather than
  faking precision.
- #4127 (the poll's own commit moving the head SHA and stranding the PR) is
  *designed* closed by S3's stale-SHA honouring rule, not merely deferred.

## Open items not owned by any wave

- **#4136** — 252 stale agent worktrees, all with live directories on disk;
  `git worktree prune` is a no-op against them. Filed 2026-09-11, unassigned.
