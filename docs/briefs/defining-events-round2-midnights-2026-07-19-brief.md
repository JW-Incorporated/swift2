# Brief: source EVERY real photo you can find for 4 midnights.mjs defining moments

These 4 items in `supabase/seed/content/midnights.mjs` already carry
`significance: 'defining'` (docs/decisions.md, "Round 2" entry, 2026-07-19).
Their narrative content (`moment.context`, `moment.sources`) is already
solid and sourced — **do not rewrite it**. Each currently has only 1 photo.
There is **no cap on photo count** — source every real, distinct,
verifiable photo you can find, not a capped sample.

## OUTPUT — write to a NEW draft file only

Create `supabase/seed/content/_round2-midnights.draft.mjs`:

```js
export default [
  {
    matchTitle: 'Every spot in the Hot 100 top 10, all at once',
    matchDate: '2022-11-05',
    addPhotos: [
      { url: 'https://...', credit: 'Photographer/Agency, via Outlet', caption: 'What is actually happening in THIS frame.', kind: 'primary' },
    ],
  },
  // one entry per item below
];
```

Do **not** edit `supabase/seed/content/midnights.mjs` directly. This is
additive only — I merge your `addPhotos` onto the existing array myself.

## The 4 items (current photo count in parens)

1. **`'Every spot in the Hot 100 top 10, all at once'`** (2022-11-05) — **1
   photo now** (Anti-Hero single art). This is a pure chart-stat story with
   no dedicated photo op — look for real photos from the Anti-Hero video
   (official YouTube thumbnail at a real video id is fine), or real press
   photos from her October 2022 Midnights promotional window. If you
   genuinely can't find more than 1-2 real, distinct, on-topic photos,
   that's fine — do not force in an unrelated photo just to hit a count.
2. **`slug: 'eras-tour-presale-meltdown'`, `'The presale that broke Ticketmaster — and set a sales record anyway'`** (2022-11-15) — **1 photo now**. Look for: real photos from the Senate Ticketmaster hearing (Jan 24, 2023 — search "Ticketmaster Senate hearing" for the actual congressional hearing photos), news coverage of the presale meltdown itself, Eras Tour box-office/demand coverage from that period.
3. **`'A record fourth Album of the Year Grammy, for Midnights'`** (2024-02-04) — **1 photo now**. Look for: real photos from the Feb 4, 2024 Grammy ceremony — her accepting the award, red carpet, press room with the trophy.
4. **`'Super Bowl LVIII: a sheer corset, Area jeans, and his number in rubies'`** (2024-02-11) — **1 photo now**. Look for: real photos from her Feb 11, 2024 Super Bowl LVIII appearance at Allegiant Stadium — arrival, suite photos with Blake Lively/Ice Spice/Donna Kelce, the postgame field celebration with Travis Kelce.

## Hard rules

1. **Every photo URL must be real and verifiable** — curl-check it yourself
   before including it (`curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "<url>"`). Only `200` + real `image/*`.
2. **IMPORTANT — avoid `ca-times.brightspotcdn.com` entirely.** A prior pass
   found this specific CDN (LA Times) returns a real image to curl but a
   1x1 placeholder pixel to actual browsers (Referer-based hotlink
   protection) — curl cannot catch this, so just don't use that domain.
3. No AI-generated or stock/generic imagery. Real credit line required on
   every photo (photographer/agency + outlet).
4. No fabrication, no padding — ship fewer photos rather than a fake or
   mismatched one.
5. Never duplicate a URL already in the file for that item.
