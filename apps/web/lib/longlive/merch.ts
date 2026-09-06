/**
 * Long Live — the Marketplace section's data (item 4a,
 * docs/definition-of-done.md:126-135).
 *
 * Aggregates three sources into one catalogue:
 *   1. shopTheLook — the existing "shop the look" `Product`s already attached
 *      to fashion moments in `content-vault.generated.ts` (via `CONTENT`),
 *      the same products rendered as "Shop the look" in MomentDetail. Never
 *      re-authored here — read straight off `CONTENT`, so this file cannot
 *      drift from the moment data.
 *   2. officialStore — Taylor's official store (store.taylorswift.com),
 *      sourced from the checked-in, engine-authored
 *      `supabase/seed/merch/official.mjs` (`OFFICIAL`). Direct official-store
 *      URLs and verified Amazon secondary listings only (D1-a) — see
 *      merch.test.ts for the source proof.
 *   3. fanMade — curated fan-made items, sourced from the checked-in,
 *      evidence-backed `supabase/seed/merch/fanmade.mjs` (`FAN_MADE`). Each
 *      row is independently evidenced per the E5 evidence workflow; see
 *      merch.test.ts for the source proof.
 *
 * Cross-navigation (item 4a): every shopTheLook item carries a `source`
 * back-reference to the era/moment it came from, because `CONTENT` has that
 * data. officialStore/fanMade items would carry the same `source` field IF
 * curated with a moment link — the shape supports it, nothing here invents it.
 */

import { CONTENT } from './content';
import { hasRealPrimaryImage, primaryImage, type EraId, type Product } from '@swift2/experience';
// Generated from supabase/seed/merch/{official,fanmade}.mjs by
// scripts/sync-longlive-merch.mjs (Fable 5.1 architecture review, R11) — the
// same generated-file pattern as the other vault modules in this directory.
// Do not import supabase/seed/** directly from app code; regenerate instead
// (`npm run sync:content` / `npm run check:generated`).
import { OFFICIAL, FAN_MADE } from './merch.generated';

export type MerchCategory = 'shop-the-look' | 'official-store' | 'fan-made';

/** Where a merch item came from, when it's tied to a specific era/moment. */
export interface MerchSource {
  eraId: EraId;
  /** ContentItem.id — the moment's stable id. */
  momentId: string;
  /** ContentItem.slug, when the moment has one — for deep-linking back. */
  momentSlug?: string;
  momentTitle: string;
}

export interface MerchItem extends Product {
  category: MerchCategory;
  /** Back-reference to the era/moment this item shops, when known. */
  source?: MerchSource;
  /** Provenance supplied by the catalogue engines for fresh-drop ordering. */
  discoveredAt?: string;
  /**
   * True when this item has no product photo of its own (`imageUrl` unset)
   * AND an earlier product — from the SAME source moment (fix/merch-image-
   * buy-link, PR #3569) or, as of kanban task t_cfd48d66, a DIFFERENT
   * moment that cites the identical underlying photo URL — already claimed
   * that photo as its card image. Without this flag, 2+ different products
   * matched to one moment (e.g. dress/shoes/clutch all "seen on" the same
   * photo of Taylor), or two unrelated moments whose content happens to
   * cite the same wire photo, would each independently render that
   * identical photo — reading as duplicate cards of the same item (founder
   * feedback, kanban tasks t_49a63ae1 and t_cfd48d66). The E6 matcher
   * output carries no per-item "as-worn" photo today
   * (`scripts/merch-engine/match-moments.mjs` has no such field), so there
   * is no real alternate photo to substitute — `merchItemImage()`
   * (merch-filters.ts) falls back to the honest monogram tile for every
   * item after the first, rather than repeat the photo or fabricate a
   * substitute. Set once, deterministically, in `shopTheLookItemsFrom()`
   * below, in CONTENT's own order — never recomputed per filtered/paginated
   * view.
   *
   * KNOWN, ACCEPTED TRADE-OFF (inherited unchanged from PR #3569, not new
   * here): because the flag is computed once over the FULL catalogue, a
   * filter/pagination view that hides the claiming (earlier) card can
   * leave the later card demoted to a monogram even though its own claimant
   * is no longer visible in that view. This mirrors the original within-
   * moment case exactly (a filter could already hide one product from a
   * moment while showing another) — the fix here extends the SAME accepted
   * behavior across moment boundaries rather than introducing a new one.
   * Recomputing per rendered view would require moving this logic into the
   * filtered/paginated render path (a hook, not this static catalogue
   * builder) — a larger, separately-scoped change; the review record for
   * this call is documented in kanban task t_cfd48d66.
   */
  demoteSharedMomentPhoto?: boolean;
}

