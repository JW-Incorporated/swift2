import { describe, expect, it } from 'vitest';
import { renderModule } from './sync-longlive-merch.mjs';

// The merch generator is a straight seed-to-generated-module pass-through
// (unlike theories/tracks/videos there is no seed-shape normalization here —
// see the header comment in sync-longlive-merch.mjs), so the only pure logic
// worth unit-testing is renderModule's TS-literal output.
describe('renderModule', () => {
  it('emits a valid, importable TS module with both exports', () => {
    const official = [
      {
        sourceId: '123',
        brand: 'Taylor Swift Official',
        item: 'Test CD',
        retailer: 'store.taylorswift.com',
        url: 'https://store.taylorswift.com/products/test-cd',
        price: '$12.99',
        inStock: true,
        imageUrl: 'https://cdn.shopify.com/test.png',
        kind: 'music',
        discoveredVia: 'shopify-sync',
        discoveredAt: '2026-08-30T14:21:23.757Z',
        verifiedAt: '2026-09-03T22:38:56.713Z',
      },
    ];
    const fanMade = [
      {
        brand: 'Test Shop',
        item: 'Test Shirt',
        kind: 'apparel',
        retailer: 'example.com',
        url: 'https://example.com/products/test-shirt',
        price: '$43.00',
        imageUrl: 'https://example.com/img.png',
        inStock: true,
        discoveredVia: 'independent-shopify-listing',
        discoveredAt: '2026-08-30T14:30:56Z',
        verifiedAt: '2026-08-30T14:31:37.402Z',
        provenance: [{ discoveredVia: 'independent-shopify-listing' }],
      },
    ];
    const ts = renderModule(official, fanMade);
    expect(ts).toContain('// GENERATED FILE — do not hand-edit.');
    expect(ts).toContain('export interface MerchSeedItem {');
    expect(ts).toContain('export const OFFICIAL: MerchSeedItem[] = [');
    expect(ts).toContain('export const FAN_MADE: MerchSeedItem[] = [');
    expect(ts).toContain('"sourceId": "123"');
    expect(ts).toContain('"item": "Test Shirt"');
  });

  it('round-trips every field through JSON.stringify without loss', () => {
    const official = [{ brand: 'B', item: 'I', retailer: 'r.com', url: 'https://r.com/x' }];
    const ts = renderModule(official, []);
    // eslint-disable-next-line no-eval
    const OFFICIAL = eval(ts.match(/export const OFFICIAL: MerchSeedItem\[\] = (\[[\s\S]*?\]);/)[1]);
    expect(OFFICIAL).toEqual(official);
  });

  it('renders an empty array as valid TS when a bucket has no listings', () => {
    const ts = renderModule([], []);
    expect(ts).toContain('export const OFFICIAL: MerchSeedItem[] = [];');
    expect(ts).toContain('export const FAN_MADE: MerchSeedItem[] = [];');
  });
});
