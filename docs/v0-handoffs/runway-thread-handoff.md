# The Runway thread — handoff for Claude

This is the fashion/style thread: a picture-heavy, guided visual retrospective of how
Taylor's style evolved era by era (sundress country → cowboy boots → snake bodysuit →
butterfly → cardigan-and-braids → monochrome couture). It replaces the old "one
placeholder-photo card per era" version with a museum-exhibition layout built to hold
GOBS of real photos.

Built in the **"Feed design exploration"** v0 workspace (chat: "Taylor Swift Threads",
same workspace as Taylor's Version, The Decode, Love Story, and The Proposal). Files:

- `components/threads/runway-thread.tsx` — the experience component (drop-in, `'use client'`).
- `lib/runway-data.ts` — types + full placeholder content (`RUNWAY_THREAD`, 10 eras, ~61 looks).
- `app/page.tsx` / `app/layout.tsx` / `app/globals.css` — demo harness only. `globals.css`
  stubs `--era-*` tokens + `era-card`/`era-btn-ghost`/`era-chip` utilities purely so the
  exploration renders standalone in this scratch workspace — **delete that block** when
  porting into `apps/web`, which already defines these globally.

> NOTE: this exploration workspace is a fresh scaffold, NOT the swift2 repo. When porting
> into `apps/web`, wire the component to the REAL sourced era/moment content — do not ship
> the placeholder `/placeholder.svg?...` images or sample copy in `lib/runway-data.ts`. The
> data shape is built to drop straight in.

v0 also wrote its own handoff note directly into the chat's output (`docs/runway-thread-handoff.md`
in the raw export) — this document supersedes it but preserves all of its content, restructured
to match the other four threads' handoff format.

---

## What's already built (ship-ready layout, content is the remaining work)

**Structure.** One vertical "room" per era (10 rooms: Debut → Fearless → Speak Now → Red →
1989 → reputation → Lover → folklore → Midnights → TTPD), read top-to-bottom. Each room
re-themes the page via inline `--era-*` custom properties from that era's `theme` object, so
scrolling through the thread visually walks through the palette history (cowboy-boot warmth →
reputation's matte black → TTPD monochrome). Within a room: a hero (tagline + `transition` wall
text + `motifs` chips), a full-width **feature plate** (one look flagged `feature: true`), and
a **column-flow masonry gallery** (`columns-2 lg:columns-3 xl:columns-4`, `column-fill: balance`)
that packs any number of mixed-aspect photos with no gaps — this is what makes the layout scale
from an era with 5 looks to one with 7 without a fixed grid fighting it.

**Why NOT the right-edge career scrubber (as a dated 2006→today axis):** v0 was explicitly asked
to weigh in on this. Its call: keep the right-edge rail, but don't make it a literal dated
scrubber — a style journey has uneven, gallery-shaped stops, not evenly-spaced dates. It was
repurposed into **`EraNavigator`**: scroll-synced dots (via `IntersectionObserver`) that tint to
each era's accent color, expand the active room, and click-to-jump. This is a *different* pattern
from the Proposal thread's horizontal chapter rail — Runway's scale is 10 eras' worth of photos,
not a tight date range, so vertical spine + right-edge navigator was judged the better fit than a
horizontal rail. Keep this reasoning in mind if reconciling patterns across threads.

**Data model** (`lib/runway-data.ts`):
```
Look      = { id, eraId, name, description, image, feature? }
LookImage = { url, credit, kind: 'primary' | 'reference', aspect? }
Era       = { id, name, year, tagline, transition, motifs: string[], theme: EraTheme, looks: Look[] }
RunwayThread = { kicker, title, premise, eras: Era[] }
```
- `feature?: boolean` promotes one look per era to the full-width plate atop the room.
- `aspect?: '3/4' | '4/5' | '1/1' | '4/3' | '16/9'` is a masonry presentation hint only — safe to omit.
- `transition` is the point of the whole thread: the museum wall-text explaining *why* the look
  shifted from the previous era (stated inspirations, recurring motifs, the snake→butterfly arc,
  cowboy boots→couture, etc.) — not just a caption.
