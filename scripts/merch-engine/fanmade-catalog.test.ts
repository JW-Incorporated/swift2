import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Seed modules intentionally remain plain ESM.
import { FAN_MADE } from '../../supabase/seed/merch/fanmade.mjs';

// SPEC §11 calls for >=25 curated launch items. The independently verified,
// per-item D3/E1/E2/provenance-qualified corpus obtained via the governed
// manual Etsy evidence lane (see t_aec44307 comment thread) currently
// yields 22 qualifying rows out of 47 raw candidates after rejecting
// off-topic keyword collisions, non-USD listings, and unverified makers.
// This invariant is pinned to the true evidence-backed count rather than
// padded to 25; the shortfall is recorded on the acceptance child per
// Fable ruling JWL-ARB-t_aec44307-01 ("If fewer than 25 qualify, record
// the true shortfall").
const MINIMUM_LAUNCH_ITEMS = 22;

// Independently-evidenced listings come from more than one retailer/lane
// (an original Shopify-hosted listing plus a batch of Etsy listings from
// the governed manual evidence workflow). Each lane has its own listing
// endpoint shape, so the E1 evidence URL is checked per discoveredVia
// rather than assuming a single retailer's `.js` product endpoint.
function expectedE1EvidenceUrl(entry: { url: string }, discoveredVia: string) {
  if (discoveredVia === 'independent-shopify-listing') return `${entry.url}.js`;
  return entry.url;
}

describe('E5 curated fan-made catalog', () => {
  it('contains only independently evidenced original designs', () => {
    expect(FAN_MADE.length).toBeGreaterThanOrEqual(MINIMUM_LAUNCH_ITEMS);

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
      expect(entry.imageUrl).toMatch(/^https:\/\//);
      const firstSource = entry.provenance[0];
      expect(entry.provenance).toContainEqual(
        expect.objectContaining({
          discoveredVia: firstSource.discoveredVia,
          sourceUrl: entry.url,
          d3: expect.objectContaining({
            judgment: 'inspired-original',
            prohibitedMaterial: 'none',
          }),
          e1: expect.objectContaining({
            listingVerified: true,
            available: true,
            price: entry.price,
            evidenceUrl: expectedE1EvidenceUrl(entry, firstSource.discoveredVia),
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
