# Content audit + organization spec — 2026-07-08

Owner: CONTENT track (Joey). Status: **Phase 1 deliverable — spec awaiting
Joey/Wyatt approval before any Phase 4 content fill.**

Companion tooling: `scripts/content-coverage.mjs` (`npm run content:coverage`),
the Phase 3 deliverable — a deterministic coverage report + rights hard-gate,
wired into CI after `validate:content`. All counts below are reproducible by
running it; nothing here was tallied by hand.

Scope note: this document audits and *specifies*. It adds **zero** content
rows, touches no UX/components/routing, and every proposed shape is **additive**
to the existing format — no existing file needs rewriting to adopt it.

---

## 1. Current inventory

`npm run content:coverage` on today's seed corpus (`supabase/seed/`):

**396 month items** across **11 of 12 eras**, all 396 with a Tier-1 `moment`,
**0 records without a source**, 170 with 2+ distinct sources.

### By era

| era | items | music | release | fashion | tour | business | sighting | relationship |
|---|---|---|---|---|---|---|---|---|
| debut | 28 | 6 | 0 | 9 | 0 | 3 | 9 | 1 |
| fearless | 34 | 7 | 0 | 13 | 2 | 4 | 6 | 2 |
| speak-now | 39 | 7 | 0 | 17 | 1 | 6 | 6 | 2 |
| red | 34 | 7 | 0 | 13 | 1 | 4 | 7 | 2 |
| 1989 | 37 | 7 | 0 | 9 | 2 | 6 | 8 | 5 |
| reputation | 32 | 5 | 3 | 10 | 2 | 4 | 7 | 1 |
| lover | 31 | 6 | 0 | 12 | 0 | 6 | 7 | 0 |
| folklore | 20 | 8 | 1 | 6 | 0 | 5 | 0 | 0 |
| evermore | 32 | 8 | 0 | 12 | 0 | 6 | 6 | 0 |
| midnights | 66 | 8 | 2 | 24 | 3 | 10 | 13 | 6 |
| tortured-poets | 43 | 9 | 2 | 12 | 4 | 5 | 9 | 2 |
| **the-life-of-a-showgirl** | **0** | — | — | — | — | — | — | — |
| **total** | **396** | 78 | 8 | 137 | 15 | 59 | 78 | 21 |

### By domain (Joey's framing)

| Domain | Where it lives today | Count |
|---|---|---|
| Eras | `eras-data.mjs` skeleton | 11 (of 12) |
| Albums / releases | `album_release` milestones + `release`-category items | 15 milestones + 8 items |
| Songs (track guide) | `supabase/seed/tracks/*.mjs` → `track_note` | **0** (template only) |
| Music videos / visual media | *(not modeled — closest: `music`/`fashion` items that mention videos)* | 0 first-class records |
| Fashion / appearances | `fashion` category | 137 |
| Tours / shows | `tour` milestones + `tour`-category items | 6 milestones + 15 items |
| Easter eggs / theories | *(not modeled — explicitly banned from track notes by the 2026-07-04 brief)* | 0 |
| Business / career timeline | `business` category | 59 |
| Sightings | `sighting` category | 78 |
| Relationships | `relationship` category | 21 |

Media: 676 media references (322 item thumbnails + 354 detail photos), **all
hotlinks** with a free-text `credit` on photos (7 photos missing credit); none
carries a machine-readable rights status — see §5.

## 2. Current file structure + data model

```
supabase/seed/
  eras-data.mjs          # 11 eras (slug, title, album, window, theme) + 21 wavetop milestones
  content/<era>.mjs      # month items per era; `_example.mjs` is the template, never seeded
  tracks/_example.mjs    # track-guide template; NO real track files yet
  candidates/00-orbit.mjs# staging, never seeded (known anti-pattern, see decisions 2026-07-04)
scripts/
  seed-eras|content|tracks.mjs   # idempotent DB loaders (era-wholesale replace)
  validate-content.mjs           # row-level checks mirroring DB CHECKs (CI)
  check-budget-from-seed.mjs     # Tier 0 payload budget gate (CI)
  content-coverage.mjs           # THIS audit's Phase 3 companion (CI)
```

Model (authoritative types in `packages/shared/src/vault-types.ts`, template in
`supabase/seed/content/_example.mjs`):

- **`Era`** — slug, title, album, ISO window, order, `EraTheme` (full visual
  identity), optional cover image URL.
- **`Milestone`** — wavetop timeline marker; `type` is only
  `album_release | tour`.
- **`MonthItem`** (Tier 0, always resident, ≤2MB-gz budget) — era + year/month +
  `category` + title + `snippet` (≤400 chars, DB CHECK) + `sourceUrl` +
  `thumbnailUrl`. Category CHECK: `sighting | fashion | relationship | tour |
  business | music | release`.
