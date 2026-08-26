# Song Annotation Standard

**Proposed standard (v1)** — comment or file a ticket to change.

Formalizes: `JW-Incorporated/swift2` issue #33, "Content: comprehensive
source-gated song annotation standard." Grounded in:
`docs/marketing/feature-brief-2026-07-04.md` (candidate 1 + Addendum),
`docs/marketing/content-framework-2026-07-03.md` (Section 5, 2026-07-04
revision), `docs/decisions.md` (2026-07-04 "Song track guide is a separate,
non-month-scoped shape").

## Scope: which songs this applies to

This standard covers songs that **already have a `month_item`** — the 1–2
"standout tracks" per album that get their own dated timeline entry, per
the depth rubric's wavetop item ceiling. For those songs, research and add
sourced meaning/background/Easter-egg context to `moment.context` wherever
a real source exists.

**Out of scope here: full album-catalog coverage.** Every track on an
album (not just the 1–2 standouts) is a separate, already-decided content
shape — the `track_note`/track-guide table (`supabase/seed/tracks/*.mjs`,
`docs/decisions.md` 2026-07-04) — because full-catalog coverage doesn't fit
inside the wavetop-month item ceiling or the Tier-0 payload budget (see
`depth-rubric.md`). Don't author full-catalog song content against
`month_item` rows; it will blow the wavetop-month depth ceiling. This
document governs the `moment.context` of songs that are already `month_item`
rows, not the separate track-guide pipeline.

## The core rule

Cover a song's meaning, background, or Easter eggs **wherever a real,
findable source exists** — Taylor's own commentary, credible music
journalism, well-corroborated fan-research culture. Taylor's catalog is
unusually well-documented; the constraint is research effort, not scarcity
of real content. This is the actual differentiator against Taylor's own
official archive site, which explains nothing.

**Never fabricate.** The no-fabrication rule is absolute here, not a
caveat: skip a song's context entirely when no real source discusses it.
Never guess a meaning to fill a gap.

**Never pad to a target.** There is no per-song or per-album completion
quota. A song with no real source gets no context — that's a correct
outcome, not a gap to fix later with an invented one.

## Length discipline: sourced fact, not an essay

The "hooks by default" rule still governs *length* — it no longer governs
*how many* songs get covered (2026-07-04 revision). Per song, per fact:
one sourced line or a short paragraph tied directly to what the source
says, not a Wikipedia-style rewrite of the song's whole history. `moment.context`
stays inside the 2000-char DB CHECK ceiling regardless.

### Before / after

> **Bad (padded/essay, not sourced-fact discipline):** "'Soon You'll Get
> Better' is widely regarded as one of Taylor Swift's most emotional songs.
> Fans have long speculated about its meaning, and many believe it reflects
> deeply personal themes that resonate with listeners across generations,
> showcasing her evolution as a songwriter and her willingness to explore
> vulnerable subject matter in her work."

> **Good (real seeded item, `supabase/seed/content/lover.mjs`):** "Her own
> words: 'My dad got cancer when I was 13 and he got better... but things
> with my mom have been very different.' The family actually discussed
> whether the song was too personal to release at all before agreeing it
> belonged on the album." — followed by one sourced paragraph on the Dixie
> Chicks collaboration and the single live performance, each claim tied to
> a cited outlet (Wikipedia, Rolling Stone).

The "bad" version above isn't wrong on facts so much as it has none — it's
generic filler that could describe any emotional song by any artist. The
"good" version is dense with specific, sourced, checkable claims.

## Pipeline

Same author/editor/human pipeline as all other content
(`editorial-voice-and-pipeline.md`): Claude drafts against a real source →
Codex fact-checks (does every claim trace to what the cited source actually
says?) → Joey (or a fan-adjacent editor) spot-checks the first batch before
scaling.

## Open questions

- Which songs get promoted to their own `month_item` in the first place
  (the "1–2 standout tracks" selection) is governed by the depth rubric's
  wavetop item ceiling, not this document — flagging the boundary so it
  isn't re-litigated here.
- No stated policy on what happens if a song later gains a real source it
  didn't have at authoring time (e.g. a new interview surfaces after
  launch) — presumably it gets added on a normal content-update basis like
  any other item, but nothing in the ticket or framework docs says so
  explicitly.