export interface MerchCatalogue {
  shopTheLook: readonly MerchItem[];
  officialStore: readonly MerchItem[];
  fanMade: readonly MerchItem[];
}

/**
 * Minimal shape shopTheLookItemsFrom() needs from a moment — deliberately
 * NOT the full ContentItem, so this can be exercised directly with tiny
 * fixtures in tests (no need to fabricate a whole real moment's worth of
 * required fields, and no risk of the fixture accidentally matching a real
 * production moment's shape).
 */
export interface MomentPhotoInput {
  id: string;
  eraId: EraId;
  slug?: string;
  title: string;
  /** The moment's real primary photo URL, or undefined if it has none
   *  (mirrors `hasRealPrimaryImage(moment) ? primaryImage(moment) : undefined`). */
  momentPhotoUrl: string | undefined;
  products: readonly Product[];
}

/**
 * The claim-and-demote core of shopTheLookItems(), extracted so it can be
 * unit-tested directly against small fixtures rather than only indirectly
 * through the real (718-moment) production CONTENT vault — see
 * merch.test.ts's "demotes a product whose moment photo is claimed by an
 * EARLIER SPLIT CARD from a different moment" test, which exercises the
 * exact split-card-claims-first scenario that caused kanban task
 * t_cfd48d66: a product's own imageUrl produces a 'split' card
 * (merchItemImage()) whose moment half still renders the shared photo, so
 * it must count as a claim even though the product itself is never demoted.
 */
export function shopTheLookItemsFrom(moments: readonly MomentPhotoInput[]): MerchItem[] {
  const items: MerchItem[] = [];
  // Claimed moment-photo URLs, tracked GLOBALLY across every moment in this
  // one pass — not reset per moment. A per-moment scope only caught 2+
  // products repeating one moment's photo; it missed two DIFFERENT moments
  // whose `images` happen to cite the identical underlying photo URL (e.g.
  // the same wire photo synced into two separate moments), which still
  // rendered as consecutive duplicate cards in the "Seen on Taylor" rail
  // (founder screenshot, kanban task t_cfd48d66). Keying by the actual
  // photo URL rather than momentId is what makes this catch that case: two
  // distinct moments sharing a URL collide on the same Set entry. This is
  // deliberately NOT global across the whole page — a moment's own photo
  // still renders normally as that moment's hero everywhere else; only its
  // reuse as a SECOND shop-the-look product card image is demoted.
  const claimedMomentPhotoUrls = new Set<string>();
  for (const moment of moments) {
    const momentPhotoUrl = moment.momentPhotoUrl;
    for (const product of moment.products ?? []) {
      // Whether THIS product's card would put the moment photo on screen at
      // all — either alone (merchItemImage()'s 'moment' kind, no product
      // photo of its own) or alongside its own product photo ('split' kind,
      // the moment half still visibly labelled). Both cases show the same
      // pixels to the reader, so both count as "claiming" that photo for
      // dedupe purposes — a 'split' card upstream is exactly what let the
      // Grammy-2016 haircut moment repeat its wardrobe moment's photo
      // (kanban task t_cfd48d66): the wardrobe product had its own image
      // (rendered split, silently claiming nothing under the old check),
      // so the haircut product's identical URL read as unclaimed and
      // rendered again full-width right next to it.
      const wouldRenderMomentPhoto = momentPhotoUrl !== undefined;
      const alreadyClaimed = wouldRenderMomentPhoto && claimedMomentPhotoUrls.has(momentPhotoUrl!);
      // Demotion (falling back to the monogram tile) is only possible for a
      // product with NO photo of its own — merchItemImage() has no "split
      // with the moment half suppressed" layout, so a product that has its
      // own imageUrl always renders its split card regardless of claim
      // state; it just also marks the URL claimed for whoever comes next.
      const demoteSharedMomentPhoto = alreadyClaimed && !product.imageUrl;
      if (wouldRenderMomentPhoto && !alreadyClaimed) {
        claimedMomentPhotoUrls.add(momentPhotoUrl!);
      }
      items.push({
        ...product,
        category: 'shop-the-look',
        source: {
          eraId: moment.eraId,
          momentId: moment.id,
          momentSlug: moment.slug,
          momentTitle: moment.title,
        },
        ...(demoteSharedMomentPhoto ? { demoteSharedMomentPhoto: true } : {}),
      });
    }
  }
  return items;
}

