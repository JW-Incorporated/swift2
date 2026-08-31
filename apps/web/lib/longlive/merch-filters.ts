/**
 * Long Live — Merch pane organisation (PLAN.md 2026-08-14 steps 4-5):
 * grouping `shopTheLook` products into era sections, newest era first, plus
 * the pane's own filters (in-stock / exact-piece / price band).
 *
 * No garment-type filter here on purpose — there is no `kind` field on
 * `Product`, and inferring type from item names misfiles things (e.g. "Flat
 * Iron Hair Straightener" is not apparel). `kind?` is a content authoring
 * task that would unlock it; not this file's job to guess it.
 */

import { ERAS } from './eras';
import { getContentItem } from './content';
import { hasRealPrimaryImage, primaryImage, type EraId, type Product } from './types';
import { MERCH_CATALOGUE, type MerchItem } from './merch';

export interface MerchEraGroup {
  eraId: EraId;
  eraLabel: string; // the era's short display name
  count: number; // items.length, precomputed for the jump chips
  items: readonly MerchItem[];
}

/**
 * Groups merch items into era sections, newest era first (ERAS itself is
 * oldest-first — see eras.ts — so this mirrors EraGrid's `[...ERAS].reverse()`
 * display order). Within an era, items sort by their source moment's date,
 * newest first. Optional `items` lets this run over either the full
 * catalogue or an already-filtered subset — same shape either way, so a
 * caller can diff "matches" against "total" per era (see MerchSection's
 * `N of M match` header). An era with zero items in the given set is simply
 * absent from the result; the caller decides whether that means "hide" (full
 * catalogue — genuinely nothing from that era) or "0 of N match" (filtered
 * subset — the caller still has the full-catalogue group to report N from).
 */
export function merchByEra(
  items: readonly MerchItem[] = MERCH_CATALOGUE.shopTheLook,
): readonly MerchEraGroup[] {
  const byEra = new Map<EraId, MerchItem[]>();
  for (const item of items) {
    if (!item.source) continue;
    const list = byEra.get(item.source.eraId) ?? [];
    list.push(item);
    byEra.set(item.source.eraId, list);
  }

  const momentDate = (item: MerchItem): string => getContentItem(item.source!.momentId)?.date ?? '';

  const groups: MerchEraGroup[] = [];
  for (const era of [...ERAS].reverse()) {
    const eraItems = byEra.get(era.id);
    if (!eraItems || eraItems.length === 0) continue;
    const sorted = [...eraItems].sort((a, b) => momentDate(b).localeCompare(momentDate(a)));
    groups.push({ eraId: era.id, eraLabel: era.shortName, count: sorted.length, items: sorted });
  }
  return groups;
}

/** The Merch pane's own filter chips — in the FilterBar visual language (solid-fill = active). */
export type MerchFilterId = 'inStock' | 'exactPiece' | 'under50' | '50to200' | '200plus';

export const ALL_MERCH_FILTERS: readonly MerchFilterId[] = [
  'inStock',
  'exactPiece',
  'under50',
  '50to200',
  '200plus',
];

export const MERCH_FILTER_LABEL: Record<MerchFilterId, string> = {
  inStock: 'In stock',
  exactPiece: 'The exact piece',
  under50: 'Under $50',
  '50to200': '$50–200',
  '200plus': '$200+',
};

export const MERCH_KIND_LABEL: Record<NonNullable<Product['kind']>, string> = {
  dress: 'Dresses',
  top: 'Tops',
  bottom: 'Bottoms',
  outerwear: 'Outerwear',
  knitwear: 'Knitwear',
  shoes: 'Shoes',
  jewelry: 'Jewelry',
  bag: 'Bags',
  hat: 'Hats',
  eyewear: 'Eyewear',
  beauty: 'Beauty',
  accessory: 'Accessories',
  music: 'Music',
  collectible: 'Collectibles',
  home: 'Home',
  other: 'Other',
};

export function merchKinds(items: readonly MerchItem[]): readonly NonNullable<Product['kind']>[] {
  return [...new Set(items.flatMap((item) => (item.kind ? [item.kind] : [])))];
}

type MerchFilterDimension = 'stock' | 'exact' | 'price';

const MERCH_FILTER_DIMENSION: Record<MerchFilterId, MerchFilterDimension> = {
  inStock: 'stock',
  exactPiece: 'exact',
  under50: 'price',
  '50to200': 'price',
  '200plus': 'price',
};

/**
 * Parses an authored price string (e.g. "$319.99", "$1,200.00") to a plain
 * number for banding. Strips any currency symbol/comma; a handful of items
 * are authored in AU$/£ (see supabase/seed/content) — this reads their
 * numeric literal regardless of currency, which is a deliberate
 * simplification, not a conversion.
 */
