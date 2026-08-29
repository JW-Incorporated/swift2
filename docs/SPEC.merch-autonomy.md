# SPEC.merch-autonomy.md — Execution spec for the self-running marketplace

**Status:** proposed. Written 2026-08-26. Companion: `PLAN.merch-autonomy.md`
(strategy, feasibility, decisions D1–D3, HUMAN-ACTIONS list). This file is the
build spec: data model, six engines, the affiliate seam, workflows, gates, and
acceptance criteria. Written to be executed by Claude Code sessions inside the
repo's existing conventions.

---

## RULINGS — do not re-litigate, do not improvise around

**R1. Detection is dumb code; judgment is an LLM lane; landing goes through
the existing gates.** Every engine splits exactly like
`appearance-discovery.yml`: a scheduled zero-LLM workflow detects and files,
an authoring lane judges and writes, `auto-merge-content.yml` +
`automerge-branch-author-gate.mjs` land it. No engine invents a new merge
path. New branch prefixes and workflow authors must be registered in the
gate before first run.

**R2. Honesty rules extend, never weaken.** No fabricated products, prices,
makers, or links (existing rule). New: no match tier claimed above the
auditor's scored confidence; no affiliate wrap presented without the
disclosure; an item that fails verification is dimmed or removed, never left
looking purchasable. Counts stay real; zero renders as an em-dash.

**R3. Content stores destination URLs only.** `buildShopUrl()` remains the
single seam where wrapping happens (existing rule, now load-bearing).
Engines author plain retailer URLs; nothing in `supabase/seed/**` ever
contains a network-wrapped link. Reverting monetization must remain a
one-file change.

**R4. Every network's ToS is a hard constraint.** FTC disclosure renders
wherever `isAffiliate()` is true (already wired). No wrapping links in
contexts a program forbids. No AI-generated imagery presented as product
photography (Etsy affiliate policy). Fan-made curation follows the D3
"inspired-by yes, bootleg no" line as a hard gate, not a preference.

**R5. Budget discipline.** Vision calls are batched and cached
(product-image hash + moment-image hash → score, stored; re-scoring only on
image change). Search-API calls are metered per run with a hard cap read
from config; a run that would exceed the cap files a ticket instead of
spending. Awin feed pulls follow Awin's own etiquette: check the feed list's
last-update timestamps before downloading, jitter cron starts by 10s–120s,
≤5 requests/min to the Enhanced Feed API, never concurrent requests to the
same advertiser feed.

**R6. Awin-first is a tie-breaker, never an override (added 2026-08-29).**
Engines that source products search the Awin product index first because
hits there are monetized by construction — but a candidate from the index
wins ONLY at equal-or-better match tier. Listing a worse look-alike because
it pays is the exact dishonesty R2 exists to prevent. Where the best match
is unmonetized and an Awin candidate clears the same tier, both may be
listed with the Awin item preferred in card order.

---

## 1. Data model changes (`apps/web/lib/longlive/types.ts`)

Extend `Product` — all fields optional, all backward compatible:

```ts
/** Graded match quality, written ONLY by the E3 auditor or E6 matcher. */
matchTier?: 'exact' | 'close' | 'similar' | 'inspired' | 'unscored';
/** 0–100 auditor confidence backing matchTier; absent when matchTier is 'unscored'. */
matchScore?: number;
/** ISO date the link/stock/image were last machine-verified. */
verifiedAt?: string;
/** Garment/product category — unlocks the type filter row the mockup
 *  wanted. Written by E6 for new items; backfilled by E3 for existing.
 *  A fixed union, not free text: */
kind?: 'dress' | 'top' | 'bottom' | 'outerwear' | 'knitwear' | 'shoes'
     | 'jewelry' | 'bag' | 'hat' | 'eyewear' | 'beauty' | 'accessory'
     | 'music' | 'collectible' | 'home' | 'other';
/** E4 only — a secondary affiliate-able listing of the same item
 *  (e.g. the Amazon twin of an official-store product); routed
 *  through the same listing-scoped seam (section 2), disclosure included. */
altListing?: { retailer: string; url: string };
```

