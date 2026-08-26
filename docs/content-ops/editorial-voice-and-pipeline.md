# Editorial Voice & Authoring Pipeline

**Proposed standard (v1)** — comment or file a ticket to change.

Formalizes: `JW-Incorporated/swift2` issue #17, "Content ops: editorial
voice guide + author/editor/human authoring pipeline." Grounded in:
`docs/marketing/content-framework-2026-07-03.md` (Section 5),
`docs/marketing/feature-brief-2026-07-02.md`, `docs/decisions.md`
("Adopt dual-AI operating model," 2026-07-09 Deuxmoi entry), `CLAUDE.md`
rule 8.

This is a quality/trust bar for all ~350 Tier-0 items across 11 eras, not a
feature — it exists so voice and sourcing rigor don't drift across many
separate authoring sessions.

## Voice: fan-editor, third-person

Written like a sharp, plugged-in fan telling another fan the tea — **not** a
wire-service reporter, **not** a corporate copywriter, and explicitly
**not** first-person "as Taylor."

First-person copy attributed to Taylor is out of scope, permanently:
inventing quotes and putting them in a real person's mouth is a
fabrication/defamation risk — the same risk category
`docs/marketing/feature-brief-2026-07-02.md` steered v1 away from with the
source-credibility feature instead of an AI "verdict" on news claims.

Use naturally, not forced into every item: era nicknames, fan shorthand,
Easter-egg culture references.

### Naming rule (issue #461)

The voice standard above said "not a wire-service reporter" but never named
the single most common way copy accidentally became one anyway: repeated
bare-surname reference. Joey's audit found bare "Swift" outnumbering
"Taylor" in **every** era seed file — 1,170 bare-"Swift" hits vs. 931
"Taylor" hits across the era-moment corpus alone. Real fans (checked against
how r/TaylorSwift and Swiftie circles on X actually talk) default to her
first name or a real, in-use nickname; nobody who loves her music calls her
"Swift" over and over in casual conversation — that's a byline habit.

**Default to "Taylor" in running prose.** Bare "Swift" is fine only in:

- A direct quote — never alter someone else's real words to swap the name.
- A formal name that contains the surname (an award category, chart/RIAA
  name, or a title like "Taylor Swift: The Eras Tour") — the surname there
  is part of the proper noun, not a reference choice.
- **A legal case caption** ("Hall v. Swift", "Mueller v. Swift"). A case name
  is a fixed citation — it is what the proceeding *is called* on the docket
  and in every filing. "Hall v. Taylor" is not the same case; it is not a
  case at all. Same principle as a quote: this is someone else's fixed text,
  not our reference choice.
- The sentence's first reference alongside her full name ("Taylor Swift
  released...") — after that first mention, drop to "Taylor."

**Nicknames, used naturally, not forced:** "Taylor," first name only, is
the default and covers the overwhelming majority of running prose. Beyond
that, era-appropriate and fan-real shorthand is fine where it fits the
sentence's register: "Tay" (casual, sparing), "TS" (label/chart-adjacent
contexts), or an era/song self-reference she's used herself ("Miss
Americana," used ironically or in a callback to the doc/song of that name).
"Swiftie" refers to a *fan*, never to her — don't use it as a name for
Taylor herself.

This is now checked, not just documented: `scripts/content-engine/
checkers/voice.mjs` (`content.voice.surname-overuse`) flags any item where
bare "Swift" (quoted spans excluded) meets or exceeds "Taylor" in the same
field, feeding Karen's scan exactly like any other finding.

