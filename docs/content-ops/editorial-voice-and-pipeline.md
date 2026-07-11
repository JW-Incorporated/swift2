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

### "Cut on sight" — AI-tell list

- "In this article..."
- "It is worth noting that..."
- "Taylor Swift, the American singer-songwriter..."
- Hedging qualifiers ("it seems," "reportedly appears to")
- Exclamation-stacked hype
- Corporate throat-clearing / wire-service framing

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

- **Minimum: one `sourceUrl` per item.** No exceptions.
- **`relationship` and `business` items need two independent outlet
  sources** — the two categories most exposed to rumor/gossip risk — before
  they're authored, not one.
- **"Independent" = two different outlets/bylines**, not two
  re-syndications of the same wire story.

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
  line, not a paragraph. `music` items are the exception (comprehensive
  coverage where sourced — see `song-annotation-standard.md`).
- Photos are always hotlinked with credit (credit = attribution, not legal
  clearance).

## Pipeline: Claude drafts → Codex reviews → human spot-checks

Mirrors the company's existing dual-AI operating model
(`docs/decisions.md`, "Adopt dual-AI operating model") applied to content
instead of code — Codex's job is to disagree, and cross-provider review
catches what self-review can't.

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