- `motifs: string[]` are recurring visual references shown as chips per era (e.g. "Cowboy boots",
  "Ringlet curls" for Debut) — this is the raw material for the motif-trail feature below.

Two "experience" features already implemented and wired:

1. **Shared lightbox** — every photo is a focusable button with a hover zoom cue (`ZoomIn` icon);
   click opens a full-size, scroll-locked, Escape/backdrop-dismissable dialog carrying name,
   description, credit, and the reference flag stays intact even enlarged. Global via
   `LightboxContext`, so any `LookMedia` anywhere can trigger it.
2. **`ColorStoryRibbon`** — a horizontal band in the hero, one segment per era in its accent color,
   that expands the active segment as you scroll and doubles as a jump control. Sells the
   era-to-era palette arc (cowboy-boot warmth → reputation black → TTPD monochrome) at a glance
   before the reader scrolls a single room.

**Image integrity:** `image.kind: 'reference'` is hard-flagged — desaturated, dashed accent ring,
an unmissable "Reference — not an actual photo" badge, and screen-reader alt text carrying the
same warning — so a stand-in (e.g. a designer's prior runway work used because we don't have the
real photo yet) can never read as the real shot. `'primary'` renders normally with a visible
credit line. There is no code path where a reference image renders like the real one — same rule
as every other thread. **Never flip a reference to `primary` without a real, correctly-attributed
photo.** The placeholder data currently ships **10 `reference`-kind looks** (one or two per era)
to exercise this path; verify each before the real content pass.

---

## Guiding principle / verdict (v0's own words, asked directly as a fan)

Joey asked v0 point-blank: *"Do you love this now, as a fan? Anything else you're longing for
before we ship it?"* Its answer, kept verbatim in spirit:

> Honest answer as a fan: it's genuinely good now — the vertical-rooms structure, the re-theming
> per era, and the reference-integrity treatment are all right. But no, I don't love it yet. Two
> things are missing that would make it sing, and one is a data job I can't fake: **real, iconic
> photos** (the #1 thing — this whole thread lives or dies on the pictures being the actual
> moments), **the weave** (motifs should recur and transform across eras, looks should link into
> their era's existing moment/song pages), and **her own words** (a verified stylist/Taylor
> pull-quote per era about a specific look).

The layout is done. **The remaining work is content and weaving, not chrome.** Do not thicken
card borders, add gradients, or restyle to fake depth — depth comes from real photos, real
receipts, and real links into the rest of the site (the same interconnection principle as every
other thread: Threads are a sideways lens over the same career data the Eras section renders
chronologically; never duplicate content, always link back to the canonical page).

---

## Next steps (v0's ranked list — DO THESE, ranked by fan impact)

