import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — The executable authoring runner is intentionally plain ESM.
import {
  authorFanmadeCatalog,
  authorOfficialCatalog,
  moduleSource,
} from './author-catalogs.mjs';

const fetchedAt = '2026-08-30T00:00:00.000Z';

const official = {
  sourceId: '101',
  brand: 'Taylor Swift Official',
  item: 'The Tortured Poets Department Vinyl',
  retailer: 'store.taylorswift.com',
  url: 'https://store.taylorswift.com/products/ttpd-vinyl',
  price: '$31.99',
  imageUrl: 'https://cdn.shopify.com/ttpd-vinyl.jpg',
  inStock: true,
  kind: 'music',
  discoveredVia: 'shopify-sync',
  discoveredAt: fetchedAt,
  verifiedAt: fetchedAt,
};

describe('E4/E5 catalog authoring', () => {
  it('authors only direct, detector-verified official rows and adds an era only from a proven collection mapping', () => {
    const result = authorOfficialCatalog({
      plan: {
        products: [
          { ...official, collectionHandles: ['the-tortured-poets-department'], altListing: { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0TEST' } },
          { ...official, sourceId: 'unverified', verifiedAt: null },
          { ...official, sourceId: 'redirected', url: 'https://example.test/products/ttpd-vinyl' },
        ],
      },
      collectionEraMap: { 'the-tortured-poets-department': 'the-tortured-poets-department' },
      verifiedAmazonTwins: new Map([['101', 'https://www.amazon.com/dp/B0TEST']]),
    });

    expect(result.catalog).toEqual([{ ...official, eraId: 'the-tortured-poets-department', altListing: { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0TEST' } }]);
    expect(result.rejected).toEqual([
      { sourceId: 'unverified', reason: 'official-verification-required' },
      { sourceId: 'redirected', reason: 'direct-official-url-required' },
    ]);
    expect(result.summary).toEqual({ eraAttributed: 1, verifiedAlternate: 1 });
    expect(result.socialDraft).toEqual({ type: 'merch-drop-draft', products: [{ sourceId: '101', item: official.item, url: official.url }] });
  });

  it('never attaches an unverified Amazon twin or guesses an era for an unmapped collection', () => {
    const result = authorOfficialCatalog({
      plan: { products: [{ ...official, collectionHandles: ['new-arrivals'], altListing: { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0TEST' } }] },
      collectionEraMap: { 'the-tortured-poets-department': 'the-tortured-poets-department' },
      verifiedAmazonTwins: new Set(),
    });

    expect(result.catalog).toEqual([official]);
  });

  it('rejects a claimed Amazon twin unless its exact direct URL appears in the verification artifact', () => {
    const candidate = {
      ...official,
      altListing: { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0TEST' },
    };

    expect(
      authorOfficialCatalog({
        plan: { products: [candidate] },
        verifiedAmazonTwins: new Map([['101', 'https://www.amazon.com/dp/DIFFERENT']]),
      }).catalog,
    ).toEqual([official]);
    expect(
      authorOfficialCatalog({ plan: { products: [candidate] }, verifiedAmazonTwins: new Set(['101']) }).catalog,
    ).toEqual([official]);
  });

  it('consumes the detector plan rather than its raw Shopify payload', () => {
    const result = authorOfficialCatalog({
      plan: { products: [{ id: 101, title: official.item }], plan: { added: [official], updated: [], discontinued: [] } },
    });

    expect(result.catalog).toEqual([official]);
  });

  it('merges an update-only delta plan into the existing catalog instead of discarding unchanged rows', () => {
    const unchanged = { ...official, sourceId: '202', item: 'Unrelated Unchanged Product', url: 'https://store.taylorswift.com/products/unrelated' };
    const updated = { ...official, price: '$99.99' };

    const result = authorOfficialCatalog({
      plan: { plan: { added: [], updated: [updated], discontinued: [] } },
      currentCatalog: [official, unchanged],
    });

    expect(result.catalog).toEqual(
      [unchanged, updated].sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
    );
  });

  it('marks a discontinued-only delta plan out of stock while preserving unrelated rows', () => {
    const unchanged = { ...official, sourceId: '202', item: 'Unrelated Unchanged Product', url: 'https://store.taylorswift.com/products/unrelated' };
    const discontinuedRow = { ...official, inStock: false };

    const result = authorOfficialCatalog({
      plan: { plan: { added: [], updated: [], discontinued: [discontinuedRow] } },
      currentCatalog: [official, unchanged],
    });

    expect(result.catalog).toEqual(
      [unchanged, discontinuedRow].sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
    );
    expect(result.catalog.find((row: { sourceId: string }) => row.sourceId === official.sourceId)?.inStock).toBe(false);
  });

  it('limits the social draft to newly added products only, never updated or discontinued rows', () => {
    const unchanged = { ...official, sourceId: '202', item: 'Unrelated Unchanged Product', url: 'https://store.taylorswift.com/products/unrelated' };
    const updated = { ...official, price: '$99.99' };
    const discontinuedRow = { ...official, sourceId: '303', inStock: false, url: 'https://store.taylorswift.com/products/discontinued' };
    const newProduct = { ...official, sourceId: '404', item: 'Brand New Drop', url: 'https://store.taylorswift.com/products/brand-new-drop' };

    const updateOnly = authorOfficialCatalog({
      plan: { plan: { added: [], updated: [updated], discontinued: [] } },
      currentCatalog: [official, unchanged],
    });
    expect(updateOnly.socialDraft).toEqual({ type: 'merch-drop-draft', products: [] });

    const discontinuedOnly = authorOfficialCatalog({
      plan: { plan: { added: [], updated: [], discontinued: [discontinuedRow] } },
      currentCatalog: [official, unchanged],
    });
    expect(discontinuedOnly.socialDraft).toEqual({ type: 'merch-drop-draft', products: [] });

    const mixed = authorOfficialCatalog({
      plan: { plan: { added: [newProduct], updated: [updated], discontinued: [discontinuedRow] } },
      currentCatalog: [official, unchanged],
    });
    expect(mixed.socialDraft).toEqual({
      type: 'merch-drop-draft',
      products: [{ sourceId: newProduct.sourceId, item: newProduct.item, url: newProduct.url }],
    });
  });

  it('authors only D3-approved fan-made seeds with provenance and both E1/E2 evidence', () => {
    const accepted = {
      brand: 'LavenderMaker', item: 'Original lavender lyric bracelet', kind: 'accessory',
      url: 'https://www.etsy.com/listing/7/original-bracelet', price: '$28.00', imageUrl: 'https://images.example.test/bracelet.jpg',
      provenance: [{ discoveredVia: 'etsy-search', sourceUrl: 'https://openapi.etsy.test/listings/7', discoveredAt: fetchedAt }],
      judgment: 'inspired-original', prohibitedMaterial: 'none', listingVerified: true, imageVerified: true,
    };
    const result = authorFanmadeCatalog({
      curation: [accepted, { ...accepted, prohibitedMaterial: 'official-artwork' }, { ...accepted, provenance: [] }],
      verifiedAt: fetchedAt,
    });

    expect(result.catalog).toEqual([{
      brand: accepted.brand, item: accepted.item, kind: accepted.kind, retailer: 'www.etsy.com', url: accepted.url,
      price: accepted.price, imageUrl: accepted.imageUrl, inStock: true, discoveredVia: 'etsy-search', discoveredAt: fetchedAt,
      verifiedAt: fetchedAt, provenance: accepted.provenance,
    }]);
    expect(result.rejected).toEqual([
      { sourceId: null, reason: 'd3-prohibited-material' },
      { sourceId: null, reason: 'provenance-required' },
    ]);
    expect(result.socialDraft).toEqual({
      type: 'fanmade-drop-draft',
      products: [{ item: accepted.item, url: accepted.url }],
    });
  });

  it('writes executable seed module source without network wrappers or live social actions', () => {
    const source = moduleSource('OFFICIAL', [official]);
    expect(source).toContain('export const OFFICIAL = [');
    expect(source).toContain(official.url);
    expect(source).not.toMatch(/awin1|post-queue|social\/post/i);
  });
});
