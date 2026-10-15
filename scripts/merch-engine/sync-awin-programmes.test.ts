import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { buildAdvertiserDirectory } from './sync-awin-programmes.mjs';

describe('Awin advertiser directory timestamps', () => {
  it('keeps the previous generatedAt and produces no diff for an unchanged advertiser list', () => {
    const previous = {
      source: 'E0 Awin Publisher API cross-reference',
      generatedAt: '2026-10-01T00:00:00.000Z',
      advertisers: [{ retailer: 'shop.example', awinmid: '123', joined: true }],
    };

    const generated = buildAdvertiserDirectory({
      joined: [{ advertiserId: 123, primaryDomain: 'shop.example' }],
      directory: [{ advertiserId: 123, primaryDomain: 'shop.example' }],
      retailerHosts: new Set(['shop.example']),
      generatedAt: '2026-10-14T00:00:00.000Z',
      previous,
    });

    expect(`${JSON.stringify(generated, null, 2)}\n`).toBe(`${JSON.stringify(previous, null, 2)}\n`);
  });
});