export function parsePrice(price: string | undefined): number | undefined {
  if (!price) return undefined;
  const n = Number(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && price.replace(/[^0-9.]/g, '') !== '' ? n : undefined;
}

function priceBandOf(price: number | undefined): MerchFilterId | undefined {
  if (price === undefined) return undefined;
  if (price < 50) return 'under50';
  if (price <= 200) return '50to200';
  return '200plus';
}

/**
 * Does this item satisfy the active filter set? AND across dimensions
 * (stock / exact-piece / price band), OR within one (picking multiple price
 * bands matches items in ANY of them). Empty set = show everything. An item
 * with no parseable price never matches an active price-band filter — it
 * can't be placed in one honestly.
 */
export function merchMatchesFilter(item: MerchItem, active: ReadonlySet<MerchFilterId>): boolean {
  if (active.size === 0) return true;

  const activeByDimension = new Map<MerchFilterDimension, MerchFilterId[]>();
  for (const id of active) {
    const dim = MERCH_FILTER_DIMENSION[id];
    const list = activeByDimension.get(dim) ?? [];
    list.push(id);
    activeByDimension.set(dim, list);
  }

  for (const [dim, ids] of activeByDimension) {
    if (dim === 'stock') {
      // Deliberately asymmetric with the price band below: an unpriceable
      // item is EXCLUDED from an active price filter (can't place it
      // honestly), but an item with unknown stock (`inStock === undefined`)
      // PASSES the in-stock filter rather than being excluded. Hiding
      // everything we can't confirm in stock would silently shrink the
      // catalogue as data quality degrades — worse than occasionally
      // showing a since-sold-out item. Only an explicit `false` excludes.
      if (item.inStock === false) return false;
    } else if (dim === 'exact') {
      if (item.isAlternative === true) return false;
    } else {
      const band = priceBandOf(parsePrice(item.price));
      if (!band || !ids.includes(band)) return false;
    }
  }
  return true;
}

/** What a merch card should show as its image(s), decided from which of the
 * two possible real photos actually exist:
 * 1. `split` — both a real product photo (`Product.imageUrl`) AND the source
 *    moment's real primary photo exist. The card renders both side by side;
 *    the moment half must be visibly labelled (2026-08-15, docs/decisions.md)
 *    since it's a picture of Taylor wearing the look, not the product itself.
 *    Per D7=C (2026-08-31, kanban t_28e3ad2a/t_c71f0eea), MerchCard.tsx now
 *    makes this half a buy link too — that's a rendering decision made by
 *    the caller, not this function; this type only says which photo(s) exist.
 * 2. `product` — only the product photo exists. Never labelled — this is the
 *    honest single-image case.
 * 3. `moment` — only the moment's photo exists. This is a picture of Taylor
 *    wearing the look, NOT the product, so the UI must visibly label it
 *    (2026-08-15, docs/decisions.md) rather than let it pass as a product
 *    shot. A split card with an empty half reads as broken, so this is a
 *    single full-width image, not a half card next to a monogram. Per D7=C,
 *    MerchCard.tsx now also makes this tile a buy link (label stays visible).
 * 4. `monogram` — neither exists.
 * The moment photo is resolved via `hasRealPrimaryImage()` — never by
 * checking `images.length`, which is always non-empty and proves nothing
 * (see types.ts's own warning). Never returns the era-art stand-in: a
 * picture that isn't the item reads as the item. */
export type MerchImage =
  | { kind: 'split'; productUrl: string; momentUrl: string }
  | { kind: 'product'; url: string }
  | { kind: 'moment'; url: string }
  | { kind: 'monogram' };

export function merchItemImage(item: MerchItem): MerchImage {
  const moment = item.source ? getContentItem(item.source.momentId) : undefined;
  const momentUrl = moment && hasRealPrimaryImage(moment) ? primaryImage(moment) : undefined;
  if (item.imageUrl && momentUrl) return { kind: 'split', productUrl: item.imageUrl, momentUrl };
  if (item.imageUrl) return { kind: 'product', url: item.imageUrl };
  // demoteSharedMomentPhoto (set in merch.ts's shopTheLookItems()) means an
  // earlier product from this same moment already claimed momentUrl as its
  // card photo — rendering it again here would be the exact "3 identical
  // Taylor photos" bug this flag exists to stop (2026-08-31, kanban task
  // t_49a63ae1). No per-item "as-worn" alternate photo exists in the E6
  // matcher output today and this item has no imageUrl of its own, so the
  // only honest fallback is the monogram tile, not a repeated or fabricated
  // photo.
  if (momentUrl && !item.demoteSharedMomentPhoto) return { kind: 'moment', url: momentUrl };
  return { kind: 'monogram' };
}
