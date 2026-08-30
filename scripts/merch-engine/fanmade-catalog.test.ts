import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Seed modules intentionally remain plain ESM.
import { FAN_MADE } from '../../supabase/seed/merch/fanmade.mjs';

describe('E5 curated fan-made catalog', () => {
  it('contains only independently evidenced original designs', () => {
    expect(FAN_MADE.length).toBeGreaterThan(0);

    for (const entry of FAN_MADE) {
      expect(entry).toMatchObject({
        brand: expect.any(String),
        item: expect.any(String),
        kind: expect.any(String),
        retailer: expect.any(String),
        url: expect.stringMatching(/^https:\/\//),
        price: expect.stringMatching(/^\$/),
        inStock: true,
      });
      expect(entry.imageUrl).toMatch(/^https:\/\/cdn\.shopify\.com\//);
      expect(entry.provenance).toContainEqual(
        expect.objectContaining({
          discoveredVia: 'independent-shopify-listing',
          sourceUrl: entry.url,
          d3: expect.objectContaining({
            judgment: 'inspired-original',
            prohibitedMaterial: 'none',
          }),
          e1: expect.objectContaining({
            listingVerified: true,
            available: true,
            price: entry.price,
            evidenceUrl: `${entry.url}.js`,
          }),
          e2: expect.objectContaining({
            imageVerified: true,
            evidenceUrl: entry.imageUrl,
            officialArtwork: false,
            taylorPhoto: false,
            tourGraphic: false,
          }),
        }),
      );
    }
  });
});