Semantics: `isAlternative` is derived UI truth (`matchTier !== 'exact'`),
kept during migration for compatibility; the UI badge switches to reading
`matchTier`. `officialStore` and `fanMade` buckets gain real seed files:
`supabase/seed/merch/official.mjs` and `supabase/seed/merch/fanmade.mjs`,
same `Product` shape plus `MerchSource`-style provenance
(`discoveredVia: 'shopify-sync' | 'etsy-search' | 'reddit' | 'submission'`,
`discoveredAt`). `merch.ts` reads them instead of returning `[]`.

## 2. The affiliate seam flip (`apps/web/lib/longlive/shop.ts`)

New sibling config `shop-networks.ts` (checked in, no secrets):

```ts
export type Network = 'awin' | 'amazon' | 'catchall' | 'none';
/** hostname → network resolution, in priority order:
 *  1. 'awin' if the hostname appears in the GENERATED map
 *     lib/longlive/awin-advertisers.json (retailer hostname → awinmid),
 *     written by E0 from the Publisher API's joined-programmes list.
 *     Etsy is simply one entry in that map (awinmid 6220), not a
 *     special case.
 *  2. 'amazon' for amazon.com.
 *  3. 'catchall' IF AND ONLY IF the D2 residue signup ever happens;
 *     until then unmapped hostnames resolve to 'none'.
 *  4. 'none' — plus explicit policy exemptions (official bucket, D1-a). */
export function networkFor(retailer: string): Network;
```

`buildShopUrl(listing)` accepts any listing (a product's primary
`{retailer, url}` pair or its `altListing`) and branches on
`networkFor(listing.retailer)`:

- **awin** — Awin deeplink format
  `https://www.awin1.com/cread.php?awinmid=<mid-from-map>&awinaffid=<AWIN_ID>&clickref=<subid>&ued=<encodeURIComponent(url)>`.
  When E0's feed index already holds a canonical deeplink for the exact
  product, authoring engines may store the plain retailer URL regardless
  (R3 — content never holds wrapped links); the seam always constructs
  the wrap itself.
- **amazon** — append `tag=<ASSOCIATES_TAG>` and
  `ascsubtag=<subid>` to the product URL (URL-parse, never string-concat;
  preserve existing params).
- **catchall** — dormant until D2's residue case is proven; wrap format
  specified at signup, `xcust`-style param carrying `<subid>`.
- **none** — return `listing.url` unchanged (official bucket under D1-a,
  unmapped long-tail pending an Awin join, or an explicit exemption).

`<subid>` = `${eraId}.${momentId}` (or `official`/`fanmade` bucket ids) —
this is the analytics spine: network dashboards then report clicks/revenue
per era and per moment with zero client-side tracking added.

`isAffiliate(listing)` returns `networkFor(listing.retailer) !== 'none'` **and** the
corresponding credential env var is present — so the disclosure and the
wrapping appear atomically per network as each signup completes, and the
site never renders a broken half-wrapped link while Phase 0 is in flight. The disclosure
line renders whenever ANY link in a shop block (primary or `altListing`)
is affiliate-wrapped, so alternate listings carry disclosure identically.
Credentials: `NEXT_PUBLIC_AWIN_ID` (affiliate id, in the wrap),
`NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`, `NEXT_PUBLIC_CATCHALL_ID` (dormant),
plus server-side `AWIN_API_TOKEN` (Publisher API), `AWIN_FEED_API_KEY`
(Create-a-Feed downloads), `AWIN_PUBLISHER_ID`, and the E5/E6 keys below.
All are `vercel env add` + repo Actions secrets; exact commands go in the
HUMAN-ACTIONS item.