- **`Moment`** (Tier 1, on demand) — `context` (≤2000, DB CHECK) +
  `sources[{outlet,url}]` + `photos[{url,credit}]`.
- **`TrackNote`** (Tier 1, per-album, off the timeline payload) — era +
  trackTitle/number + sourced `note` (≤400) + sources.

There is **no per-item id or slug in the seed files** — identity is the natural
key (era, year, month, title) and the seeder replaces an era wholesale, minting
fresh UUIDs each run. Fine for today's tiers; anything that must be *referenced*
(deep links, cross-references, theories pointing at songs) needs a stable slug —
see §4.

Editorial voice (live site, keep it): concise, fan-aware, hook-first —
"Should've Said No, written in 20 minutes", "The snake video that announced
reputation". A line, not an encyclopedia entry. All format proposals below
inherit the same snippet discipline.

## 3. Gaps

1. **Missing 12th era — confirmed: The Life of a Showgirl.** Album released
   **2025-10-03** (announced 2025-08-12); today's skeleton ends at
   `tortured-poets` with `end_date: 2025-12-31`. Adding the era is a two-line
   data change plus a theme: trim TTPD's `end_date` to `2025-10-02`, append
   `the-life-of-a-showgirl` (start `2025-10-03`, end = rolling "now",
   `sort_order: 11`), add its `album_release` milestone, and author
   `content/the-life-of-a-showgirl.mjs` to at least the wavetop floor. Goes in
   rollout PR 2 as a **full era** (not a stub).
2. **Thin eras** (report-only thresholds: <30 items or 3+ empty categories):
   **folklore (20)** — weakest era, no tour/sighting/relationship; **debut
   (28)**; **lover** and **evermore** — no release/tour/relationship coverage.
   Midnights (66) and TTPD (43) reflect the J3.5 launch gate and are the depth
   benchmark.
3. **Track guide: unstarted.** `supabase/seed/tracks/` contains only
   `_example.mjs`. The `track_note` table, seeder, API and reader UI all
   shipped (W7) — the pipeline is waiting on content. 0 of 12 album guides
   exist. Status per era: **missing** (not partial) across the board.
4. **Videos and easter-eggs/theories are not modeled at all.** No category or
   shape exists for either; a handful of `music`/`fashion` items mention videos
   in passing but nothing is queryable as "the music videos".
5. **Provenance exists in-data but is thin.** Every record has ≥1 source URL
   (`sourceUrl` + `moment.sources[{outlet,url}]`), which is real provenance even
   though the UI renders it only as links. Missing: publisher *type*,
   reliability, access date, and any notion of confidence for contested claims.
   226/396 records are single-source.
6. **Media is modeled but pre-dates the 2026-07-08 policy.** All 676 media
   references are hotlinks (the old "never rehost, hotlink only" rule — see the
   `_example.mjs` comments and `vault-types.ts` doc comments, both now
   superseded). None carries a rights status (`0/676`), 7 photos lack even a
   credit string, and nothing distinguishes "official oEmbed embed" from
   "licensed owned asset" from "legacy hotlink". §5 fixes this additively.
7. **Borderline excerpt lengths.** 4 `moment.context` fields carry verbatim
   interview quotes of 300–422 chars. Not article dumps (they're sourced
   pull-quotes), but above the 300-char excerpt cap proposed in §5; flagged by
   the coverage report for trim during the relevant era PR.

## 4. Proposed content organization (additive only)

Principles: keep `MonthItem`/`Moment`/`TrackNote` exactly as they are (all 396
existing records stay valid untouched); reuse the era-file-per-domain seed
pattern Joey already works in; anything non-month-scoped stays off Tier 0 like
`track_note` does. Each domain below maps to one rollout PR (§6).

| Joey domain | Mechanism | New? |
|---|---|---|
| Eras | `eras-data.mjs` | no — add the 12th row |
| Albums/releases | **`Release` shape**, `supabase/seed/releases.mjs` | new, small |
| Songs | existing `TrackNote` + optional new fields | additive fields |
| Videos | **`video` category** + `media`/`links` on items | new category value |
| Tours | **`Tour` shape**, `supabase/seed/tours.mjs` | new, small |
| Fashion/appearances | existing `fashion` category + optional structured fields | additive fields |
| Easter eggs/theories | **`Theory` shape**, `supabase/seed/theories/<era>.mjs` | new |
| Business timeline | existing `business` category | no change |

### 4a. Additive fields on existing shapes (all optional, nothing breaks)

