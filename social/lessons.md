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

Tree reads every `active` rule before drafting (`tree-daily-draft.md`); a
rule fired 3 times with `Codify: —` gets a `codify:` issue filed against it
automatically; a rule quiet for 8 consecutive weeks across ≥10 briefs is
retired, not deleted.
-->


### L001 — Never repeat a photograph across a sibling pair or inside 7 days

- **Status:** active
- **First seen:** 2026-09-21 (PR #4471)
- **Times fired:** 1
- **Last fired:** 2026-09-21 (PR #4471)
- **Evidence:** [#4471 ❌](https://github.com/JW-Incorporated/swift2/pull/4471)
- **Codify:** —

**You said:** "Not approved. we've used this image before"

**So I:** Run `npm run social:select-photo` per ITEM, not per beat, and never put the same `photoId` on both halves of an IG/X pair. Before writing either half, check the last 7 days of `social/posted/` and `social/queue/` for that `photoId`; if any less-recently-used entry in `social/photo-library.json` is free, take it instead. When every entry has shipped inside 7 days, drop the X sibling to text-only (strategy §2 rung 3) rather than repeating a tile, and say which repeat you avoided in the item's `why`.
