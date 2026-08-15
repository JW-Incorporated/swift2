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
  it('groups every real shopTheLook product exactly once — counts sum to 156', () => {
    const groups = merchByEra();
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(MERCH_CATALOGUE.shopTheLook.length);
    expect(total).toBe(156);
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
  it('resolves the real catalogue split by execution — 150 photo, 6 monogram', () => {
    let photo = 0;
    let monogram = 0;
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const image = merchItemImage(item);
      if (image.kind === 'photo') photo += 1;
      else monogram += 1;
    }
    expect(photo).toBe(150);
    expect(monogram).toBe(6);
    expect(photo + monogram).toBe(156);
  });

  it('never returns the era-art fallback path for a photo', () => {
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const image = merchItemImage(item);
      if (image.kind === 'photo') {
        expect(image.url.startsWith('/eras/')).toBe(false);
      }
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
