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

/**
 * The full Marketplace catalogue. `officialStore` and `fanMade` are
 * genuinely empty until real curated data exists for them — never filled
 * with placeholders.
 */
export const MERCH_CATALOGUE: MerchCatalogue = {
  shopTheLook: shopTheLookItems(),
  officialStore: [],
  fanMade: [],
};
