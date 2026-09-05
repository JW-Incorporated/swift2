import { describe, expect, it } from 'vitest';
import { CONTENT, getContentItem } from './content';
import {
  MERCH_CATALOGUE,
  merchProductJsonLd,
  newDrops,
  shopTheLookItemsFrom,
  type MerchItem,
} from './merch';
import { primaryImage } from '@swift2/experience';
import { FAN_MADE } from './merch.generated';

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
    const byMoment = new Map<string, (typeof MERCH_CATALOGUE.shopTheLook)[number][]>();
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

  // kanban task t_cfd48d66 (2026-08-31): the #3569 fix above scoped its
  // claim tracking to momentId, so it missed two DIFFERENT moments whose
  // `images` cite the identical underlying photo URL (the real case: a
  // 2016-Grammys wardrobe moment and a separate haircut moment both citing
  // the same wire photo) — the founder's screenshot showed the resulting
  // two adjacent cards both rendering that photo. This test builds the
  // exact reproducing data shape directly (two synthetic moments, same
  // primaryImage URL, second moment's product has no imageUrl of its own)
  // and would have caught the regression before the founder did.
  it('demotes a product whose moment photo URL is claimed by a DIFFERENT earlier moment', () => {
    const byMoment = new Map<string, (typeof MERCH_CATALOGUE.shopTheLook)[number][]>();
    for (const item of MERCH_CATALOGUE.shopTheLook) {
      const list = byMoment.get(item.source!.momentId) ?? [];
      list.push(item);
      byMoment.set(item.source!.momentId, list);
    }
    // Assert the real catalogue itself now has no case of this: no two
    // items from DIFFERENT moments both render (unflagged) as the 'moment'
    // fallback with the same underlying photo URL. We can't call
    // merchItemImage() here (merch.ts doesn't expose momentPhotoUrl per
    // item), so instead assert the invariant merchItemImage() depends on:
    // every unflagged no-imageUrl item's moment photo URL is unique among
    // all OTHER unflagged no-imageUrl items, moment or not.
    const claimedByOtherMoment = new Map<string, string>(); // url -> momentId that claimed it
    for (const [momentId, items] of byMoment) {
      for (const item of items) {
        if (item.imageUrl || item.demoteSharedMomentPhoto) continue;
        // This item is an unflagged claimant of its moment's photo. No
        // OTHER moment's unflagged claimant may share the same photo URL —
        // that would mean two adjacent cards rendering the identical
        // Taylor photo, unflagged, from different moments.
        const moment = getContentItem(momentId);
        if (!moment) continue;
        const url = primaryImage(moment);
        const claimant = claimedByOtherMoment.get(url);
        if (claimant && claimant !== momentId) {
          throw new Error(
            `Photo ${url} is claimed unflagged by both moment ${claimant} and ${momentId}`,
          );
        }
        claimedByOtherMoment.set(url, momentId);
      }
    }
  });

  // Codex review (kanban task t_cfd48d66, round 1): the catalogue-walking
  // test above only ever inspects no-imageUrl items, so it can't tell a
  // split card apart from a moment with no photo at all — it would still
  // pass if shopTheLookItemsFrom() reverted to per-moment-only tracking,
  // as long as no OTHER product happened to be unflagged-and-no-image for
  // the same URL. This test builds the exact reproducing fixture directly
  // and asserts the SPECIFIC mechanism: an earlier moment's product with
  // its OWN imageUrl (which renders as a 'split' card, moment half still
  // showing the shared photo) must still claim that photo URL, so a LATER
  // moment's no-imageUrl product sharing the same URL gets demoted.
  // Reverting to per-moment (or momentId-keyed) tracking fails this test.
  it('demotes a product whose moment photo is claimed by an EARLIER SPLIT CARD from a different moment', () => {
    const sharedUrl = 'https://example.test/shared-wire-photo.jpg';
    const wardrobeProduct = {
      brand: 'Test Designer',
      item: 'Test Dress',
      retailer: 'test.com',
      url: 'https://test.com/dress',
      imageUrl: 'https://example.test/dress-product-photo.jpg', // has its own photo -> renders split
    };
    const haircutProduct = {
      brand: 'Test Brand',
      item: 'Test Hair Product',
      retailer: 'test.com',
      url: 'https://test.com/hair',
      // no imageUrl -> falls back to the moment photo (or gets demoted)
    };
    const items = shopTheLookItemsFrom([
      {
        id: 'moment-wardrobe',
        eraId: '1989',
        title: 'Wardrobe moment',
        momentPhotoUrl: sharedUrl,
        products: [wardrobeProduct],
      },
      {
        id: 'moment-haircut',
        eraId: '1989',
        title: 'Haircut moment',
        momentPhotoUrl: sharedUrl,
        products: [haircutProduct],
      },
    ]);
    expect(items).toHaveLength(2);
    const wardrobeItem = items.find((i) => i.url === wardrobeProduct.url)!;
    const haircutItem = items.find((i) => i.url === haircutProduct.url)!;
    // The split card's own product is never demoted — it has its own photo.
    expect(wardrobeItem.demoteSharedMomentPhoto).toBeFalsy();
    // The later, different-moment product sharing the same photo URL IS
    // demoted, even though it's the first (and only) product in ITS moment
    // — proving the claim crossed moment boundaries via the URL, not via
    // momentId or position-within-moment.
    expect(haircutItem.demoteSharedMomentPhoto).toBe(true);
  });

  it('a genuinely different photo URL across two moments is never demoted', () => {
    const items = shopTheLookItemsFrom([
      {
        id: 'moment-a',
        eraId: '1989',
        title: 'Moment A',
        momentPhotoUrl: 'https://example.test/photo-a.jpg',
        products: [{ brand: 'B', item: 'A', retailer: 'test.com', url: 'https://test.com/a' }],
      },
      {
        id: 'moment-b',
        eraId: '1989',
        title: 'Moment B',
        momentPhotoUrl: 'https://example.test/photo-b.jpg',
        products: [{ brand: 'B', item: 'B', retailer: 'test.com', url: 'https://test.com/b' }],
      },
    ]);
    expect(items.every((i) => !i.demoteSharedMomentPhoto)).toBe(true);
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
