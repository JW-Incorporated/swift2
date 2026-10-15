# Merch research (read-only), 2026-10-14

Sources: origin/main (blobless clone at scratchpad/hist.git, HEAD 2026-10-14). Local checkout is STALE (HEAD af1b68d9c 2026-10-04, shallow from 2026-09-12). Key files identical on both.

## Verdicts on the 3 prior claims
1. Affiliate env unset in Vercel: CONFIRMED by docs only (docs/decisions.md:10-14; docs/plans/one-ui/PROGRESS.md:27 "live JS agrees"). Vercel not queried. Naming nit: decision says AMAZON_ASSOCIATES_TAG/CATCHALL_ID; code reads NEXT_PUBLIC_AWIN_ID / NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG / NEXT_PUBLIC_CATCHALL_ID (packages/ui/src/reader/moment/lib/shop.ts:116-119, apps/web/lib/host-adapter.tsx:143-145). gh variable list holds none of them (they would be Vercel envs).
2. E6 step 4 writer not implemented: CONFIRMED at origin HEAD (docs/SPEC.merch-autonomy.md:411-417). Only apply-demotions.mjs touches era files (removal).
3. Matcher authoring manual + typed confirm: CONFIRMED (merch-matcher-authoring.yml:12-37, RUN_MATCHER_AUTHORING). WORSE: it passes stubs extractImpl: async () => ({}) and judge: async () => ({score:0}) (yml:86,89), so it never calls Claude; real Claude path is match-moments-authoring.mjs main() L225-262, invoked by no workflow. merch-matcher.yml and merch-matcher-authoring.yml have ZERO runs ever.

## Key finding: "ton of merch with affiliate links" is refuted
- docs/ops/AFFILIATE-COVERAGE.md (origin HEAD): total 414, wrapped 0, awin-apply 10, pending-signup 8 (amazon.com), uncovered 98, direct-by-policy 298 (official store).
- awin-advertisers.json (generatedAt 2026-10-14): 8 advertisers, 0 joined. shop-networks.ts wraps only joined=true; Amazon only if tag set.
- 0 of 377 official+fan-made seed URLs (local snapshot) contain tracking params; moment products are direct retailer URLs by design (decisions.md:6504-6538: wrap at render in buildShopUrl; content never stores affiliate URLs).
- Actions secrets exist (names only): AWIN_API_TOKEN, AWIN_FEED_API_KEY, AWIN_PUBLISHER_ID, ETSY_API_KEY, SEARCH_API_KEY, ANTHROPIC_API_KEY. Whether any Awin advertiser is approved / Amazon Associates exists: UNVERIFIED (PLAN.merch-autonomy.md:234-239 lists signups as human steps).

## How existing matched products got there
- Field names: moment.products[] in supabase/seed/content/<era>.mjs (packages/content/src/schema.ts:173-188: brand,item,retailer,url,price,inStock,isAlternative,altNote,imageUrl,matchTier,matchScore,verifiedAt,kind,altListing). No affiliateNetwork/momentId field; network derived from retailer host at render.
- Authoring: agent-in-session content PRs (e.g. #2186 stylist, #3257 product-gap), then one-time E3 vision audit PR #3486 (2026-08-30: 6 scored, 59 unscored, 25 mismatches removed), #3544 backfill 'unscored', #3573/3575/3578 photo audits. Now 92/100 products matchTier 'unscored', 8 with matchScore, 1 exact/close.
- Built but never producing merged output: E0 Awin index, SerpAPI search, Claude vision (match-moments-authoring.mjs, model claude-sonnet-5 L191/L268, serpapi L15).
- Official: merch-official-sync.yml deterministic Shopify scrape 2x/day. Fan-made: merch-fanmade.yml daily detection; judged curation lane manual (#3480 wrote 22 on 2026-08-30).

## Counts by week (origin snapshots)
| week | moment products | official | fan-made |
|---|---|---|---|
| 07-27 | 155 | n/a | n/a |
| 08-03 | 155 | n/a | n/a |
| 08-10 | 157 | n/a | n/a |
| 08-17 | 159 | n/a | n/a |
| 08-24 | 159 | n/a | n/a |
| 08-31..09-28 | 100 | 355 | 22 |
| 10-05 | 100 | 355 (+5 new, -62 removed that week) | 22 |
| 10-14 HEAD | 94 | 298 | 22 |
New matched products since 08-31: 0. New fan-made: 0. New official: +5. Pre-08-31 growth ~+2/week (hand PRs). Removals: dead-link sweeps #4643/#4645/#5310. Confidence: counts high; weekly attribution moderate (squash merges, 08-30 restructure; official/fan-made files did not exist before 08-30). Zero carry an affiliate link.

## Run history (gh run list, last 20)
- merch-matcher, merch-matcher-authoring: 0 runs ever.
- merch-official-sync: 20/20 success (schedule) 10-05..10-14.
- merch-fanmade: 19 success + 1 in-progress, 09-25..10-14.
- merch-verify: 13 success, 6 failure (09-25..09-30), all "No files were found .artifacts/merch-*.json" at upload-artifact (checked 4 of 6); green since.
- merch-awin-sync: 20/20 cancelled (16 dispatch, 4 schedule) 10-10..10-15: feed refresh step hits timeout-minutes 45 (yml:21) at ~13s/feed (~86 feeds), so Save cache (yml:68) skipped; product index never persists. Run 38664203889 verified. Also ~30 "refresh Awin advertiser map" PRs in 10 days (timestamp-only churn, inferred).

## Cost / caps
- merch-matcher-authoring: paid_search_cap default '5' (yml:23-26, free tier), timeout 20 min; Claude spend uncapped in yml but stubbed to 0 calls.
- merch-audit-authoring (E3): MAX_RUN_COST_USD = 5 (audit-matches-authoring.mjs:15), typed confirm RUN_AUTHORED_VISION_AUDIT, artifact-only (SPEC:256-264).
- Real E6 per-run $: UNVERIFIED (never run).

## Traps
- Local checkout stale; use origin. Seed is not where affiliate links live. Docs say E6 fires on fashion-moment merge; actually dispatch-only.