function shopTheLookItems(): MerchItem[] {
  return shopTheLookItemsFrom(
    CONTENT.map((moment) => ({
      id: moment.id,
      eraId: moment.eraId,
      slug: moment.slug,
      title: moment.title,
      momentPhotoUrl: hasRealPrimaryImage(moment) ? primaryImage(moment) : undefined,
      products: moment.products ?? [],
    })),
  );
}

const MERCH_KINDS: ReadonlySet<NonNullable<Product['kind']>> = new Set([
  'dress',
  'top',
  'bottom',
  'outerwear',
  'knitwear',
  'shoes',
  'jewelry',
  'bag',
  'hat',
  'eyewear',
  'beauty',
  'accessory',
  'music',
  'collectible',
  'home',
  'other',
]);

type SeedProduct = Omit<Product, 'kind'> & { kind?: string; discoveredAt?: string };

function catalogueItems(items: readonly SeedProduct[], category: MerchCategory): MerchItem[] {
  return items.map(({ kind, ...item }) => ({
    ...item,
    category,
    ...(kind
      ? {
          kind: MERCH_KINDS.has(kind as NonNullable<Product['kind']>)
            ? (kind as NonNullable<Product['kind']>)
            : 'other',
        }
      : {}),
  }));
}

/** A listing is new only while its authored discovery timestamp is within 14 days. */
export function newDrops(items: readonly MerchItem[], now = new Date()): readonly MerchItem[] {
  const cutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  return items
    .filter((item) => {
      if (!item.discoveredAt) return false;
      const discoveredAt = Date.parse(item.discoveredAt);
      return (
        Number.isFinite(discoveredAt) && discoveredAt >= cutoff && discoveredAt <= now.getTime()
      );
    })
    .sort((a, b) => Date.parse(b.discoveredAt!) - Date.parse(a.discoveredAt!));
}

/** Product schema is emitted only for facts available in the static catalogue. */
export function merchProductJsonLd(item: MerchItem, now = new Date()): Record<string, unknown> {
  const verifiedAt = item.verifiedAt ? Date.parse(item.verifiedAt) : Number.NaN;
  const freshVerification =
    Number.isFinite(verifiedAt) &&
    verifiedAt <= now.getTime() &&
    now.getTime() - verifiedAt <= 7 * 24 * 60 * 60 * 1000;
  const offer =
    freshVerification && item.price && item.inStock !== undefined
      ? {
          '@type': 'Offer',
          price: item.price.replace(/[^0-9.]/g, ''),
          priceCurrency: 'USD',
          availability: `https://schema.org/${item.inStock ? 'InStock' : 'OutOfStock'}`,
          url: item.url,
        }
      : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.item,
    brand: { '@type': 'Brand', name: item.brand },
    ...(item.imageUrl ? { image: item.imageUrl } : {}),
    ...(offer ? { offers: offer } : {}),
  };
}

/**
 * The full Marketplace catalogue, assembled only from authored engine output.
 */
export const MERCH_CATALOGUE: MerchCatalogue = {
  shopTheLook: shopTheLookItems(),
  officialStore: catalogueItems(OFFICIAL, 'official-store'),
  fanMade: catalogueItems(FAN_MADE, 'fan-made'),
};