**Coverage report:** `scripts/merch-engine/affiliate-coverage.mjs` walks all
buckets, resolves each product through `networkFor`, and regenerates
`docs/ops/AFFILIATE-COVERAGE.md`: per-product rows
(`item | retailer | network | status | link-format`) plus a summary table.
Statuses: `wrapped`, `awin-apply` (retailer IS an Awin advertiser we
haven't joined — these rows ARE the apply shortlist Joey batch-approves),
`pending-signup` (network chosen, credential missing), `uncovered` (on no
network we hold — the D2 residue evidence), `direct-by-policy`. CI
regenerates it like other generated docs (`check-generated-in-sync.mjs`
pattern). **Issue #4 is done when this report has zero unexplained
`uncovered` rows and an empty `awin-apply` set.**

## 2b. Engine E0 — Awin Sync (the programme map + product index)

Everything Awin-first keys off this engine. Two scripts, one workflow
(`merch-awin-sync.yml`):

**`scripts/merch-engine/sync-awin-programmes.mjs`** (daily): Publisher API →
(a) joined programmes → regenerate `awin-advertisers.json`
(hostname → awinmid; hostnames resolved from each advertiser's primary
region/domain, with a checked-in override map for advertisers whose Awin
display name ≠ their storefront hostname); (b) the full directory
cross-referenced against our retailer list (all buckets) and, once
available, click counts by retailer → regenerate the `awin-apply` rows in
the coverage report. A newly-relevant advertiser (a retailer E6 keeps
hitting, or one gathering clicks) that we haven't joined gets surfaced in
Marjorie's brief — the human action is one dashboard click per advertiser.

**`scripts/merch-engine/sync-awin-feeds.mjs`** (daily, jittered per R5):
Product Feed List download → compare last-update timestamps → fetch only
changed feeds (Create-a-Feed CSV; Enhanced Feed API for advertisers that
offer it) → normalize into a local product index: SQLite built in the
Actions run and stored in the Actions cache, **never committed** (feeds are
large, refreshed data, and Awin's — cache is the honest home for it).
Index schema: advertiser mid, product id, title, description, brand, price,
stock, image URL, destination URL, deeplink, category, updated-at; FTS on
title+description+brand. Consumers: E6 (candidate search, first pass), E5
(fan-shop advertisers), E1 (a free liveness/stock cross-check for any
product whose retailer is in the index — feed says discontinued beats an
HTTP probe). Etsy caveat, explicit: Etsy does not expose its full
third-party catalog as a publisher feed — Etsy discovery stays on the Etsy
API (E5) and Awin's role for Etsy is the wrap only.

## 3. Engine E1 — Link & Stock Verifier (issues #2, part of #9)

Detection (extend, don't fork, `check-link-liveness.mjs`): add
`--products` mode that checks only `Product.url` + `altListing.url`,
classifying `ok | dead (404/410) | soft-404 | blocked (403/anti-bot) |
sold-out` — sold-out detected by retailer-generic markers
(`out of stock`, `sold out`, schema.org `OutOfStock`) with a per-retailer
override map for the top hosts. `blocked` is never treated as dead (R2:
don't punish a product for a bot wall); it retries with backoff across runs
and only escalates after 3 consecutive fails.

Action lane (new: `scripts/merch-engine/mend-links.mjs`, "Merch Mender"):
for each `dead`/`soft-404`, attempt in order — (1) same retailer, re-find
the product page via the retailer's own search/sitemap; (2) if the exact
item is gone, mark `inStock: false` and file a re-source ticket for E6 to
find a replacement candidate; never silently swap to a different product
(that's E6's judged job, not a mender's). Writes `verifiedAt` on every
touched product. Output: one PR per run on branch `merch-mend/<date>`,
gated per R1. `sold-out` flips `inStock` in both directions — back-in-stock
is the same diff.

Cadence: detection daily; mender runs on detection output same day.

## 4. Engine E2 — Image Verifier (issue #3)

`scripts/merch-engine/verify-images.mjs`: for every `imageUrl`, a HEAD (GET
fallback) asserting 200 + `image/*` content-type + non-trivial byte size.
On failure: fetch the product page (if E1 says it's alive), re-extract
`og:image` / `twitter:image` / first schema.org `Product.image`, and rewrite
`imageUrl`. If the page is dead too, drop `imageUrl` — the existing
`merchItemImage()` fallback chain (moment photo → monogram) is the honest
render, already built. Same PR/branch/gate shape as E1; can share the
mender's daily PR. Also validates newly authored images from E4–E6 before
merge (a gate check, `check-merch-images.mjs`, wired into the content CI).

## 5. Engine E3 — Match Auditor (issue #1)

The core quality fix. `scripts/merch-engine/audit-matches.mjs`:

1. For each product with a source moment: gather product image (from
   `imageUrl` or scraped og:image) + the moment's real primary photo
   (`hasRealPrimaryImage()` — never era art).
2. One vision-model call per pair (batched; cached per R5): score 0–100 on
   silhouette, color/pattern, garment type, and notable details; return
   `{ score, tier, reasons, kind }` — the same call backfills `kind`.
3. Thresholds (start conservative, tune from spot-audits):
   ≥90 `exact`, 70–89 `close`, 45–69 `similar`, 25–44 `inspired`,
   **<25 = mismatch → demoted**: removed from the moment's products and
   filed as a re-source ticket for E6 with the auditor's reasons attached.
4. Products with no comparable image pair (beauty items, no moment photo)
   are marked `matchTier: 'unscored'` (no `matchScore`) and skip scoring — the UI shows no tier badge
   rather than a guessed one (R2).

Output: migration PR(s) writing `matchTier`/`matchScore`/`kind` across the
existing 134, then steady-state runs only on new/changed items. UI: the
binary "Similar style" label becomes a four-tier badge; the `kind` field
unlocks the garment-type filter row (the honest version of the one R1 in
the 2026-08-16 merch plan forbade faking — the data now exists).

## 6. Engine E4 — Official Store Sync (issues #5, #7)

`scripts/merch-engine/sync-official.mjs`, cadence twice daily (offset per
the repo's cron-contention conventions — pick minutes clear of :00/:05/:10/
:30/:40; document in the workflow header like the others):

1. Crawl `store.taylorswift.com/products.json?limit=250&page=N` (verified
   Shopify). Fallbacks in order: per-collection
   `/collections/<handle>/products.json`, then sitemap crawl. Gentle: 1
   req/s, conditional requests, back off on 429.
2. Normalize to `Product` rows: brand `Taylor Swift Official`, retailer
   `store.taylorswift.com`, price from the first available variant, `kind`
   mapped from Shopify `product_type`/collection, `inStock` from variant
   availability, image from Shopify CDN.
3. Diff against `official.mjs`. New products → authoring lane writes them
   in (with era attribution where a collection maps to an album/era — the
   collection list is album-shaped, so this is mostly deterministic).
   Price/stock changes → mender-style direct PR. Disappearances →
   `inStock: false` (never delete; drops sell out and return).
4. **Drops detection falls out of the diff**: a batch of genuinely new
   products = a drop → stage a social-poster queue draft (metadata-only
   claims, exactly like appearance-discovery's fast lane) and a "New Drops"
   rail entry.
5. Per D1-a: for each official item, a low-frequency Amazon check for an
   official twin (Amazon's official artist merch page covers music formats
   and some merch); verified twins get `altListing` and thereby an
   affiliate-able secondary link.

US store only in v1; regional stores (`storeuk`, `storeeu`, …) are a noted
non-goal.

## 7. Engine E5 — Fan-Made Discovery (issues #6, #7)

Three intake streams, one curation lane:

- **Etsy** (needs the API key from HUMAN-ACTIONS): scheduled search across a
  checked-in query list (`taylor swift inspired`, era names, lyric phrases —
  extendable by the lane itself), sorted newest, filtered to listings with
  real photos, sane price, active shop, review signal. The API also
  re-verifies liveness/price of already-listed fan items on the same
  schedule (Etsy listings die fast — E1 covers them too, but the API check
  is cheaper and richer).
- **Reddit**: keyless public JSON polling of fan-merch subreddits
  (r/TaylorSwiftMerch and a checked-in list), the dongerbot pattern this
  org has already operated. Posts linking to Etsy/shop pages become intake
  candidates. Stateless dedupe against filed issues, exactly per the
  appearance-discovery header's rules.
- **The existing submission form**: its GitHub-issue intake is already the
  right shape; submissions tagged for the fan-made bucket just join the
  same queue. (This also finally gives the form's output an automated
  consumer.)

Curation lane (LLM, judged): dedupe across streams; apply D3 hard gate
(inspired-by yes / bootleg no — reject items reprinting official art, tour
graphics, or Taylor's image); verify the listing resolves and photos load
(E1/E2 checks pre-merge); score fan-appeal; write accepted items to
`fanmade.mjs` with provenance, `kind`, and price. Every Etsy URL monetizes
through the single Awin membership at the seam — zero per-item affiliate
work. Non-Etsy fan shops (Shopify indies etc.): E0's directory
cross-reference checks whether the shop is itself an Awin advertiser
(some indie brands are) — if so it joins the map and monetizes; otherwise
it stays `direct-by-policy` or becomes D2 residue evidence.

Instagram/TikTok: deferred (no viable public read path; revisit only if a
compliant API materializes). The plan's feasibility verdict depends on not
pretending otherwise.

## 8. Engine E6 — Moment→Product Matcher (issue #8)

Trigger: post-merge workflow filtered to new/changed fashion-category
moments in the seed diff (plus re-source tickets from E1/E3).

Pipeline per moment:

1. **Extract** (vision + text): from the moment's photo(s) and prose,
   produce per-garment descriptors — kind, color, pattern, silhouette,
   brand if named in the moment (fashion moments often name the designer:
   that's a direct product-page hunt first, search second).
2. **Search, in strict cost order:**
   a. **The E0 Awin product index** (free, structured, monetized by
      construction): FTS on the extracted descriptors + brand; candidates
      arrive with price/stock/image attached.
   b. **Brand-direct hunt** when the moment names the designer (free):
      the maker's own product pages.
   c. **The metered paid API** (R5 cap) only for what a+b didn't answer:
      brand+item queries against Google Shopping-class results; retailer
      product pages only (existing authoring rule: never search pages).
3. **Verify** (vision, same scorer as E3): score ALL candidates from every
   source together against the moment photo; keep the best above the
   `similar` floor; label tier honestly; apply R6 at ties (equal tier →
   Awin candidate preferred; never a lower tier for money). Target output
   per look: the exact piece if findable, plus up to two alternatives at
   different price bands — which powers the "this look under $50" pick
   (issue #9).
4. **Author**: products written onto the moment via the standard content
   lane; E2's image gate and the URL-resolves rule run pre-merge; PR lands
   through R1 gates.
5. A moment where nothing clears the floor gets **no products** (R2) and a
   ticket that re-runs after 14 days (retail lag: dupes appear weeks after
   a look trends).

Budget: expected single-digit search calls + low-tens of vision scores per
moment; the R5 cap makes the worst case a ticket, not a bill.

## 9. Issue-#9 additions (spec'd, small)

- **Match-tier badges + kind filter row** — E3 outputs, UI-only work.
- **New Drops rail** — renders E4/E5 items `< 14 days` old; feeds the
  social queue (drafts only restate listing metadata, never claims).
- **Revenue/click loop** — a weekly script pulls network reporting APIs
  (Awin has one; Amazon/catch-all at minimum CSV/manual-free dashboards —
  use what each exposes, degrade gracefully), joins on `subid`, and writes
  a section into Marjorie's brief: clicks/revenue by era, moment, bucket;
  top uncovered retailers by clicks (the data that justifies D2 upgrades to
  direct programs).
- **SEO**: schema.org `Product` JSON-LD on merch entries (Nils's lens),
  with `offers` only where price/stock are machine-verified fresh.
- **Quarterly terms re-check** — a scheduled ticket to re-verify network
  rates/ToS assumptions pinned in the coverage report.

## 10. Workflows summary

| Workflow | Cadence | LLM? | Lands via |
|---|---|---|---|
| `merch-awin-sync.yml` (E0) | daily, jittered | no | gated PR (advertiser map) + Actions cache (index) |
| `merch-verify.yml` (E1+E2 detect) | daily | no | report → mender |
| `merch-mend` (E1/E2 act) | daily, after verify | small | gated PR |
| `merch-audit.yml` (E3) | weekly + on new items | vision | gated PR |
| `merch-official-sync.yml` (E4) | 2×/day | authoring lane for new items | gated PR + social queue |
| `merch-fanmade.yml` (E5) | daily | curation lane | gated PR |
| `merch-matcher.yml` (E6) | on fashion-moment merge | yes | gated PR |
| `merch-revenue.yml` | weekly | no | Marjorie brief |

All schedule minutes chosen clear of existing cron clusters; each workflow
header documents its offset and its secrets per house style. New secrets:
`AWIN_API_TOKEN`, `AWIN_FEED_API_KEY`, `AWIN_PUBLISHER_ID`, `ETSY_API_KEY`,
`SEARCH_API_KEY` (Actions); `NEXT_PUBLIC_AWIN_ID` +
`NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` (Vercel env; the catch-all ID only if
D2's residue case is ever proven). No other new credentials.

## 11. Acceptance criteria (definition of done, per phase)

**Phase 1:** every product carries `verifiedAt` ≤ 7 days old; zero `dead`
links rendered as purchasable; zero broken `imageUrl`s (failures fell back
honestly); all 134 existing products carry `matchTier`+`kind` (with `matchScore` present except where
`matchTier` is `'unscored'`);
sub-25 mismatches removed with re-source tickets filed; typecheck + full
suite green; no horizontal overflow at 360px on the updated cards.

**Phase 2:** `buildShopUrl` wraps per network with credentials present —
the Awin branch first, live for Etsy plus every joined advertiser;
disclosure renders on every affiliate-containing shop block; E0 has run,
`awin-advertisers.json` is generated (not hand-written), and the product
index builds clean in the Actions cache; `AFFILIATE-COVERAGE.md` generated
in CI with zero unexplained `uncovered` rows and the `awin-apply`
shortlist surfaced to Joey; subids verified end-to-end (a test click shows
in the Awin dashboard with the right `eraId.momentId` clickref).

**Phase 3:** official bucket = full US-store catalog, refreshed 2×/day,
each item era-attributed where deterministic, D1-a alt-listings attached
where verified; fan-made bucket ≥ 25 curated items at launch, 100% of Etsy
items wrapping through Awin; the three-section Merch page shows three real
counts, zero placeholders.

**Phase 4:** a new fashion moment produces authored, tiered, wrapped
products within 24h with no human touch; a store drop appears on-site and
in the social queue within one sync cycle; Marjorie's brief carries the
weekly revenue section; every engine has run ≥ 2 weeks with its failure
modes filing tickets rather than requiring intervention.

## 12. Open questions (tracked, not blocking)

- Catch-all merchant-list verification API access (affects how `uncovered`
  is proven vs `assumed`) — resolve at D2 signup.
- Era attribution for official items whose collection isn't album-shaped
  (generic "Merch" collection) — lane judgment call; default `eraId` null +
  an "All eras" shelf.
- Whether Amazon reporting exposes subtag-level revenue on the API tier
  we'll have — degrade to tag-level if not.
- Regional official stores, TikTok Shop fan merch — explicitly out of v1.
