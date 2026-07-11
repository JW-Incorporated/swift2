# Theory Weaving

**Proposed standard (v1)** — comment or file a ticket to change.

Formalizes: `JW-Incorporated/swift2` issue #35, "Content: weave sourced fan
theories into existing song entries." Grounded in:
`docs/marketing/feature-brief-2026-07-04.md` (candidate 3),
`docs/marketing/content-framework-2026-07-03.md` (Section 5, "Known
theories" addendum, added 2026-07-04).

## The core rule

Where a song has **well-documented fan theories** — the kind covered by
mainstream fan media, not fringe speculation — add **one sourced line** to
that song's existing content. No standalone "theories" section, no new
category, no schema change. The theory note lives inside the song's
existing `moment.context`, the same item, the same sourcing bar as
everything else.

**Why weave, not a standalone glossary:** a dedicated theories section
would put the product in the business of deciding which fan theories are
"legitimate" — real editorial risk even without user accounts. Weaving a
sourced line into content that already exists sidesteps that: it's
reporting that a documented theory exists and what its evidence is, not
ranking or endorsing it.

## Hard scope guardrail

Part of the feature definition itself, not a caveat to apply carefully:

**No theories about relationships, private life, sexuality, family, or
identity — ever.** Content, lyrical, and Easter-egg theories only (e.g.
numerology, liner-note codes, color motifs, character-naming, callback
lyrics across albums).

This line is absolute and not authoring-judgment-dependent: if a theory
touches who Taylor is dating, has dated, or any aspect of her private life
or identity, it does not get written — regardless of how well-documented or
"obviously fine" it seems.

## Sourcing bar

Same bar as `editorial-voice-and-pipeline.md`, with one clarification:
"well-documented" means covered by mainstream fan media (recurring
Easter-egg roundups from outlets like Marie Claire, Nylon, Today.com) — not
a single forum post or a fringe theory with no outlet pickup. One sourced
line per theory; length discipline (sourced fact, not an essay) applies the
same as song annotation.

## Before / after

> **Bad (fringe, unsourced, or scope-violating):** "Some fans think this
> lyric is secretly about who she was dating at the time."
>
> — Out of scope regardless of sourcing: this is a relationship/private-life
> theory, permanently excluded by the guardrail above.

> **Good (content/Easter-egg, sourced, one line):** "Fans have read the
> repeated 13s and matching color motifs across the album rollout as a
> deliberate numerology trail — a pattern she's confirmed doing on past
> albums, not something the annotation is asserting as confirmed here."

## Pipeline

Same author/editor/human pipeline as all other content: Claude drafts →
Codex reviews (voice, fabrication, and specifically checks the
relationship/private-life exclusion is actually respected, not just
asserted) → human spot-check on the first batch before scaling.

## Open questions

- **The repo already contains a separate, standalone theories shape that
  appears to diverge from this ticket's "no new category, no schema change"
  instruction.** `supabase/seed/theories/<era>.mjs` seeds a dedicated
  `Theory` table (`kind: theory | easter_egg`, required `confidence` +
  `outcome` badges, its own `npm run db:seed:theories`), documented in
  `docs/content/content-audit-2026-07-08.md` — not the "one sourced line
  inside the song's existing `moment.context`" shape this ticket and the
  2026-07-04 feature brief describe. The private-life/relationship
  exclusion is carried over correctly into that shape's template, but the
  "no new category, no schema change" premise this document is built on
  does not match what's actually seeded. This proposal does not resolve
  that conflict — it needs a decision (which shape is authoritative, or
  whether both are intentionally kept) logged in `docs/decisions.md` before
  more theory content is authored under either one.
- No stated re-review cadence for a theory whose "documented" status
  changes later (e.g. a widely-covered theory gets debunked or officially
  confirmed after it's written) — not addressed in the ticket or the
  framework docs.
