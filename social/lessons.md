<!--
social/lessons.md — the founder-feedback ledger (Tree Overhaul T5,
docs/specs/tree-overhaul/t5-lessons-ledger.md — read that spec for the full
mechanics: attribution, retirement, codification, the strategy-proposal
diff). Distilled every Monday by Tree's weekly run
(docs/agents/runner-prompts/tree-weekly-plan.md) from your ✏️/❌ reasons and
thread replies — you do not write it, but hand-editing it directly is fine
(a founder correcting a rule directly is a feature); keep the shape below
exactly if you do, since scripts/social/lib/lessons.mjs parses it.

One `###` block per rule, newest first, active rules above a trailing
`## Retired` section (omitted entirely while nothing is retired). Shape:

### L<NNN> — <imperative title, ≤80 chars, what Tree does, not what went wrong>

- **Status:** active | retired
- **First seen:** YYYY-MM-DD (PR #n)
- **Times fired:** <integer ≥ 1 — distinct founder ✏️/❌ events, not
  drafter consultations>
- **Last fired:** YYYY-MM-DD (PR #n)
- **Evidence:** [#n ✏️](url), [#n ❌](url), … — one link per firing
- **Codify:** #n | — | done (#n)
- **Superseded by:** check-drafts.mjs:<checkName> | L### | — (retired only)

**You said:** "<the founder's own words, verbatim — never paraphrased>"

**So I:** <the operative rule, one or two sentences a drafter can act on>

Tree reads every `active` rule before drafting (`tree-daily-draft.md`). Turning a
rule into a hard gate is Tree's explicit choice (S2, 2026-10-01): a rule fired 3
times with `Codify: —` gets a `codify:` issue filed only while
`social/strategy-params.json` has `lessons.autoCodify: true` (it ships `false`);
a rule quiet for 8 consecutive weeks across ≥10 briefs is retired, not deleted.
-->


### L001 — Never re-use a photograph that has already shipped

- **Status:** active
- **First seen:** 2026-09-21 (PR #4471)
- **Times fired:** 6
- **Last fired:** 2026-09-30 (PR #4574)
- **Evidence:** [#4471 ❌](https://github.com/JW-Incorporated/swift2/pull/4471), [#4513 ❌](https://github.com/JW-Incorporated/swift2/pull/4513), [#4544 ❌](https://github.com/JW-Incorporated/swift2/pull/4544), [#4556 ❌](https://github.com/JW-Incorporated/swift2/pull/4556), [#4565 ❌](https://github.com/JW-Incorporated/swift2/pull/4565), [#4574 ❌](https://github.com/JW-Incorporated/swift2/pull/4574)
- **Codify:** #4601

**You said:** "The reason for all the "no's" on all of these posts is teh same: Re-used picture. All re-used pictures will be rejected. We need new pictures."

**So I:** Never ship a `photoId` that already appears in `social/posted/`, `social/queue/` or an open draft PR — except the one sanctioned repeat: the IG and X halves of the SAME campaign carry the SAME photo (one pair, one image, because the owner approves the pair as one post — docs/decisions.md 2026-09-30), so the earlier "never put the same `photoId` on both halves" clause is withdrawn. You do not hunt for a photo: the daily pre-compute (`.scratch/tree-inputs.json`) hands each beat a never-used, Instagram-sized pick (a photo outside Instagram's 0.8–1.91 aspect window can never ship, so it is never offered), and `check-drafts.mjs` now fails a repeat across campaigns. When no pick is left for a beat (or its era), defer the beat and say so in the PR body — never repeat a tile, never drop X to text-only to dodge this rule, never take an off-era photo. Name the photo choice in the item's `why`.
