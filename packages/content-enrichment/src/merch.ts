import {
  hasRealPrimaryImage,
  primaryImage,
  type ContentItem,
  type EraId,
  type Product,
} from '@swift2/experience';

/**
 * Long Live — the Marketplace section's catalogue-construction logic.
 * Moved out of `apps/web/lib/longlive/merch.ts` in OS-014b-1
 * (docs/proposals/2026-09-vault-read-path.md) so `scripts/build-content-
 * bundle.mjs` can call this logic with zero `apps/web` dependency.
 * `apps/web/lib/longlive/merch.ts` re-exports this unchanged for its
 * existing callers/tests. Raw catalogue data (`CONTENT`, `OFFICIAL`,
 * `FAN_MADE`) is NOT owned here — every function below takes it as a plain
 * argument.
 *
 * Aggregates three sources into one catalogue:
 *   1. shopTheLook — "shop the look" `Product`s already attached to fashion
 *      moments in the content corpus.
 *   2. officialStore — Taylor's official store (store.taylorswift.com).
 *   3. fanMade — curated fan-made items.
 */

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
   * matched to one moment, or two unrelated moments whose content happens
   * to cite the same wire photo, would each independently render that
   * identical photo — reading as duplicate cards of the same item.
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
  // one pass — not reset per moment. Keying by the actual photo URL rather
  // than momentId is what makes this catch two DIFFERENT moments sharing a
  // URL — they collide on the same Set entry.
  const claimedMomentPhotoUrls = new Set<string>();
  for (const moment of moments) {
    const momentPhotoUrl = moment.momentPhotoUrl;
    for (const product of moment.products ?? []) {
      const wouldRenderMomentPhoto = momentPhotoUrl !== undefined;
      const alreadyClaimed = wouldRenderMomentPhoto && claimedMomentPhotoUrls.has(momentPhotoUrl!);
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

/**
 * Minimal shape shopTheLookItems() needs from a moment: the full
 * `ContentItem`, since `hasRealPrimaryImage`/`primaryImage` require it.
 */
function shopTheLookItems(moments: readonly ContentItem[]): MerchItem[] {
  return shopTheLookItemsFrom(
    moments.map((moment) => ({
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

export type SeedProduct = Omit<Product, 'kind'> & { kind?: string; discoveredAt?: string };

export function catalogueItems(items: readonly SeedProduct[], category: MerchCategory): MerchItem[] {
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
 * Assembles the full Marketplace catalogue from the three raw sources.
 * Exported for the bundle builder and for unit tests; `apps/web/lib/
 * longlive/merch.ts` calls this with its own `CONTENT`/`OFFICIAL`/
 * `FAN_MADE` to produce the same `MERCH_CATALOGUE` constant it exported
 * before this extraction.
 */
export function buildMerchCatalogue(
  shopTheLookMoments: readonly ContentItem[],
  official: readonly SeedProduct[],
  fanMade: readonly SeedProduct[],
): MerchCatalogue {
  return {
    shopTheLook: shopTheLookItems(shopTheLookMoments),
    officialStore: catalogueItems(official, 'official-store'),
    fanMade: catalogueItems(fanMade, 'fan-made'),
  };
}
