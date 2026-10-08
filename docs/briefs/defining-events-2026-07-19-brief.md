# Brief: source EVERY real photo you can find for 9 career-defining moments

These 9 items were just marked `significance: 'defining'` (the rarest tier —
see `docs/content-ops/depth-rubric.md`) as part of a 10-event, career-wide
pass (`docs/decisions.md`, 2026-07-19 entry). Their narrative content
(`moment.context`, `moment.sources`) is already solid and sourced — **do not
rewrite it**. What's thin is photos: most have only 1, one has zero.

**Correction from the original version of this brief (Joey, 2026-07-19):
there is no photo ceiling for these 10 items.** They are, by definition, the
most important events in her entire career/life — they should carry
**every real, distinct, verifiable photo you can actually find** from
reputable sources (wire services, major outlets, official releases), not a
capped sample. Don't stop at 5–8 — if an event like the Eras Tour opening
night or the VMA interruption has 15+ real, differently-sourced photos
available, include all of them. The only ceiling is "is this photo real,
distinct from every other one already listed, and verifiable" — not a
target count. Quality/authenticity still governs (rules below unchanged),
just not quantity.

## OUTPUT — write to a NEW draft file only

Create `supabase/seed/content/_defining-events.draft.mjs`:

```js
export default [
  {
    file: 'fearless.mjs',        // which real seed file this patches
    matchTitle: 'Wins Best Female Video, then Kanye West takes the mic',
    matchDate: '2009-09-13',     // year-month-day, for disambiguation
    addPhotos: [
      {
        url: 'https://...',       // real, hotlinked, verified-loading image
        credit: 'Photographer/Agency, via Outlet',
        caption: 'What is actually happening in THIS frame.',
        kind: 'primary',          // 'primary' | 'archival' | 'reference' — see ImageRef doc
        // focalPoint: '50% 30%', // only if you can see the image and know where the subject sits
      },
      // as many more objects as you can find real, distinct photos —
      // no cap, see the correction above
    ],
  },
  // one entry per item below
];
```

Do **not** edit any real seed `.mjs` file. Do not touch `moment.context`,
`moment.sources`, `title`, `snippet`, or existing `photos` entries — this is
additive only; I merge your `addPhotos` onto the existing array myself.

## The 9 items (current photo count in parens — find ALL you can beyond it)

1. **`debut.mjs`** — "Taylor Swift, the album, arrives" (2006-10-24,
   slug `taylor-swift-album-release`) — **2 photos now**. Look for: every
   period press photo you can find of her at 16-17 promoting the debut
   (Grand Ole Opry, early radio-tour stops, the "Tim McGraw" single era,
   other angles of the album's own promo photography).
2. **`fearless.mjs`** — "Wins Best Female Video, then Kanye West takes the
   mic" (2009-09-13) — **1 photo now**. Look for: every real angle of the
   moment itself (Kanye at the mic, her reaction shot, her walking offstage),
   the Beyoncé invite-back-onstage moment later that night, wire photos of
   the VMA press aftermath, backstage/red-carpet shots from earlier that
   night.
3. **`fearless.mjs`** — "Fearless makes her the youngest Album of the Year
   winner" (2010-01-31) — **1 photo now** (just the album cover). Look for:
   every real Grammy-night photo — on stage accepting (all four wins that
   night if distinct photos exist), red carpet arrival, backstage with the
   trophies, press-room shots.
4. **`1989.mjs`** — "1989 wins Album of the Year" (2016-02-15) — **1 photo
   now**. Look for: every real Grammy-night photo — on the Grammy stage
   accepting (not just a generic Recording Academy still), red carpet that
   night, the trophy, press-room shots.
5. **`1989.mjs`** — "Snakes, Snapchat, and 'excluded from this narrative'"
   (2016-07-17) — **0 photos, thumbnailUrl is null**. This is the one that
   most needs work. Look for: real press-era imagery from the saga — the
   Kim Kardashian Snapchat story stills (if a reputable outlet republished
   them with rights), paparazzi photos from her subsequent public silence,
   contemporary news-coverage screenshots/photos credited to the outlet that
   ran them. Also set a `thumbnailUrl` suggestion (the URL of whichever
   photo you'd make primary) as a top-level field on this patch entry.
6. **`lover.mjs`** — Big Machine sale (2019-06-30, slug
   `big-machine-sale-worst-case-scenario`) — **1 photo now** (a generic
   reference photo of Scooter Braun, explicitly labeled as not from the
   actual deal). Look for: Taylor's actual Tumblr post screenshot (if
   rehostable with credit), press photos from the #IStandWithTaylor news
   cycle, Scott Borchetta photos from that period, AMA 2019 standoff
   coverage — every real one you can find.
7. **`folklore.mjs`** — "Sixteen hours' notice: the announcement that
   invented the surprise era" (2020-07-23, slug
   `folklore-sixteen-hour-announcement`) — **1 photo now** (the album cover).
   Look for: the Beth Garrabrant forest-photo grid from the announcement
   post, stills from the self-directed "cardigan" video that dropped
   alongside it, any real photography from the isolated recording period —
   every real one you can find.
8. **`midnights.mjs`** — "The Eras Tour kicks off in Glendale" (2023-03-17)
   — **1 photo now**. Look for: every real shot from opening night —
   different costume/set moments (the folklore cabin, the reputation snake
   motif, the surprise-song acoustic set), wide crowd shots of the sold-out
   stadium, arrival/soundcheck photos.
9. **`midnights.mjs`** — "The game the world decided made it official"
   (2023-09-24) — **1 photo now**. Look for: every real photo from that
   specific Sept. 24, 2023 Arrowhead game and its aftermath — her in the
   suite, arrival/departure shots, the getaway-car moment if photographed,
   any press photos from that exact date. (Don't pull from other dated
   items elsewhere in this era file — this item needs its own real photos
   from its own date.)

## Hard rules

1. **Every photo URL must be real and verifiable** — something you can
   confirm loads as an actual image (not a 404, not a paywall placeholder).
   I re-verify every URL myself before anything ships; don't include a URL
   you're not confident is live.
2. **No AI-generated or stock/generic imagery.** A real, credited press or
   wire photo of the actual event, or (when nothing from the exact moment
   exists) a clearly-labeled `kind: 'reference'`/`'archival'` stand-in — see
   how `wedding-gown-dior-anderson` and the Scooter Braun item already do
   this. Never present a stand-in as if it were the real moment.
3. **Real credit line required on every photo** — photographer/agency and
   outlet, the same format already used throughout these files (e.g.
   `'Kevin Mazur/Getty Images for TAS Rights Management'`).
4. **No fabrication anywhere, and no padding.** Ship every real photo you
   can verify — there's no target count to hit — but a `'defining'` item
   with 3 genuinely real photos still beats one with 12 where any are
   invented, misattributed, near-duplicate crops of the same frame, or only
   loosely related to the actual event. Exhaustive means "all the real
   ones," not "pad to look thorough."
5. Never duplicate a URL already listed above as "current" for that item,
   and never list the same photo twice under different URLs (check before
   adding — reverse-search/compare if two candidates look similar).

## Voice / scope

You are not writing new prose for these items — their `moment.context` is
already final. This task is scoped to photo-sourcing only. If you notice a
genuinely important, well-sourced fact missing from an item's `context`
while researching, note it in a comment in the draft file rather than
editing the narrative yourself.
