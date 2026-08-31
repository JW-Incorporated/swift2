import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';
import { MERCH_CATALOGUE, merchProductJsonLd, newDrops, type MerchItem } from './merch';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Seed modules intentionally remain plain ESM.
import { FAN_MADE } from '../../../../supabase/seed/merch/fanmade.mjs';

// Mirrors merch.ts's private MERCH_KINDS set (the normalization target for
// every catalogue item's `kind`) — kept in sync deliberately rather than
// exported, since it's an implementation detail of catalogueItems().
const VALID_MERCH_KINDS = [
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
];

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

describe('MERCH_CATALOGUE.shopTheLook demoteSharedMomentPhoto', () => {
  // fix/merch-image-buy-link + dedupe (2026-08-31, kanban task t_49a63ae1):
  // when 2+ products from the same moment have no imageUrl of their own,
  // only the first (matcher's best-first order) should render that
  // moment's real photo — every later one is flagged so the UI falls back
  // to the honest monogram tile instead of repeating the identical photo
  // across different product cards.
  it('never flags the first same-moment product missing an imageUrl, only later ones', () => {
    const byMoment = new Map<string, typeof MERCH_CATALOGUE.shopTheLook[number][]>();
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const list = byMoment.get(item.source!.momentId) ?? [];
      list.push(item);
      byMoment.set(item.source!.momentId, list);
    }
    for (const items of byMoment.values()) {
      // Only relevant when the moment actually has SOME real photo to
      // duplicate — a moment with no real photo at all never flags
      // anything (every no-imageUrl product there already falls to the
      // honest monogram tile, nothing to dedupe).
      const anyFlagged = items.some((item) => item.demoteSharedMomentPhoto);
      if (!anyFlagged) continue;
      let seenUnflaggedNoImage = false;
      for (const item of items) {
        if (item.imageUrl) {
          expect(item.demoteSharedMomentPhoto).toBeFalsy();
          continue;
        }
        if (!item.demoteSharedMomentPhoto) {
          // At most one product per moment may be the un-flagged "first"
          // claimant of that moment's shared photo.
          expect(seenUnflaggedNoImage).toBe(false);
          seenUnflaggedNoImage = true;
        }
      }
    }
  });

  it('a product with its own imageUrl is never flagged, regardless of position', () => {
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      if (item.imageUrl) expect(item.demoteSharedMomentPhoto).toBeFalsy();
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

describe('MERCH_CATALOGUE.fanMade', () => {
  it('has the real curated count from the seed — asserted exactly so drift fails loudly', () => {
    expect(MERCH_CATALOGUE.fanMade.length).toBe(FAN_MADE.length);
    expect(MERCH_CATALOGUE.fanMade.length).toBeGreaterThan(0);
  });

  it('never invents an item — every fan-made item traces back to a real seed row by url', () => {
    const seedUrls = new Set(FAN_MADE.map((row: { url: string }) => row.url));
    for (const item of MERCH_CATALOGUE.fanMade) {
      expect(seedUrls.has(item.url)).toBe(true);
    }
  });

  it('maps every required MerchItem field from the curated seed row, with no placeholders', () => {
    expect(MERCH_CATALOGUE.fanMade.length).toBe(FAN_MADE.length);
    for (const item of MERCH_CATALOGUE.fanMade) {
      expect(item.category).toBe('fan-made');
      expect(item.brand).toEqual(expect.any(String));
      expect(item.brand.length).toBeGreaterThan(0);
      expect(item.item).toEqual(expect.any(String));
      expect(item.item.length).toBeGreaterThan(0);
      expect(item.retailer).toEqual(expect.any(String));
      expect(item.retailer.length).toBeGreaterThan(0);
      expect(item.url).toMatch(/^https:\/\//);
      expect(item.price).toMatch(/^\$/);
      expect(item.inStock).toBe(true);
      expect(item.imageUrl).toMatch(/^https:\/\//);
      expect(item.discoveredAt).toEqual(expect.any(String));
      // kind is always normalized to a valid MerchItem kind (never the raw,
      // unvalidated seed string, e.g. fanmade.mjs's 'print'/'home-decor') —
      // see catalogueItems()'s MERCH_KINDS guard.
      expect(VALID_MERCH_KINDS).toContain(item.kind);
    }
  });

  it('preserves the affiliate render-context seam — url stays the raw destination, never pre-wrapped', () => {
    // buildShopUrl() (lib/longlive/shop.ts) is the single seam that injects
    // affiliate wrapping; catalogueItems() must never bake it in here.
    for (const item of MERCH_CATALOGUE.fanMade) {
      expect(item.url).not.toMatch(/utm_|affiliate|awin|skimlinks|rewardstyle/i);
    }
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