### 1. Real, iconic photos ← highest priority, the whole thread lives or dies here
Every era should open on THE look everyone pictures (the feature plate), then fan out into the
masonry. **Port from what the site already has before sourcing anything new** — the real app has
GOBS of era imagery, moment records, and attribution already; map existing era/moment image
assets to `Look` entries, carry the real credit into `image.credit`, set `kind: 'primary'`. v0
suggested anchors per era (verify against the app's own library first, do not take these as fact):
Debut → cowboy boots + sundress; Fearless → gold fringe/sparkle; Speak Now → purple gowns;
Red → red lip + high-waist retro; 1989 → crop-top + skater skirt, polaroid palette;
reputation → snake bodysuit, matte black; Lover → pastel airbrush suit;
folklore → cardigan + braids, grayscale-to-forest; Midnights → jewel-tone glam, mirrorball;
TTPD → monochrome tailoring. Leave anything genuinely not in the library as `reference` — never
invent a photo.

### 2. The weave — this is the app's soul
- Add an optional `links` field to `Look` (mirror the pattern already used in the
  Proposal/Love Story threads): `{ label, href }[]` → the look's era page, the moment it appeared
  at (VMAs, tour stop, video), and any song whose lyric references the look.
- Add an optional `momentId`/`eraSlug` so a "From the Eras" strip can auto-pull every Eras moment
  whose date overlaps the era — reuse the same overlap helper the other threads use rather than
  hand-linking each one.
- Do not duplicate content into this thread; always link back to the canonical page.

### 3. Motif trail — high impact, ZERO new content required
The `motifs[]` arrays already exist per era in the shipped placeholder data. Build cross-era
highlighting: hovering/tapping a motif chip (e.g. "snake", "butterfly", "cowboy boots")
highlights every era that shares it and traces the transformation arc (snake reclaimed in
reputation → Lover butterfly; boots in Debut → couture in TTPD). This is derivable today from
existing arrays — no sourcing needed, just a `MOTIF_MEMBERSHIP`-style derivation. If any Clue Web
motif eggs apply to these looks, register them per the dev guard.

### 4. Her own words (pull-quotes)
Add optional `quote?: { text, source }` to `Era` (or to a hero look). One verified stylist/Taylor
quote per era about a SPECIFIC look, with primary-source attribution — same receipt discipline as
The Decode thread. Render under the wall text. Content work, not layout work.

### 5. Optional polish once 1–4 land
- Deep-link hash per era (`#era-<id>`) so the navigator and external links can jump straight in.
- Verify `prefers-reduced-motion` is respected on the ribbon/navigator transitions (should already
  be, confirm before shipping).
- Lightbox: add left/right arrow-key navigation across a room's looks (the state hook is already
  centralized in `RunwayThread` — extend it to an index within the active era rather than adding
  a second state store).

---

## Content-fill checklist (verify against primary sources before shipping)
- [ ] Replace ALL `/placeholder.svg?...` images and sample copy in `lib/runway-data.ts` with real
      sourced photos and copy.
- [ ] Verify every `image.credit` line and confirm `kind: 'primary'` is only set on photos that
      are genuinely the real moment, not a stand-in.
- [ ] Verify every `transition` (wall text) claim against a primary/verified source — same
      discipline as the Decode thread's receipts.
- [ ] Verify any new `quote` field's attribution before shipping (primary source only).
- [ ] Wire `links[].href` to real routes (song meaning pages, era pages, other Threads).
- [ ] MEDIA ID DISCIPLINE (from user memory — do not skip): never trust memory/search for any
      Spotify/YouTube ID used in a link — verify via oEmbed (`open.spotify.com/oembed`,
      `youtube.com/oembed`) with curl before hardcoding.
- [ ] Delete the `--era-*` token stub + `era-card`/`era-btn-ghost`/`era-chip` utility block from
      `app/globals.css` when porting — `apps/web` already defines these globally; keeping both
      risks silent divergence.

## Reconciling against the REAL `RUNWAY_LOOKS` already in the app (flag for integrator, not solved here)

`apps/web/lib/longlive/lenses.ts` currently has a `RUNWAY_LOOKS` array with **exactly one look per
era**, each shaped `{ id, eraId, name, description, image, shopTags }`, rendered by a `Runway()`
function in `apps/web/components/longlive/ThreadsMode.tsx`, using placeholder `/eras/*.png` images.
This v0 exploration's `Look`/`Era` shape is richer (multiple looks per era, `image.kind`,
`feature`, `aspect`, `motifs`, `transition`) and is built exactly to fix the "needs to be
genuinely picture-heavy, not one photo per era" gap called out in the product brief. Reconciling
the two shapes (and deciding whether `shopTags` survives into the new model) is a separate
integration task — not solved here — but whoever picks it up should know: the real data currently
has 1 photo/era against placeholder art, and this exploration's whole point is N real photos/era.