```js
// MonthItem / seed item — new OPTIONAL fields
{
  // ...existing fields unchanged...
  slug: 'midnights-spotify-record',   // stable kebab id, unique per era; enables deep links + cross-refs
  sources: [ /* full provenance objects, §5 — supersedes bare {outlet,url} */ ],
  media:   [ /* rights-aware media objects, §5 — supersedes bare thumbnailUrl/photos */ ],
  tags: ['grammys', 'red-carpet'],    // free-form retrieval hooks
}

// TrackNote — new OPTIONAL fields
{
  // ...existing fields unchanged...
  slug: 'anti-hero',
  writers: ['Taylor Swift', 'Jack Antonoff'],  // public-record credits
  isFromTheVault: false,                        // TV vault tracks
  singleReleaseDate: '2022-10-21',              // null if not a single
}
```

New `category` value: **`video`** (music videos, lyric videos, short films —
e.g. "All Too Well: The Short Film" becomes a first-class `video` item in
red/midnights). One new CHECK value in a migration; zero effect on existing
rows.

### 4b. New non-month-scoped shapes (same discipline as `TrackNote`)

```js
// supabase/seed/releases.mjs — one row per album/EP/notable single release
{
  slug: 'midnights-3am-edition',
  eraSlug: 'midnights',
  kind: 'album' | 'rerecording' | 'ep' | 'deluxe' | 'single' | 'live',
  title: 'Midnights (3am Edition)',
  releaseDate: '2022-10-22',
  label: 'Republic',
  trackCount: 20,
  note: '<=400 chars, hook-voiced, sourced',   // same cap discipline
  sources: [ /* §5 */ ],
}

// supabase/seed/tours.mjs — one row per tour; per-show depth only for Eras Tour
{
  slug: 'the-eras-tour',
  eraSlug: 'midnights',                // era active at opening
  title: 'The Eras Tour',
  openedOn: '2023-03-17', closedOn: '2024-12-08',
  legs: [{ name: 'North America', from: '2023-03-17', to: '2023-08-09' }],
  showCount: 149,
  surprisesongsNote: null,             // Eras-depth PR fills per-show data later
  note: '<=400 chars', sources: [ /* §5 */ ],
}

// supabase/seed/theories/<era>.mjs — easter eggs + fan theories, clearly labeled
{
  slug: 'karma-lost-album',
  eraSlug: 'midnights',
  kind: 'easter_egg' | 'theory',
  title: 'The lost "Karma" album',
  claim: '<=400 chars — what fans believe, in our words',
  confidence: 'strong_fan_consensus',  // REQUIRED — enum in §5; renders as a badge
  outcome: 'confirmed',                // REQUIRED — §5
  relatedSlugs: ['midnights:karma'],   // cross-refs via stable slugs
  sources: [ /* §5 — fan_forum/social allowed HERE, weak elsewhere */ ],
}
```

Theories are the one place the 2026-07-04 "no relationship/private-life
theorizing" rule must carry over verbatim: `kind`-agnostic ban on
sexuality/family/identity speculation; `confidence` is required so nothing
speculative ever renders as fact (no-fabrication rule intact).

## 5. Proposed source/provenance + media-rights format

Additive `sources[]` object (existing `{outlet,url}` entries remain valid;
readers treat missing new fields as unknown):

```js
{
  source_url: 'https://newsroom.spotify.com/...',
  source_title: 'Taylor Swift Breaks Two Records with Midnights',
  publisher: 'Spotify Newsroom',        // supersedes `outlet`, same meaning
  source_type: 'official',              // enum below
  accessed_at: '2026-07-08',
  reliability_score: 5,                 // 1–5, rubric below
  excerpt: null,                        // OPTIONAL verbatim quote, HARD CAP 300 chars
  notes: 'primary source for the 184.6M figure',
}
```

- **`source_type`:** `official | interview | reputable_press | chart_database |
  awards_database | fashion_database | fan_forum | wiki | social | video |
  image_source`.
