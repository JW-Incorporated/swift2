# P1-23 media gate audit

Audited 2026-10-14 against the authored corpus and the live-news/social write paths. “Gate” means a blocking check before a new or changed item can publish, not a liveness sweep after publication.

| Surface | Gate before P1-23 | Evidence | Gap found | P1-23 disposition |
|---|---|---|---|---|
| Timeline moments (`content/*.mjs`) | Yes | `scripts/validate-content.mjs:203`; predicate at `scripts/lib/moment-media-gate.mjs:117` | None. The corpus has no moment media exemptions. | Kept. |
| Releases | No | Shared non-moment validator had optional `row.media`; gate now called at `scripts/validate-content.mjs:790`. | 29/29 existing rows have no media. | Fixed for new rows; 29 stable-key legacy gaps deferred. |
| Tours | No | Same shared non-moment path at `scripts/validate-content.mjs:790`. | 6/6 existing rows have no media. | Fixed for new rows; 6 stable-key legacy gaps deferred. |
| Theories | No | Same shared non-moment path at `scripts/validate-content.mjs:790`. | 74/74 existing rows have no media. | Fixed for new rows; 74 stable-key legacy gaps deferred. |
| Video works | Partial | Media entry shape was checked, but an empty `media` array passed; gate now runs at `scripts/validate-content.mjs:790`. | 8 of 215 existing rows have no media. | Fixed for new rows; 8 stable-key legacy gaps deferred. |
| Track guide rows | No row-level gate | `scripts/validate-content.mjs:942-970` validates only an optional YouTube id; `packages/content/src/schema.ts:348` also makes it optional. | 244 rows have no authored row-level media. The shipped track surface can use parent/album context, but there is no enforceable per-row media contract. | Deferred: adding a renderable track-media field requires schema/generator/UI files outside this touch set. |
| Era Secret cards | No | `packages/content/src/schema.ts:415-422` has no media field. | 55 text records rely on their parent era presentation. | Deferred: needs a product decision and schema/rendering support outside this touch set. |
| Runway looks | Yes | `scripts/validate-content.mjs:1140-1149` requires at least one image and validates its fields. | None. | Kept. Other lens records render as native timelines/graphs rather than authored media cards, so they are not photo-gated. |
| `current_item` live feed | Yes | `packages/shared/src/current-item-quality.ts:256-257` holds `missing_image` and non-allowlisted hosts. | The host list omitted Taylor's site/store, Shopify's official-store CDN, several established publishers, and their image CDNs. The resolver also had no deterministic official-video thumbnail branch. | Fixed. Added reviewed hosts and a hotlink-only fallback: official YouTube thumbnail first, then trusted-source `og:image`, while retaining the old lower-tier fallback to avoid new holds. Shopify is scoped to the official store's tenant path. |
| Social queue drafts | Yes | `scripts/social/lib/queue-schema.mjs:126-127,560` requires media for X and Instagram. | None in the publishable queue path. | Kept. |
| Social inbox intents | No | `scripts/social/lib/inbox.mjs:69` checked only that `media`, when present, was an array. | 1 of 2 open intents has an empty media array. | Fixed in `validate:content` at `scripts/validate-content.mjs:1236-1251`; the existing intent is a stable-key legacy gap. |
| Merch catalogue rows | No blocking publication gate | `packages/content/src/schema.ts:182` makes `imageUrl` optional; liveness tooling can later drop an image. | 2 of 320 rows have no image. | Fixed in `validate:content` at `scripts/validate-content.mjs:1253-1265`; both existing rows are stable-key legacy gaps. |

## Host and fallback audit

Before this change, YouTube's `i.ytimg.com` and `img.youtube.com` were already allowlisted, but the resolver never derived a thumbnail from an official video URL. Taylor's official `taylorswift.com`/`store.taylorswift.com` pages and the official store's `cdn.shopify.com` images were missing. Established-source coverage also missed publisher or image hosts for Stereogum, The Guardian, BBC, The New York Times, Entertainment Tonight, Elle, Harper's Bazaar, The Tennessean, The Kansas City Star, Pitchfork, NBC News, Reuters, and Snopes. Because Shopify's CDN is multi-tenant, its allowlist entry now requires the official store path `/s/files/1/0011/4651/9637/`; another store on the same host is rejected.

`packages/shared/src/current-item-quality.ts:27-130` now owns the complete live-feed list, and `apps/worker/src/extract/image-resolve.ts` consumes the same predicate. This avoids the earlier write/read allowlist drift. The new fallback hotlinks the official YouTube thumbnail or trusted page metadata image; it does not download, transform, or rehost media. That is within `docs/social/guardrails.md` guardrail 2, and preserves source URLs for takedown handling.

## Legacy ratchet

`scripts/lib/moment-media-gate.mjs:18-111` stores 120 stable keys: 117 non-moment records, one inbox intent, and two merch rows. A grandfathered row remains exempt when its text changes or it gains media, preventing routine content edits from failing on pre-existing gaps. A new key without media and a key that no longer matches any gated row remain blocking; new exemptions must not be added by content-only work. The separate moment exemption table is empty, so no moment behavior changed.
