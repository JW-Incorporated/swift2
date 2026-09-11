# T2 — Self-critique and the pitch

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 3 build)
**Depends on:** T1 (`lane`), S3 (the feedback ledger, for the Monday calibration).

---

## Behavior you will see

Every brief opens with Tree's own pitch — two sentences, in plain English, above the caption:

> This is the Decode thread's origin-story beat: it teaches the one mechanic new followers don't get yet, using a dated, verifiable 2012 detail rather than a vibe. The photo is a credited Red-era shot, so the image earns its place instead of decorating.

That is Tree telling you *why this post exists* before you read a word of the caption. If the pitch is weak, you will usually know to react ❌ without reading further — which is the point.

You will also see fewer bad drafts. Before queueing anything, Tree scores its own draft out of 5 on five things: is it on strategy, is it in our voice, is it specific rather than generic, does the image earn its place, and — the one that matters most — *would I be embarrassed to send this?* Anything that fails its own scoring gets one rewrite, and if it still fails, **the slot is left empty**. An empty slot is better than filler; that rule already exists and this enforces it earlier.

On Monday you get one line telling you whether Tree's self-scores actually predicted your ✅s and ❌s. If they don't, Tree says so.

---

## Data

### `critique` on a queue item

```jsonc
"critique": {
  "v": 1,
  "scores": {
    "onStrategy": 5,      // does this execute a slot in social/calendar.md, for a real pillar?
    "onVoice": 4,         // fan-made, warm, Taylor-not-Swift, no AI tells, no banned opener
    "specific": 5,        // a dated/named/verifiable detail, not a vibe
    "mediaEarnsItsPlace": 4,
    "notEmbarrassed": 5   // "would I be embarrassed to send this to Joey?"
  },
  "total": 23,
  "rationale": "This is the Decode thread's origin-story beat: it teaches the one mechanic new followers don't get yet, using a dated, verifiable 2012 detail rather than a vibe. The photo is a credited Red-era shot, so the image earns its place instead of decorating.",
  "rulesChecked": ["no-launch-tease-before-live", "opener-not-a-question-two-weeks-running"],
  "revision": 1          // 1 = first attempt passed; 2 = passed after one rewrite
}
```

| Key | Type | Rule |
|---|---|---|
| `v` | `1` | schema version |
| `scores.*` | integer 1–5 | all five required; no nulls, no half-points |
| `total` | integer 5–25 | must equal the sum; validated, not trusted |
| `rationale` | string | **exactly two sentences**, ≤ 320 characters, plain English, no repo jargon |
| `rulesChecked` | string[] | ids of the lessons-ledger rules Tree checked against (T5); `[]` before T5 ships |
| `revision` | 1 or 2 | how many attempts it took |

### The rubric

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| **onStrategy** | no slot in the calendar, or a pillar we aren't running | fills a real slot but the angle is generic | executes a named slot with the campaign's specific angle and rotation state |
| **onVoice** | reads like a brand account or an AI | inoffensive but flat | sounds like a fluent Swiftie who is also a fan of this product |
| **specific** | could be about any artist in any year | one concrete detail | a dated/named/verifiable fact a fan could check, carrying the post |
| **mediaEarnsItsPlace** | decoration, or a stock-feeling tile | a real credited photo, loosely related | the image *is* the argument — remove it and the post stops working |
| **notEmbarrassed** | I would not want this attributed to me | fine, forgettable | I would be glad this went out under our name |

### Threshold to queue

An item is queueable when **all** hold:

- every dimension ≥ **3**;
- `total` ≥ **18** (of 25);
- `notEmbarrassed` ≥ **4**.

`notEmbarrassed` carries its own floor because it is the only dimension that catches what the other four miss — a post can be on-strategy, on-voice, specific and well-illustrated and still be something you would wince at. It is also the dimension a model is most tempted to inflate, which is exactly why it is stated as a hard gate rather than folded into the total.

**On failure:** one rewrite, then stop. `revision: 2` fails → the slot is **left empty**, the run's PR body names the slot and the failing dimension, and a `desk-coordination` issue is filed if two consecutive days fail. This is the existing "a calendar gap is NOT filled" rule (`docs/agents/growth.md` cadence, 2026-08-12, issue #2031), moved earlier in the pipeline: today the rule catches an empty calendar, and this catches a full calendar producing slop.

