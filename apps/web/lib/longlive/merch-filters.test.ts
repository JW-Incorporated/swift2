import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';
import { getContentItem } from './content';
import { MERCH_CATALOGUE, type MerchItem } from './merch';
import {
  merchByEra,
  merchItemImage,
  merchMatchesFilter,
  parsePrice,
  type MerchFilterId,
} from './merch-filters';

describe('merchByEra', () => {
  it('groups every retained shopTheLook product exactly once after the E3 audit', () => {
    const groups = merchByEra();
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(MERCH_CATALOGUE.shopTheLook.length);
    // 159 -> 128 (issue #722, 2026-08-24): removing ~29 thin, single-source
    // fashion/wardrobe timeline cards from the founding eras also removed
    // their `products` entries — a real, intended composition shift.
    // 133 -> 108 (E3, 2026-08-30): vision audit removed 25 mismatches and
    // recorded each one for re-sourcing instead of presenting a false match.
    expect(total).toBe(108);
    // count is precomputed as items.length, per the contract
    for (const g of groups) expect(g.count).toBe(g.items.length);
  });

  it('orders era sections newest-first (ERAS itself is oldest-first)', () => {
    const groups = merchByEra();
    const reverseEraOrder = [...ERAS].reverse().map((e) => e.id);
    const groupEraIds = groups.map((g) => g.eraId);
    // groupEraIds must be a subsequence of reverseEraOrder in the same relative order
    let cursor = 0;
    for (const id of groupEraIds) {
      const idx = reverseEraOrder.indexOf(id, cursor);
      expect(idx).toBeGreaterThanOrEqual(cursor);
      cursor = idx + 1;
    }
  });

  it('sorts items within an era by source moment date, newest first', () => {
    const groups = merchByEra();
    for (const group of groups) {
      const dates = group.items.map((item) => getContentItem(item.source!.momentId)?.date ?? '');
      const sorted = [...dates].sort((a, b) => b.localeCompare(a));
      expect(dates).toEqual(sorted);
    }
  });

  it('never returns an empty group', () => {
    for (const group of merchByEra()) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('works over a filtered subset, not just the full catalogue', () => {
    const subset = MERCH_CATALOGUE.shopTheLook.slice(0, 5);
    const groups = merchByEra(subset);
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(subset.length);
  });
});

describe('merchItemImage', () => {
  it('prefers the real product photo (imageUrl) when present', () => {
    const withImage: MerchItem = {
      brand: 'Test',
      item: 'Test Item',
      retailer: 'test.com',
      url: 'https://test.com/item',
      category: 'shop-the-look',
      imageUrl: 'https://cdn.shopify.com/test.jpg',
    };
    expect(merchItemImage(withImage)).toEqual({ kind: 'product', url: 'https://cdn.shopify.com/test.jpg' });
  });

  it('resolves the real catalogue split by execution — every item is split, product, moment, or monogram', () => {
    let split = 0;
    let product = 0;
    let moment = 0;
    let monogram = 0;
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const image = merchItemImage(item);
      if (image.kind === 'split') split += 1;
      else if (image.kind === 'product') product += 1;
      else if (image.kind === 'moment') moment += 1;
      else monogram += 1;
    }
    // 95/58 -> 74/48 (issue #722, 2026-08-24): removing ~29 thin,
    // single-source fashion/wardrobe timeline cards from the founding eras
    // also removed their `products` entries — a real, intended composition
    // shift; product and monogram counts are unaffected.
    // 74/2/48/4 -> 74/2/50/7 (issue #884, 2026-08-25): Stylist pass added 5
    // verified moment.products entries — 2 on moments with a real primary
    // photo (moment) and 3 on a moment with only a reference/stand-in photo
    // (monogram, since item.imageUrl isn't set on any of them).
    // 50/7 -> 51/6 (issue #1721, 2026-08-25): a photo-sparsity pass gave a
    // previously zero-photo moment (unrelated to the #884 additions above)
    // its first real photo, so its shop-the-look product's image now
    // resolves via the moment fallback instead of the blank monogram
    // placeholder.
    expect(split).toBe(49);
    expect(product).toBe(2);
    expect(moment).toBe(51);
    expect(monogram).toBe(6);
    expect(split + product + moment + monogram).toBe(108);
  });

  it('never returns the era-art fallback path for a product or moment photo', () => {
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const image = merchItemImage(item);
      if (image.kind === 'product' || image.kind === 'moment') {
        expect(image.url.startsWith('/eras/')).toBe(false);
      } else if (image.kind === 'split') {
        expect(image.productUrl.startsWith('/eras/')).toBe(false);
        expect(image.momentUrl.startsWith('/eras/')).toBe(false);
      }
    }
  });

  it('returns split with both real urls when the product and moment photos both exist', () => {
    const item = MERCH_CATALOGUE.shopTheLook.find((i) => merchItemImage(i).kind === 'split');
    expect(item).toBeDefined();
    const image = merchItemImage(item!);
    expect(image.kind).toBe('split');
    if (image.kind === 'split') {
      expect(image.productUrl.length).toBeGreaterThan(0);
      expect(image.momentUrl.length).toBeGreaterThan(0);
    }
  });
});

