import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';
import { MERCH_CATALOGUE, merchProductJsonLd, newDrops, type MerchItem } from './merch';

describe('MERCH_CATALOGUE.shopTheLook', () => {
  it('has the real product count from CONTENT — asserted exactly so drift fails loudly', () => {
    const expected = CONTENT.reduce((sum, moment) => sum + (moment.products?.length ?? 0), 0);
    expect(MERCH_CATALOGUE.shopTheLook.length).toBe(expected);
    expect(MERCH_CATALOGUE.shopTheLook.length).toBeGreaterThan(0);
  });

  it('every item is tagged shop-the-look', () => {
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      expect(item.category).toBe('shop-the-look');
    }
  });

  it('every item carries a back-reference to the moment/era it came from', () => {
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      expect(item.source).toBeDefined();
      expect(item.source?.eraId).toBeTruthy();
      expect(item.source?.momentId).toBeTruthy();
      expect(item.source?.momentTitle).toBeTruthy();
    }
  });

  it('the back-reference resolves to a real CONTENT moment', () => {
    const ids = new Set(CONTENT.map((c) => c.id));
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      expect(ids.has(item.source!.momentId)).toBe(true);
    }
  });

  it('never invents a product — every product URL traces back to a real CONTENT moment', () => {
    const byMoment = new Map(CONTENT.map((c) => [c.id, c.products ?? []]));
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const momentProducts = byMoment.get(item.source!.momentId) ?? [];
      expect(momentProducts.some((p) => p.url === item.url)).toBe(true);
    }
  });
});

describe('MERCH_CATALOGUE buckets', () => {
  it('reads official and fan-made buckets from their authored engine output', () => {
    expect(MERCH_CATALOGUE.officialStore.length).toBeGreaterThan(0);
    for (const item of MERCH_CATALOGUE.officialStore) expect(item.category).toBe('official-store');
    for (const item of MERCH_CATALOGUE.fanMade) expect(item.category).toBe('fan-made');
  });
});

describe('newDrops', () => {
  const base: MerchItem = {
    brand: 'Test',
    item: 'Test Item',
    retailer: 'test.com',
    url: 'https://test.com/item',
    category: 'official-store',
  };
  const now = new Date('2026-08-30T12:00:00Z');

  it('includes only authored discoveries from the prior 14 days, newest first', () => {
    const items = [
      { ...base, item: 'Old', discoveredAt: '2026-08-15T11:59:59Z' },
      { ...base, item: 'Earlier', discoveredAt: '2026-08-20T12:00:00Z' },
      { ...base, item: 'Newest', discoveredAt: '2026-08-29T12:00:00Z' },
      { ...base, item: 'Future', discoveredAt: '2026-09-01T12:00:00Z' },
    ];
    expect(newDrops(items, now).map((item) => item.item)).toEqual(['Newest', 'Earlier']);
  });
});

describe('merchProductJsonLd', () => {
  const base: MerchItem = {
    brand: 'Test',
    item: 'Test Item',
    retailer: 'test.com',
    url: 'https://test.com/item',
    category: 'official-store',
    price: '$20.00',
    inStock: true,
  };
  const now = new Date('2026-08-30T12:00:00Z');

  it('adds a schema.org offer only for a fresh, machine-verified price and stock', () => {
    expect(merchProductJsonLd({ ...base, verifiedAt: '2026-08-29T12:00:00Z' }, now)).toMatchObject({
      '@type': 'Product',
      offers: { '@type': 'Offer', price: '20.00', availability: 'https://schema.org/InStock' },
    });
    expect(
      merchProductJsonLd({ ...base, verifiedAt: '2026-08-20T12:00:00Z' }, now),
    ).not.toHaveProperty('offers');
    expect(
      merchProductJsonLd({ ...base, verifiedAt: '2026-09-01T12:00:00Z' }, now),
    ).not.toHaveProperty('offers');
  });
});
