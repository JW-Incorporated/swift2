# Image staging for T15/T16 — major-event gallery candidates

Date: 2026-07-09. Prep work for the `ContentItem.images: ImageRef[]` schema
(T15, owned by a parallel engineering session — not built yet) and the
content re-pass (T16, per `docs/content-depth-audit-2026-07-08.md` §A2).

**Purpose:** stage real, verifiable image candidates for "major event"
moments so content can drop straight into the `images[]` array the moment
T15 ships, with zero research lag. Nothing here implies the schema exists
yet — this is a research doc only. No component/type/script files touched.

**Media policy applied** (`docs/decisions.md` 2026-07-08 "Media & content
sourcing policy"): images are either (a) embedded via a provider's official
oEmbed from a public Instagram/X/YouTube/TikTok post, or (b) licensed
editorial imagery (Getty/AP/etc.) if we want to own+host it. Rehosting
arbitrary internet photos is banned. Every entry below is marked with which
bucket it falls into, or flagged as "not yet available" if neither applies.

Every image entry includes a `kind` per the T15 spec: `primary` (the actual
event/subject), `reference` (comparable/historical material, never implying
it's the real thing), or `archival`.

---

## 1. `vault-tloas-taylor-and-travis-marry-at-madison-square-garden` (MSG wedding, July 3 2026)

**Status as of this research pass: no official/press photo of the ceremony
itself has been released.** The event had a strict no-phone policy for
guests, which is why almost nothing leaked. Do not treat any of the below as
equivalent to an official release — they are the best currently-real,
sourceable options, all secondary/guest-adjacent.

| Candidate | Shows | Sourcing route | Suggested caption | kind |
|---|---|---|---|---|
| Guest Instagram post(s) from inside the venue (e.g. Joann Jordan, wife of Travis's trainer Rob Jordan, posted a photo of the couple on a staircase under a chandelier) | A guest-shot moment of the couple at the reception | **oEmbed candidate** — IF the guest's Instagram post is public and still live. Must re-check at implementation time; guest accounts can go private/delete posts (oEmbed's known fragility, flagged in the decisions.md media policy). Do not screenshot/rehost if the post isn't public. | "A guest's view from inside the reception — shared publicly on Instagram." | primary (guest-sourced, not official) |
| CBS News / Billboard / SI.com photo galleries covering the wedding | Exterior MSG shots, guest arrivals, event signage (jumbotron reading "JUST&T MARRIED!") | **Would need licensing** — these outlets typically run wire-service (Getty/AP) photos for red-carpet/arrival shots; the specific photographers/credits need confirming per-image at licensing time, not assumed. | "Outside Madison Square Garden on the wedding night." | primary |
| MSG exterior / marquee photos (from local NYC press, e.g. NBC New York) | The venue itself, event signage | Likely wire/press photo — **license**, or use a public, credited event photo if the outlet's terms allow embedding | "Madison Square Garden's marquee on the night of the wedding." | archival/context |

**Flag: no usable direct photo of the couple in wedding attire exists yet
as of this research pass** (2026-07-09, 6 days post-wedding). This is not a
research gap — outlets covering it (CBS, NBC, Yahoo, SI, Hello!) all
explicitly note the couple controlled release of images and none had come
out publicly at time of their reporting. Recommend: re-check closer to T15
ship date, since official photos (a magazine exclusive, e.g. Vogue/Vanity
Fair, is the most likely eventual release path for a couple this
image-conscious) may surface between now and implementation. Until then,
the moment should ship with the two press/guest options above, clearly
captioned as "reported"/"guest-shared," not "official."

---

## 2. `vault-tloas-the-wedding-gown-a-custom-dior-haute-couture-styled-by-josep` (wedding gown, reference images only)

**Status: no photo of the actual gown exists.** All entries below are
`kind: reference` — comparable/historical material, never the real dress.
AI-generated fakes are circulating online per the seed content's own note;
none of those should ever be used, confirmed by this research pass too.

| Candidate | Shows | Sourcing route | Suggested caption | kind |
|---|---|---|---|---|
| Jonathan Anderson's debut Dior Haute Couture Spring/Summer 2026 collection (shown January 2026, his first couture outing at the house) — runway photos of the white gowns with bubble hems, long white peplum dresses, ruffled minis | Anderson's own couture-bridal-adjacent aesthetic just before designing Swift's dress | **License** — runway photos are wire-service (Getty/WWD/Vogue Runway) images; Vogue Runway itself sometimes allows embedding via their own player, worth checking their embed terms at implementation | "Jonathan Anderson's debut Dior Haute Couture collection (Spring/Summer 2026) — the designer's own couture-bridal aesthetic just before this commission." | reference |
| Elizabeth Taylor's 1950 wedding gown, designed by Helen Rose for her wedding to Conrad Hilton — the gown reportedly referenced per Hollywood Reporter/Marie Claire | The illusion-neckline, basque-waisted silhouette Swift's dress reportedly drew on | **License** — historical photos of this dress are held by agencies (Getty archival/Bettmann); the dress itself (now privately owned after a 2013 Christie's sale for $188,000) has museum/auction-house photography that would need rights clearance, not casual reuse | "Elizabeth Taylor's 1950 wedding gown by Helen Rose — the reported style reference for Swift's Dior dress." | reference |
| Prior Dior Haute Couture bridal-adjacent looks (pre-Anderson era, e.g. Maria Grazia Chiuri's couture finales, which often close with a bridal look) | General "Dior couture bridal" visual language, for context if a true comparable can't be secured | **License** — same runway-photo caveat as above | "A previous Dior Haute Couture bridal look, for stylistic context — not the actual gown." | reference |

**Meets the 2+ reference-image minimum from §A2** using rows 1 and 2 above;
row 3 is a nice-to-have third if licensing the first two proves difficult.

---

## 3. Engagement announcement — Aug 26, 2025 (`vault-tloas-...-your-english-teacher-and-your-gym-teacher...` per seed, `showgirl-engagement-announcement` slug, `the-life-of-a-showgirl.mjs` line ~1000)

**Real, public, oEmbed-able source exists — this is the easy win of the
batch.**

| Candidate | Shows | Sourcing route | Suggested caption | kind |
|---|---|---|---|---|
| The couple's joint Instagram post, Aug 26 2025 (5 photos: garden proposal shots + ring close-up), posted to Taylor Swift's and/or Travis Kelce's official Instagram | The actual proposal — Kelce on one knee in a rose garden, and a close-up of the ring | **oEmbed** — this is a still-public, still-live official post from the subject's own account; the strongest oEmbed candidate in this whole doc. Exact post URL needs pulling directly from instagram.com/taylorswift or /killatrav at implementation time (not found via search snippets here — confirm the permalink before wiring it up). | "Taylor and Travis announced their engagement in a joint Instagram post, Aug. 26, 2025." | primary |
| Ring close-up (same post, different frame) | The Old Mine Cut diamond, designed by Kindred Lubeck of Artifex Fine Jewelry | Same oEmbed post — if the embed only surfaces one image, a second sourced photo of the ring from press coverage (e.g. a jewelry-trade outlet like JCK or a fashion outlet like Marie Claire) could supplement, but check whether they're using licensed vs. their own photography before treating as embeddable | "The ring: an Old Mine Cut diamond by Artifex Fine Jewelry." | primary |

**Recommendation: this should be the first moment content-repassed once
T15 ships** — real source, real public post, straightforward oEmbed, closes
the gap fastest.

---

## 4. Album release day — "The Life of a Showgirl" drops, Oct 3 2025

Seed content covers this moment across several items (cover art, release
party film, chart records) but none currently carry images.

| Candidate | Shows | Sourcing route | Suggested caption | kind |
|---|---|---|---|---|
| Official album cover art (Mert Alas & Marcus Piggott photography, Swift submerged in water, jeweled top, orange-glitter title) | The single most iconic, already-public image tied to this era | **License** — this is commercial album art owned by the label/artist; using it requires the same licensing lane as any other owned asset (or an official embed if Apple Music/Spotify provide an oEmbed-style widget for album art, worth checking their embed APIs, which is lower-risk than a raw image license) | "The official cover art for The Life of a Showgirl." | primary |
| Fan/press photos from release-day pop-up events (Starbucks pop-up in Nashville, TikTok pop-up at Westfield Century City, Astor Theatre Melbourne listening event) — covered in Deadline's photo galleries | The communal release-day atmosphere, not the artist herself | **License** (Deadline/Getty gallery) or find a public fan Instagram/TikTok post of a specific pop-up for oEmbed | "Fans celebrating release day at a pop-up listening event." | archival/context |
| "The Fate of Ophelia" official music video | The lead single's video (Marilyn Monroe-inspired sequence, showgirl tableaux) | **oEmbed via YouTube** — official video is public on Swift's own YouTube channel (`youtube.com/watch?v=ko70cExuzZM` per Variety/Billboard coverage — verify the canonical official-channel URL, not a reposted copy, before embedding) | "The official music video for 'The Fate of Ophelia.'" | primary |

---

## 5. The Eras Tour: The Final Show — Disney+ concert film, Dec 12 2025

| Candidate | Shows | Sourcing route | Suggested caption | kind |
|---|---|---|---|---|
| Official Disney+ key art / poster for "The Eras Tour: The Final Show" | Promotional key art for the concert film | **License or official embed** — Disney+ typically issues press-kit key art through outlets like Deadline/Variety; using it requires confirming Disney's press-image usage terms, likely licensing-adjacent even if nominally "for press use" | "Key art for The Eras Tour: The Final Show, Disney+." | primary |
| Concert stills from the Dec 8 2024 Vancouver (BC Place) show itself, as used in press coverage of the Emmy-nominated film | The actual filmed performance (the "Female Rage"/TTPD segment referenced in the seed content) | **License** — concert photography from this specific show is Getty/AP or Swift's own production company (Taylor Swift Productions/Silent House); same licensing lane as the wedding photos | "A still from the Vancouver Eras Tour finale, filmed for The Final Show." | primary |

**Flag:** did not find a confirmed public oEmbed-able post for this one in
this pass — everything found routes through licensing. Treat as a
licensing-lane item, not a quick win.

---

## 6. The engagement ring reveal is covered above (item 3); no separate
gallery needed — do not duplicate.

## Additional candidate considered and deprioritized

**The Watch Hill "bachelorette weekend" item** (`vault-tloas-a-tented-lawn-in-rhode-island...`,
June 2026): checked for imagery — this was covered via TMZ paparazzi/drone-style
reporting of a private estate, which is exactly the kind of photo the media
policy's "no rehosting arbitrary photos" rule is meant to exclude (no
credentialed press access, no official images, no public post from
attendees found). **No usable real image found; do not stage anything for
this item** rather than reach for a paparazzi photo.

---

## Summary for whoever picks this up at T15 ship time

- **Easy win, do first:** engagement announcement (#3) — real, public,
  official Instagram post, straightforward oEmbed.
- **Second:** album release day (#4) — official cover art (needs licensing
  confirmation) + official YouTube video (clean oEmbed) + optional pop-up
  photos.
- **Reference-only, both usable now:** wedding gown (#2) — Anderson's SS26
  Dior couture collection + Elizabeth Taylor's 1950 gown, both licensable,
  meets the 2+ reference minimum.
- **Hardest, still open:** the wedding itself (#1) and the Final Show film
  (#5) — no clean oEmbed found; both route through editorial licensing, and
  the wedding specifically may simply not have a real photo available yet at
  T15 ship time. Re-check before content lands rather than reusing this
  doc's guest-Instagram lead without verifying the post is still public.
- **Explicitly ruled out:** the Watch Hill bachelorette item — no
  policy-compliant image exists; leave without an image rather than force
  one in.

None of the images/sources above have been fetched, embedded, or licensed
as part of this task — this is a staging/research document only, per the
media policy's requirement that licensing scope be confirmed before any
asset is actually hosted.