### `critique` is **not** in the content hash — and must not be

`contentHashPayload` (`scripts/social/lib/queue.mjs`) is an explicit allowlist: `platform`, `body`, `media`, `altText`, `scheduledAt`, `campaign`. `critique` stays outside it. Three reasons, in order of weight:

1. **An ✏️ edit would otherwise be unresolvable.** S3 lets a founder replace the caption by replying to the brief. If `critique` were hashed, that edit would void the stamp unless Tree re-scored the founder's own words — and re-scoring them is either a rubber stamp (meaningless) or a failure (Tree refusing to queue the founder's caption). The founder's edit *is* the judgment. There is no coherent behaviour in the hashed design.
2. **The hash means "what the founder approved."** The founder approves words, a picture and a time. Tree's reasoning about those things is provenance, not content — the same category as `why` and `mediaCredit`, which are already unhashed.
3. **It would destroy the calibration data.** The whole value of T2 is comparing Tree's *pre-hoc* score to the founder's *post-hoc* verdict. An edited item must keep the score Tree gave the draft it actually wrote. `critique` is therefore written once, at draft time, and **never updated** — not by an ✏️, not by anything.

### The Monday calibration

The weekly run joins every `social/feedback/<week>.jsonl` row to its item's `critique.scores` by `file`, and reports:

```
Self-scoring: mean 21.4 on the 9 you approved, 20.8 on the 2 you edited,
19.0 on the 1 you rejected. Spread 2.4 — thin. I am not yet
distinguishing what you'll reject from what you'll approve.
```

The judgement, stated in the brief in one plain sentence:

- **spread ≥ 3.0 points** between approved-mean and rejected-mean → calibrated; say so and move on;
- **spread < 3.0**, or a rejected item scoring **above** the approved mean → *not* calibrated. Tree names the specific item it got wrong, says which dimension it over-scored, and proposes a rubric wording change in the plan PR.
- **fewer than 3 rejections in the window** → "not enough rejections to calibrate against" — stated honestly, never a computed number over n=1.

Rejected items are joined from `social/feedback/` alone, since an ❌ deletes the queue file: the ledger's `originalBody` plus the PR's diff is the record. The build must therefore capture `critique.total` **into the ledger row** — added to S3's schema as an optional `critiqueTotal` integer, written when the item carries a critique. Without it the Monday join has nothing to read for rejected items.

---

## Mechanics

### `docs/agents/runner-prompts/tree-daily-draft.md`

A new mandatory step between drafting and writing the queue file:

1. Draft the caption.
2. **Score it against the rubric**, writing all five integers and the two-sentence rationale before looking at the threshold. (Stated in that order deliberately — scoring to hit a threshold is not scoring.)
3. If it fails, rewrite once and re-score. If it fails again, leave the slot empty and say so in the PR body.
4. Write `critique` into the queue item alongside `body`.

The prompt states the rubric table verbatim so the run never depends on reading another file to score.

### `scripts/social/lib/queue-schema.mjs`

`validateQueueItem` gains, for any item in `social/queue/`:

- `critique` required, `v === 1`;
- all five `scores` present, integers 1–5;
- `total` equals the sum (computed, compared — never trusted);
- `rationale` present, ≤ 320 chars, and **exactly two sentences** (counted as terminal `.`/`?`/`!` outside quotes — a deliberately crude check that catches a five-sentence essay, not an edge case);
- the threshold holds: min score ≥ 3, `total` ≥ 18, `notEmbarrassed` ≥ 4.

A draft below threshold is therefore rejected by `check-drafts.mjs` at CI time, not merely by the prompt's good intentions. This is the enforcement that makes the rubric real: an LLM's promise to self-score is not a gate, a failing check is.

### `scripts/social/check-drafts.mjs`

New `checkCritique` in the `checkDraft` orchestrator, reporting each failure with the dimension name and the score, e.g. `2026-09-18-...-x.json: critique.notEmbarrassed is 3, needs 4`.

### `scripts/social/approval-prompt.mjs`

`formatDraftLines` gains the rationale as the **first paragraph** of each draft message, immediately under the Tree identity line and above `Posts at:` — unlabeled, because it is the pitch, not a field:

