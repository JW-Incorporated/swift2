import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';
import { MERCH_CATALOGUE } from './merch';

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

describe('MERCH_CATALOGUE.officialStore / fanMade', () => {
  it('are genuinely empty — no curated data exists yet, never placeholders', () => {
    expect(MERCH_CATALOGUE.officialStore).toEqual([]);
    expect(MERCH_CATALOGUE.fanMade).toEqual([]);
  });
});
