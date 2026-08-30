import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — the executable authoring runners are intentionally plain ESM.
import { buildMerchDropDraftPair } from './build-drop-draft.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { authorOfficialCatalog } from './author-catalogs.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { checkCampaignPair, checkLength, checkSchema, weightedTweetLength } from '../social/check-drafts.mjs';

const now = new Date('2026-08-30T12:00:00.000Z');

const storeDropPlan = {
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
      {
        sourceId: '9002',
        brand: 'Taylor Swift Official',
        item: 'Showgirl Tour Hoodie',
        retailer: 'store.taylorswift.com',
        url: 'https://store.taylorswift.com/products/showgirl-tour-hoodie',
        price: '$65.00',
        imageUrl: 'https://cdn.shopify.com/showgirl-hoodie.jpg',
        inStock: true,
        kind: 'apparel',
        discoveredVia: 'shopify-sync',
        discoveredAt: now.toISOString(),
        verifiedAt: now.toISOString(),
      },
    ],
    updated: [],
    discontinued: [],
  },
};

describe('E4 store-drop fixture: sync-official plan -> authored catalog + social draft in one pass', () => {
  it('authors both the official catalog update and a valid X+Instagram social/queue pair', () => {
    const authored = authorOfficialCatalog({ plan: storeDropPlan });

    // 1. The catalog update side (already covered by author-catalogs.test.ts
    //    for the pure function; asserted again here as part of the combined
    //    store-drop fixture the acceptance doc calls out as absent).
    expect(authored.catalog).toHaveLength(2);
    expect(authored.catalog.map((p) => p.sourceId).sort()).toEqual(['9001', '9002']);
    expect(authored.rejected).toEqual([]);

    // 2. The socialDraft handoff carries exactly the observed metadata.
    expect(authored.socialDraft).toEqual({
      type: 'merch-drop-draft',
      products: [
        { sourceId: '9001', item: 'The Life of a Showgirl Vinyl', url: 'https://store.taylorswift.com/products/tloas-vinyl' },
        { sourceId: '9002', item: 'Showgirl Tour Hoodie', url: 'https://store.taylorswift.com/products/showgirl-tour-hoodie' },
      ],
    });

    // 3. That handoff becomes a real X + Instagram draft pair.
    const result = buildMerchDropDraftPair(authored.socialDraft, {
      mediaPath: '/social/library/merch-drop-test.png',
      now,
    });
    expect(result).not.toBeNull();
    expect(result.drafts).toHaveLength(2);

    const x = result.drafts.find((draft) => draft.item.platform === 'x')?.item;
    const ig = result.drafts.find((draft) => draft.item.platform === 'instagram')?.item;
    if (!x || !ig) throw new Error('expected both x and instagram drafts');

    // Never invents claims beyond the observed item names/urls (R2).
    expect(x.body).toContain('The Life of a Showgirl Vinyl');
    expect(x.body).toContain('longlivets.com');
    expect(x.body).not.toMatch(/\$\d/); // no fabricated/restated price claim in the post copy
    expect(ig.body).toContain('2 new items');
    expect(ig.media).toEqual(['/social/library/merch-drop-test.png']);
    expect(ig.mediaKind).toBe('site-screen');

    // Same story-unique campaign on both, per the unconditional pairing rule.
    expect(x.campaign).toBe(ig.campaign);
    expect(x.campaign).toMatch(/^merch-drop:/);

    // 4. Passes the real draft-time gates the PR must clear.
    for (const item of [x, ig]) {
      expect(checkSchema(item)).toEqual([]);
    }
    expect(checkCampaignPair('x-file', x, [{ file: 'ig-file', data: ig }], [])).toEqual([]);
    expect(checkCampaignPair('ig-file', ig, [{ file: 'x-file', data: x }], [])).toEqual([]);
    expect(checkLength(x)).toEqual([]);
    expect(weightedTweetLength(x.body)).toBeLessThanOrEqual(280);
  });

  it('returns null (stages nothing) when the plan carries no products', () => {
    const authored = authorOfficialCatalog({ plan: { plan: { added: [], updated: [], discontinued: [] } } });
    expect(buildMerchDropDraftPair(authored.socialDraft, { mediaPath: '/social/library/x.png', now })).toBeNull();
  });

  it('requires an explicit rendered-card mediaPath rather than guessing one', () => {
    const authored = authorOfficialCatalog({ plan: storeDropPlan });
    expect(() => buildMerchDropDraftPair(authored.socialDraft, { now })).toThrow(/mediaPath/);
  });

  it('falls back to count-only phrasing when the lead item name would blow X\'s weighted limit', () => {
    const longName = 'A'.repeat(300);
    const authored = authorOfficialCatalog({
      plan: {
        plan: {
          added: [
            {
              sourceId: '9003',
              brand: 'Taylor Swift Official',
              item: longName,
              retailer: 'store.taylorswift.com',
              url: 'https://store.taylorswift.com/products/long-name',
              price: '$10.00',
              inStock: true,
              kind: 'other',
              discoveredVia: 'shopify-sync',
              discoveredAt: now.toISOString(),
              verifiedAt: now.toISOString(),
            },
          ],
          updated: [],
          discontinued: [],
        },
      },
    });
    const result = buildMerchDropDraftPair(authored.socialDraft, { mediaPath: '/social/library/x.png', now });
    const x = result.drafts.find((draft) => draft.item.platform === 'x')?.item;
    if (!x) throw new Error('expected an x draft');
    expect(weightedTweetLength(x.body)).toBeLessThanOrEqual(280);
    expect(x.body).not.toContain(longName);
    expect(x.body).toContain('1 new item');
  });
});
