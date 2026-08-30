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
 *   2. officialStore — Taylor's official store (store.taylorswift.com). No
 *      curated product catalogue exists yet: the only mentions of the store
 *      in the content vault are single citation URLs on individual sourced
 *      products, not a real product list. Genuinely empty until that data
 *      exists — see the report in the Step 1 PR/handoff notes.
 *   3. fanMade — curated fan-made items. No data exists yet (item 4a's own
 *      "fan-made curation bar" open question is unresolved). Genuinely empty.
 *
 * Cross-navigation (item 4a): every shopTheLook item carries a `source`
 * back-reference to the era/moment it came from, because `CONTENT` has that
 * data. officialStore/fanMade items would carry the same `source` field IF
 * curated with a moment link — the shape supports it, nothing here invents it.
 */

import { CONTENT } from './content';
import type { EraId, Product } from './types';
// Authored engine output remains JavaScript so sync scripts can write it directly.
import { OFFICIAL } from '../../../../supabase/seed/merch/official.mjs';
import { FAN_MADE } from '../../../../supabase/seed/merch/fanmade.mjs';

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
}

export interface MerchCatalogue {
  shopTheLook: readonly MerchItem[];
  officialStore: readonly MerchItem[];
  fanMade: readonly MerchItem[];
}

function shopTheLookItems(): MerchItem[] {
  const items: MerchItem[] = [];
  for (const moment of CONTENT) {
    for (const product of moment.products ?? []) {
      items.push({
        ...product,
        category: 'shop-the-look',
        source: {
          eraId: moment.eraId,
          momentId: moment.id,
          momentSlug: moment.slug,
          momentTitle: moment.title,
        },
      });
    }
  }
  return items;
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