```
Tree · slot: 2026-09-18 15:00 UTC · pillar: thread:hidden-clues
**Draft 1 · X — @longlivetscom**
This is the Decode thread's origin-story beat: it teaches the one mechanic
new followers don't get yet, using a dated, verifiable 2012 detail rather
than a vibe. The photo is a credited Red-era shot, so the image earns its
place instead of decorating.
Posts at: …
```

The existing `Why:` line is unchanged and stays where it is — it carries sourcing (what the claim rests on), which is a different question from the pitch (why the post exists). Two lines, two jobs.

**Also fix the `pillar:` in the identity line.** S5 currently derives it from a truncated `why`, which yields a sentence fragment where a pillar name belongs. It becomes `pillarOf(draft.campaign)` from `scripts/social/lib/feedback.mjs` (S3), falling back to `unspecified` when `campaign` is null.

Scores are **not** shown in the brief. A founder reading "4/5 on voice" is being invited to audit Tree's marking rather than judge the post, and the number would anchor them before they read the caption. The scores are for the Monday calibration, not the go/no-go.

### `scripts/social/weekly-scorecard.mjs`

New exported `calibration({ ledgerRows, items })` returning `{ approvedMean, editedMean, rejectedMean, spread, n, verdict }`, and a `renderCalibration(c)` producing the block quoted above. Deterministic and read-only, like everything else in that file.

---

## Acceptance criteria

1. `validateQueueItem` rejects: a missing `critique`; a score of 0 or 6; a non-integer score; a `total` that does not equal the sum; a `rationale` of one sentence or of three; a `rationale` over 320 characters.
2. `validateQueueItem` rejects an item with `notEmbarrassed: 3` even when `total` is 22 and every other dimension is 5 (the hard gate is independent of the total).
3. `validateQueueItem` accepts the exact boundary case: all fives except `notEmbarrassed: 4`, i.e. `total: 24`; and the minimum passing case `{3,3,4,4,4} = 18`.
4. `check-drafts.mjs` fails a below-threshold draft with a message naming the dimension and its score.
5. A brief message renders the rationale as its first paragraph and shows **no** numeric scores.
6. The identity line renders `pillar: thread:hidden-clues` for a `thread:hidden-clues:origin-story:2026-09` campaign, and `pillar: unspecified` for a null campaign.
7. An ✏️ edit (S3) leaves `critique` byte-identical and still produces a valid stamp — the regression test for the not-hashed decision.
8. `calibration()` returns `verdict: 'insufficient'` with fewer than 3 rejections, and never emits a mean over n<1.
9. `calibration()` flags `verdict: 'uncalibrated'` when a rejected item's total exceeds the approved mean.
10. The daily run leaves a slot empty and names it in the PR body when `revision: 2` fails — verified with a fixture draft engineered to fail `specific`.

---

## Files affected

| Path | Change |
|---|---|
| `docs/agents/runner-prompts/tree-daily-draft.md` | the score-then-threshold step, rubric table verbatim |
| `scripts/social/lib/queue-schema.mjs` | `critique` validation and threshold |
| `scripts/social/check-drafts.mjs` | `checkCritique` |
| `scripts/social/approval-prompt.mjs` | rationale as first paragraph; `pillar:` from `pillarOf(campaign)` |
| `scripts/social/weekly-scorecard.mjs` | `calibration`, `renderCalibration` |
| `scripts/social/lib/feedback.mjs` | `critiqueTotal` added to the ledger row (S3 schema) |
| `docs/agents/tree.md` | the rubric and the threshold as a stated invariant |
| `social/README.md` | `critique` field documentation |
| `tests/` | schema boundary cases, calibration cases, the ✏️-preserves-critique regression |

---

## Open questions

None blocking. Decided here — all reversible:

- **`critique` is not hashed**, for the three reasons above. This is the load-bearing call in the spec.
- **Threshold 18/25, floors of 3, `notEmbarrassed` ≥ 4.** Chosen to reject the bottom third of what a competent model produces without blocking good work. It is a number with no data behind it yet; T5's Monday calibration is what will move it, and moving it is a one-line change.
- **Scores hidden from the brief, rationale shown.** The founder judges the post; the scores exist to grade Tree.
- **Enforced in `validateQueueItem`, not only in the prompt.** A model's promise to self-score is not a gate.
- **One rewrite, then empty.** Matches the existing never-fill-a-gap rule rather than inventing a second policy.
- **`critique` is written once and never updated.** An ✏️ must not overwrite the score Tree gave its own draft, or the calibration measures nothing.