describe('parsePrice', () => {
  it('parses a plain price string', () => {
    expect(parsePrice('$85.00')).toBe(85);
  });

  it('parses a comma-formatted price', () => {
    expect(parsePrice('$1,200.00')).toBe(1200);
  });

  it('parses a foreign-currency-prefixed price by its numeric literal', () => {
    expect(parsePrice('AU$90.00')).toBe(90);
    expect(parsePrice('£1,690.00')).toBe(1690);
  });

  it('returns undefined for missing/unparseable price', () => {
    expect(parsePrice(undefined)).toBeUndefined();
    expect(parsePrice('')).toBeUndefined();
  });
});

describe('merchMatchesFilter', () => {
  const base: MerchItem = {
    brand: 'Test',
    item: 'Test Item',
    retailer: 'test.com',
    url: 'https://test.com/item',
    category: 'shop-the-look',
  };

  it('empty filter set matches everything', () => {
    expect(merchMatchesFilter(base, new Set())).toBe(true);
  });

  it('inStock filter excludes sold-out items', () => {
    const soldOut = { ...base, inStock: false };
    const active = new Set<MerchFilterId>(['inStock']);
    expect(merchMatchesFilter(soldOut, active)).toBe(false);
    expect(merchMatchesFilter({ ...base, inStock: true }, active)).toBe(true);
    expect(merchMatchesFilter(base, active)).toBe(true); // undefined = purchasable
  });

  it('inStock filter passes an item with unknown stock (inStock undefined) — deliberate asymmetry with price, see comment in merch-filters.ts', () => {
    const unknownStock = { ...base, inStock: undefined };
    const active = new Set<MerchFilterId>(['inStock']);
    expect(merchMatchesFilter(unknownStock, active)).toBe(true);
  });

  it('exactPiece filter excludes isAlternative items', () => {
    const alt = { ...base, isAlternative: true };
    const active = new Set<MerchFilterId>(['exactPiece']);
    expect(merchMatchesFilter(alt, active)).toBe(false);
    expect(merchMatchesFilter(base, active)).toBe(true);
  });

  it('price bands OR within the price dimension', () => {
    const cheap = { ...base, price: '$20.00' };
    const mid = { ...base, price: '$100.00' };
    const pricey = { ...base, price: '$500.00' };
    const active = new Set<MerchFilterId>(['under50', '200plus']);
    expect(merchMatchesFilter(cheap, active)).toBe(true);
    expect(merchMatchesFilter(mid, active)).toBe(false);
    expect(merchMatchesFilter(pricey, active)).toBe(true);
  });

  it('dimensions AND together', () => {
    const soldOutCheap = { ...base, inStock: false, price: '$20.00' };
    const active = new Set<MerchFilterId>(['inStock', 'under50']);
    expect(merchMatchesFilter(soldOutCheap, active)).toBe(false);
    expect(merchMatchesFilter({ ...base, price: '$20.00' }, active)).toBe(true);
  });

  it('an item with no parseable price never matches an active price filter', () => {
    const active = new Set<MerchFilterId>(['under50']);
    expect(merchMatchesFilter(base, active)).toBe(false);
  });
});
