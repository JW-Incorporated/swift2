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


## Retired

### L001 — Never re-use a photograph that has already shipped

- **Status:** retired
- **First seen:** 2026-09-21 (PR #4471)
- **Times fired:** 6
- **Last fired:** 2026-09-30 (PR #4574)
- **Evidence:** [#4471 ❌](https://github.com/JW-Incorporated/swift2/pull/4471), [#4513 ❌](https://github.com/JW-Incorporated/swift2/pull/4513), [#4544 ❌](https://github.com/JW-Incorporated/swift2/pull/4544), [#4556 ❌](https://github.com/JW-Incorporated/swift2/pull/4556), [#4565 ❌](https://github.com/JW-Incorporated/swift2/pull/4565), [#4574 ❌](https://github.com/JW-Incorporated/swift2/pull/4574)
- **Codify:** done (#4601)
- **Superseded by:** check-drafts.mjs:checkPhotoReuse

**You said:** "The reason for all the "no's" on all of these posts is teh same: Re-used picture. All re-used pictures will be rejected. We need new pictures."

**So I:** **Retired as codified 2026-10-05 — the rule did not go away, it became code.** `checkPhotoReuse` (`scripts/social/lib/photo-reuse.mjs`, called from `check-drafts.mjs`) now hard-fails any item whose `photoId` already shipped in `social/posted/` or is queued under a DIFFERENT campaign, and `prepare-draft-inputs.mjs`’s photo ledger hands each beat a never-used pick that also sees drafts waiting in open PRs — the blind spot that let this rule fire six times. Issue #4601 closed 2026-10-01; no founder rejection for a repeat photo has landed since (the five in week 40 all predate it). The operational half of the old rule now lives where a drafter actually reads it: `social/calendar.md` § How to read a slot (take the pick from `.scratch/tree-inputs.json`, defer the beat when none is left, never an off-era photo, name the pick in `why`) and `docs/marketing/social-strategy.md` §2 (one beat, one pair, one image — dropping X to text-only was never a legal escape from a photo problem). The ONE sanctioned repeat is unchanged: the IG and X halves of the SAME campaign carry the SAME photograph.
