import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — the executable authoring runners are intentionally plain ESM.
import { buildMerchDropIntents } from './build-drop-draft.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { authorOfficialCatalog } from './author-catalogs.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { validateIntent } from '../social/lib/inbox.mjs';

const now = new Date('2026-08-30T12:00:00.000Z');

const oneNewProductPlan = {
  plan: {
    added: [
      {
        sourceId: '9001',
        brand: 'Taylor Swift Official',
        item: 'The Life of a Showgirl Vinyl',
        retailer: 'store.taylorswift.com',
        url: 'https://store.taylorswift.com/products/tloas-vinyl',
        price: '$34.99',
        imageUrl: 'https://cdn.shopify.com/tloas-vinyl.jpg',
        inStock: true,
        kind: 'music',
        discoveredVia: 'shopify-sync',
        discoveredAt: now.toISOString(),
        verifiedAt: now.toISOString(),
      },
    ],
    updated: [],
    discontinued: [],
  },
};

// Mirrors merch-official-sync.yml's own author-step cross-reference: the
// full-field catalog rows (price/inStock/discoveredAt) for the same
// sourceIds the narrowed socialDraft.products handoff names.
function newProductRows(authored: { catalog: Array<{ sourceId: string }>; socialDraft: { products: Array<{ sourceId: string }> } }) {
  const newIds = new Set(authored.socialDraft.products.map((p) => p.sourceId));
  return authored.catalog.filter((row) => newIds.has(row.sourceId));
}

describe('E4 store-drop side door: sync-official plan -> authored catalog + social/inbox intent (Tree Overhaul T6, 2026-09-12 — no captions, no social/queue/ writes)', () => {
  it('writes exactly one social/inbox/*.json intent, zero social/queue/ files, and no prose value anywhere in facts, for a fixture catalog with one new product', () => {
    const authored = authorOfficialCatalog({ plan: oneNewProductPlan });
    expect(authored.socialDraft.products).toHaveLength(1);

    const intents = buildMerchDropIntents(newProductRows(authored), { mediaPath: '/social/library/merch-drop-test.png', now });
    expect(intents).toHaveLength(1);

    const intent = intents[0];
    expect(validateIntent(intent)).toEqual([]);
    expect(intent.v).toBe(1);
    expect(intent.lane).toBe('merch');
    expect(intent.source).toBe('merch-official-sync');
    expect(intent.status).toBe('open');

    // No caption, no body, no prose value of any kind — every fact traces
    // directly to the fixture's own observed catalog metadata (R2).
    expect(intent).not.toHaveProperty('body');
    expect(intent.facts).toEqual({
      name: 'The Life of a Showgirl Vinyl',
      price: '34.99',
      currency: 'USD',
      availability: 'in stock',
      productUrl: 'https://store.taylorswift.com/products/tloas-vinyl',
      firstSeenAt: now.toISOString(),
    });

    // The actual T6 acceptance property (spec AC#1): this lane never
    // writes a social/queue/ file, only social/inbox/.
    expect(JSON.stringify(intent)).not.toContain('social/queue');
  });

  it('returns [] (stages nothing) when the plan carries no new products', () => {
    const authored = authorOfficialCatalog({ plan: { plan: { added: [], updated: [], discontinued: [] } } });
    expect(buildMerchDropIntents(newProductRows(authored), { mediaPath: '/social/library/x.png', now })).toEqual([]);
  });

  it('requires an explicit rendered-card mediaPath rather than guessing one', () => {
    const authored = authorOfficialCatalog({ plan: oneNewProductPlan });
    expect(() => buildMerchDropIntents(newProductRows(authored), { now })).toThrow(/mediaPath/);
  });

  it('omits facts.price/currency rather than fabricating one when the plan carried no price', () => {
    const noPricePlan = {
      plan: {
        added: [{ ...oneNewProductPlan.plan.added[0], sourceId: '9003', price: undefined }],
        updated: [],
        discontinued: [],
      },
    };
    const authored = authorOfficialCatalog({ plan: noPricePlan });
    const intents = buildMerchDropIntents(newProductRows(authored), { mediaPath: '/social/library/x.png', now });
    expect(intents[0].facts).not.toHaveProperty('price');
    expect(intents[0].facts).not.toHaveProperty('currency');
    expect(validateIntent(intents[0])).toEqual([]);
  });

  it('writes one intent per new product when the plan carries more than one', () => {
    const twoProductPlan = {
      plan: {
        added: [
          oneNewProductPlan.plan.added[0],
          { ...oneNewProductPlan.plan.added[0], sourceId: '9002', item: 'Showgirl Tour Hoodie', url: 'https://store.taylorswift.com/products/showgirl-tour-hoodie', price: '$65.00' },
        ],
        updated: [],
        discontinued: [],
      },
    };
    const authored = authorOfficialCatalog({ plan: twoProductPlan });
    const intents = buildMerchDropIntents(newProductRows(authored), { mediaPath: '/social/library/merch-drop-test.png', now });
    expect(intents).toHaveLength(2);
    expect(new Set(intents.map((i: { id: string }) => i.id)).size).toBe(2);
    for (const intent of intents) expect(validateIntent(intent)).toEqual([]);

    // Both intents share the one rendered card (Codex review, PR #4140 LOW
    // finding) -- neither's altTextHint should claim the card "names" its
    // own product specifically; both describe the shared batch card,
    // led by the first product's name.
    for (const intent of intents) {
      expect(intent.altTextHint).toContain('2 items');
      expect(intent.altTextHint).toContain('The Life of a Showgirl Vinyl');
      expect(intent.altTextHint).not.toContain('Showgirl Tour Hoodie');
    }
  });

  it('never collides two distinct products whose names agree in their first 60 characters (Codex review, PR #4140)', () => {
    const sameNamePrefix = 'A'.repeat(70);
    const twoProductPlan = {
      plan: {
        added: [
          { ...oneNewProductPlan.plan.added[0], sourceId: '9001', item: `${sameNamePrefix} Vinyl` },
          { ...oneNewProductPlan.plan.added[0], sourceId: '9002', item: `${sameNamePrefix} Hoodie`, url: 'https://store.taylorswift.com/products/other', price: '$65.00' },
        ],
        updated: [],
        discontinued: [],
      },
    };
    const authored = authorOfficialCatalog({ plan: twoProductPlan });
    const intents = buildMerchDropIntents(newProductRows(authored), { mediaPath: '/social/library/merch-drop-test.png', now });
    expect(intents).toHaveLength(2);
    const ids = intents.map((i: { id: string }) => i.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids[0]).toContain('9001');
    expect(ids[1]).toContain('9002');
  });
});