- **`reliability_score` rubric:** 5 = official/primary (artist, label, platform
  newsroom, Billboard chart data) · 4 = reputable press with editorial standards
  · 3 = trade/fashion databases, verified interviews via secondary outlets ·
  2 = wikis, well-moderated fan forums · 1 = unverified social/rumor.
  `fan_forum|wiki|social` alone never satisfy sourcing for a factual claim
  (they're fine as the *subject* of a theory record, and as supplements).
- **`excerpt` cap = 300 chars, enforced.** Original-words summaries remain the
  default (policy §1: facts, not expression); an excerpt is for the rare
  load-bearing quote. The coverage validator reports ≥300 today and **hard-fails
  ≥600** and any verse-like block — full lyrics, article bodies, and official
  statements verbatim are banned outright per the 2026-07-08 decision.
- **Theory `confidence` enum:** `official | confirmed_interview |
  reputable_reporting | strong_fan_consensus | plausible | clowning |
  disproven | joke_meme`.
- **Theory `outcome` enum:** `confirmed | partially_confirmed | pending |
  debunked | abandoned | unfalsifiable`.

Rights-aware media object (supersedes bare `thumbnailUrl` string /
`photos[{url,credit}]`, which stay readable as `rights: 'hotlink_legacy'`):

```js
{
  kind: 'oembed' | 'owned' | 'hotlink_legacy',
  // oembed (policy §2a): provider + canonical URL; render via provider embed
  provider: 'instagram', post_url: 'https://www.instagram.com/p/...',
  oembed_fetched_at: '2026-07-08',
  // owned (policy §2b): licensed asset we host; the ONLY rehosting allowed
  asset_path: null, license: 'getty-editorial', license_ref: 'GTY-12345',
  attribution: 'Beth Garrabrant / Getty Images',   // credit != license; always kept
  rights: 'platform_tos' | 'licensed' | 'hotlink_legacy',
}
```

Policy alignment (decision log 2026-07-08): original summaries + links ✅ ·
embed social via official oEmbed ✅ (`kind: 'oembed'`, treated as ephemeral) ·
licensed editorial imagery is the only stored media ✅ (`kind: 'owned'` +
`license_ref`) · rehosting arbitrary photos stays banned (no shape for it) ·
never full lyrics/article bodies (hard-fail in CI) · no private-address /
real-time-location / stalking data (hard-fail in CI; sighting records stay
past-tense, venue-level, post-hoc) · anything monetized (e.g. fashion
shop-the-look links) is out of scope until external IP counsel signs off.
Existing hotlinks are grandfathered as `hotlink_legacy` and migrated per era
during the relevant rollout PR.

## 6. Validation, acceptance criteria, rollout

### Coverage checks (implemented in `scripts/content-coverage.mjs`, in CI)

Report-only (gaps, never red): eras present/missing vs the 12 expected · thin
eras (<30 items or 3+ empty categories) · albums/tours present vs public-record
expectations · track-guide coverage per era · videos/theories modeled-or-not ·
0-source / single-source / weak-only-source counts · verbatim excerpts ≥300 ·
media missing rights-status or credit.

**Hard-fail (exit 1, blocks CI):** stored lyrics (verse-like multi-line
blocks) · article/statement dumps (any field >2000 chars or a verbatim quoted
span ≥600) · private-address / flight-tracking / real-time-location patterns ·
any content object without stable identity (missing era slug / natural key, or
duplicate keys). Today's corpus passes all four, so the gate is wired into
`.github/workflows/ci.yml` after `validate:content`.

### "Launch-complete" acceptance criteria (content)

1. 12/12 eras present, each ≥ wavetop floor; no era "thin" by the report.
2. All 16 released albums/re-recordings exist as `Release` records + milestones.
3. Track guide: 12/12 albums, every track with a real source or explicitly
   skipped (no fabrication, no padding).
4. ≥1 `video` record for every official music video/short film with a source.
5. All 6 tours as `Tour` records; Eras Tour with leg-level depth.
6. Every theory record carries `confidence` + `outcome`; zero un-labeled
   speculation anywhere.
7. Source coverage: 0 records with 0 sources (holds today); `business` claims
   two-source per the existing framework; 0 weak-only records.
8. Media: 0 references without a rights status; all owned assets licensed with
   `license_ref`; excerpt cap enforced (0 fields ≥300 unfixed).
9. `content:coverage`, `validate:content`, `check:budget:seed` all green in CI.
10. Joey's spot-check per era (the J3.5-next timing item) recorded in the PR.

### Rollout — 8 content-only PRs (Joey's order)

1. **This PR** — audit/spec + coverage validator (no content rows).
2. **The Life of a Showgirl + era repairs** — 12th era (full, wavetop+),
   TTPD end-date trim, thin-era top-ups (folklore/debut/lover/evermore floors).
3. **Albums/releases** — `releases.mjs`, all 16 releases + `release` items.
4. **Songs** — track guides, all 12 albums (real sources only).
5. **Videos** — `video` category migration + official videography.
6. **Fashion/appearances** — structured fields + rights-status migration of
   existing fashion media per §5.
7. **Easter eggs/theories** — `theories/` seed dir + confidence/outcome model.
8. **Eras Tour depth** — per-leg/per-show detail, surprise-song data.

Each PR: seed data + (where needed) one small migration; validator expectations
updated in the same PR; `content:coverage` green; Joey spot-check before merge.

### Rights-policy notes (standing, from decisions 2026-07-08)

Original words, always; link the source. Verbatim = capped excerpt (≤300) or
nothing — never lyrics, never article bodies, never official statements.
Media = embed (oEmbed, ephemeral) or license (owned, permanent) — never rehost
found photos. Sightings are historical, venue-level, never real-time; no
addresses, no flight tracking, ever (CI-enforced). Attribution is not a
license — keep both. Monetization (affiliate/shop-the-look) ships nothing
without external IP counsel; UNOFFICIAL disclaimer stays prominent.