**And since 2026-08-12 it also BLOCKS THE MERGE.** `npm run check:voice`
(`scripts/check-voice.mjs`) runs in CI's `build` job on every PR, over the
seed files that PR changes. Relying on the scan alone did not hold: the scan
went weekly on 2026-07-25 while still being described as nightly, and 19
voice findings landed on `main` before anyone looked (#1917, #1918). Author
freely — if a line drifts into wire voice, CI tells you on the PR, with the
field name and the fix, before it is anyone else's problem. If the check
fires on something that is genuinely a quote, a legal caption, or a formal
credit, fix the *rule* (with a test) rather than bending the sentence.

### "Cut on sight" — AI-tell list

- "In this article..."
- "It is worth noting that..."
- "Taylor Swift, the American singer-songwriter..."
- Hedging qualifiers ("it seems," "reportedly appears to")
- Exclamation-stacked hype
- Corporate throat-clearing / wire-service framing

This list was documented but unchecked until issue #461: the literal
phrases above (minus "Exclamation-stacked hype," which isn't a fixed
string) are now matched by `content.voice.ai-tell` in the same checker.

### Before / after

> **Bad (wire/AI voice):** "Taylor Swift was photographed wearing a notable
> outfit while attending an awards ceremony in 2019."
>
> **Good (fan-editor voice):** "The butterfly jumpsuit at the 2019 VMAs —
> still the outfit people bring up first when you say 'Lover era.'"

> **Bad (AI-tell throat-clearing):** "In this article, we will explore why
> Cruel Summer is worth noting as a significant song in Taylor Swift's
> catalog."
>
> **Good (real seeded item, `supabase/seed/content/lover.mjs`):** "St.
> Vincent, on writing it: 'Gosh, it was really casual... just some people in
> a room jammin'.' Taylor's own pitch: 'a desperate summer love that might
> be doomed from the start.'"

## Sourcing bar

**Both rules below are enforced by `npm run validate:content` as of
2026-08-11** (`scripts/lib/sourcing-gate.mjs`). Until then neither had any
implementation for moments: the one-source rule was a `warn()` that 45 moments
were quietly failing, and the two-outlet rule had no code anywhere. Each gate
carries a grandfather list of the records that predate it; those lists can only
shrink, and adding to one to make a build pass fails the test that guards them.

- **Minimum: one source per item.** No exceptions. A `sourceUrl` or a
  `moment.sources` entry both satisfy it; `moment.sources` is preferred,
  because it is where provenance (`publisher`, `source_type`,
  `reliability_score`) lives and because it stays out of the Tier 0 payload.
- **`relationship` and `business` items need two independent outlet
  sources** — the two categories most exposed to rumor/gossip risk — before
  they're authored, not one.
- **"Independent" = two different outlets/bylines**, not two
  re-syndications of the same wire story. The checker counts distinct
  **outlet identities** (registrable domains — `scripts/lib/sourcing-gate.mjs`,
  issue #2036), so two articles from one outlet count once, however the
  URLs are styled.
- **A video-platform link (YouTube, Vimeo, Dailymotion, Twitch) is
  evidence, never an outlet.** It satisfies the one-source minimum and is
  welcome as a citation, but counts **zero** toward the two independent
  outlets — an official upload is the subject's own primary source, a fan
  re-upload is nobody's, and unknown provenance is treated like a fan
  upload. A video can show the event happened; it cannot corroborate a
  relationship or business claim (issue #2036).
- **A `wiki`, `fan_forum` or `social` citation never counts toward the two.**
  This is the §5 rubric line "fan_forum|wiki|social alone never satisfy
  sourcing for a factual claim", made mechanical. Those citations are welcome
  as supplements — they just cannot be what carries the claim.
- **Exception: fan theories and Easter eggs are not held to the two-source
  bar above.** This applies to any item tagged as a theory (`kind: 'theory'`
  or `'easter_egg'` in the theories pipeline, or an item explicitly
  presented as fan interpretation rather than reported fact) — a real,
  large part of this site. They follow their own, separate standard:
  **one sourced line** documenting that the theory exists and what it
  claims (`docs/content-ops/theory-weaving.md`,
  `docs/content-ops/song-annotation-standard.md`), plus the confidence/
  outcome tiering that already marks a theory as unconfirmed. Requiring two
  independent outlets to report on a fan theory as if it were a factual
  claim would be the wrong bar — a theory's sourcing question is "does a
  real source show this theory exists and what it says," not "is this
  confirmed by two outlets," since confirmation is exactly what a theory,
  by definition, doesn't have yet. The two-source rule stays exactly as
  strict as written above for actual `relationship`/`business` factual
  claims — this exception is scoped to theory-tagged content only.

### Source classes

| Class | Acceptable alone? |
|---|---|
| Named entertainment/news outlets (Billboard, Rolling Stone, E! News, etc.) | Yes |
| Official statements (label, venue, brand) | Yes |
| Verified journalist bylines | Yes |
| Anonymous gossip accounts (e.g. Deuxmoi) | Only as a labeled, low-confidence source (`docs/decisions.md`, 2026-07-09) — always cited as "Source: Deuxmoi," never blended with reputable-press citations, never at `confirmed`/`official` confidence |
| Unverified social posts | No, alone |
| A single paparazzi agency wire with no outlet reporting on it | No, alone |

## No fabrication, ever

Every fact traces to a real, findable source — not a brand name, not a
date, not a detail invented to fill a gap. If a detail can't be confirmed,
it's left out, not guessed. This is a hard rule, not a style preference.

## Length discipline

Enforced by DB CHECK constraints and restated as an authoring rule:

- `snippet` ≤400 chars — a hook, one sentence, present-tense, written like a
  caption under a photo, not a news headline.
- `moment.context` ≤2000 chars — link-first, not write-first. Omit by
  default for non-`music` categories; include only if a source reports a
  specific fact the snippet didn't already cover, and even then one short
  line, not a paragraph. Two exceptions get comprehensive coverage where
  sourced, up to the cap: `music` items (see `song-annotation-standard.md`),
  and any item marked `significance: 'defining'` regardless of category
  (added 2026-07-18 — see `depth-rubric.md` "Item-level significance"). Both
  exceptions still mean *more real sourced facts*, never speculation to fill
  space — the no-fabrication rule doesn't loosen for either one.
- Photos are always hotlinked with credit (credit = attribution, not legal
  clearance).

## Pipeline: Claude drafts → Codex reviews → human spot-checks

Mirrors the company's existing dual-AI operating model
(`docs/decisions.md`, "Adopt dual-AI operating model") applied to content
instead of code — Codex's job is to disagree, and cross-provider review
catches what self-review can't.

**Applies identically no matter who or what produced the first draft**
(added 2026-07-18): a ChatGPT-drafted article, a lead surfaced by the
News/Current worker (`apps/worker`, `docs/content-ops/intake.md`), or
anything else brought in from outside this pipeline is a *source lead*, not
a draft that gets to skip straight to step 2 or 3. It re-enters at step 1 —
re-drafted against this voice guide from its underlying facts/sources, not
lightly edited from its original wording. A draft sounding fluent or
already citing outlets is not evidence it's ready; re-verify the citations
independently regardless of how confident the original draft reads.

1. **Claude drafts** each item against this voice guide.
2. **Codex reviews** (cross-provider, not the same model checking its own
   work) specifically for:
   - AI-tells and voice drift — does it sound like a fan wrote it, does it
     hit anything on the cut-on-sight list?
   - Fabrication check — does every claim in the snippet/context actually
     trace to what the cited source(s) support?
   - Does `relationship`/`business` content carry its required second
     independent source?
3. **Human spot-check** — Joey or a fan-adjacent editor spot-checks at
   least the first authored batch (Midnights/Tortured Poets, per the
   authoring order in `depth-rubric.md`) before scaling to the remaining
   10 eras.

Authentic fan voice is genuinely hard for one model to sustain solo at
volume — a failed attempt reads worse than plain neutral copy, so Codex's
pass and the human batch check are both real gates, not rubber stamps.

## Open questions

- **Repeatable script/prompt workflow** (ticket #17 AC item 4): with ~350
  items expected, drafting + Codex-review should become a repeatable
  script/prompt workflow rather than manual per-item repetition, per
  `CLAUDE.md` rule 8 ("codify repetition"). The framework doc explicitly
  leaves this to the build phase — not decided here, and not decided by
  this doc either. Flagging so it isn't lost between "content standard" and
  "engineering task."
- Whether/when the human spot-check should widen beyond "first batch" to a
  recurring sampling cadence as authoring scales to all 11 eras isn't
  specified anywhere in the source tickets or framework docs — left open.
