import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildAdvertiserDirectory,
  jitterDelay,
} from './sync-awin-programmes.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { buildFeedSyncPlan, fetchChangedFeeds, parseFeedList, rowsFromCsv } from './sync-awin-feeds.mjs';

describe('E0 Awin sync', () => {
  it('generates a hostname map only for joined programmes and retains unmatched advertisers as apply candidates', () => {
    expect(
      buildAdvertiserDirectory({
        joined: [
          { advertiserId: 6220, primaryDomain: 'www.etsy.com', name: 'Etsy' },
          { advertiserId: 123, primaryDomain: 'shop.example', name: 'Shop' },
        ],
        directory: [
          { advertiserId: 6220, primaryDomain: 'www.etsy.com', name: 'Etsy' },
          { advertiserId: 123, primaryDomain: 'shop.example', name: 'Shop' },
          { advertiserId: 456, primaryDomain: 'direct.example', name: 'Direct retailer' },
        ],
        retailerHosts: new Set(['etsy.com', 'direct.example']),
        generatedAt: '2026-08-30T00:00:00.000Z',
      }),
    ).toEqual({
      source: 'E0 Awin Publisher API cross-reference',
      generatedAt: '2026-08-30T00:00:00.000Z',
      advertisers: [
        { retailer: 'direct.example', awinmid: '456', joined: false },
        { retailer: 'etsy.com', awinmid: '6220', joined: true },
      ],
    });
  });

  it('selects only feeds whose source timestamp changed', () => {
    expect(
      buildFeedSyncPlan({
        feeds: [
          { feedId: 'unchanged', updatedAt: '2026-08-29T00:00:00.000Z' },
          { feedId: 'changed', updatedAt: '2026-08-30T00:00:00.000Z' },
        ],
        cache: { feeds: { unchanged: '2026-08-29T00:00:00.000Z', changed: '2026-08-29T00:00:00.000Z' } },
      }),
    ).toEqual([{ feedId: 'changed', updatedAt: '2026-08-30T00:00:00.000Z' }]);
  });

  it('keeps quoted multiline CSV fields inside their original product record', () => {
    expect(
      rowsFromCsv(
        { feedId: 'feed-1', updatedAt: '2026-08-30T00:00:00.000Z' },
        'merchant_id,aw_product_id,product_name,description\n123,p1,Dress,"First line\nSecond line"',
      ),
    ).toEqual([
      expect.objectContaining({ feedId: 'feed-1', advertiserMid: '123', productId: 'p1', description: 'First line\nSecond line' }),
    ]);
  });

  it('treats an empty changed feed as zero rows', () => {
    expect(rowsFromCsv({ feedId: 'feed-1', updatedAt: '2026-08-30T00:00:00.000Z' }, '')).toEqual([]);
  });

  it('reads the feed advertiser ID so a changed empty feed can remove its stale rows', () => {
    expect(
      parseFeedList('feed id,last imported,url,advertiser id\nfeed-1,2026-08-30,https://feeds.example/one.csv,123'),
    ).toEqual([
      {
        feedId: 'feed-1',
        updatedAt: '2026-08-30',
        downloadUrl: 'https://feeds.example/one.csv',
        advertiserMid: '123',
      },
    ]);
  });

  it('limits feed requests to five per minute and never runs two downloads concurrently', async () => {
    const fetchImpl = vi.fn(async (url: string) => new Response(`id,title\n${url},Dress`, { status: 200 }));
    const sleep = vi.fn(async () => undefined);

    await fetchChangedFeeds({
      feeds: [
        { feedId: 'one', downloadUrl: 'https://feeds.example/one.csv', updatedAt: '2026-08-30T00:00:00.000Z' },
        { feedId: 'two', downloadUrl: 'https://feeds.example/two.csv', updatedAt: '2026-08-30T00:00:00.000Z' },
      ],
      fetchImpl,
      sleep,
      requestIntervalMs: 12_000,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(12_000);
  });

  it('uses a bounded 10–120 second workflow jitter and an Actions cache without committing the index', () => {
    expect(jitterDelay(() => 0)).toBe(10_000);
    expect(jitterDelay(() => 0.999999)).toBe(120_000);

    const workflow = readFileSync('.github/workflows/merch-awin-sync.yml', 'utf8');
    expect(workflow).toContain('actions/cache/restore@v4');
    expect(workflow).toContain('actions/cache/save@v4');
    expect(workflow).toContain('sync-awin-programmes.mjs');
    expect(workflow).toContain('npx tsx scripts/merch-engine/sync-awin-programmes.mjs');
    expect(workflow).toContain('sync-awin-feeds.mjs');
    expect(workflow).toContain('AWIN_API_TOKEN: ${{ secrets.AWIN_API_TOKEN }}');
    expect(workflow).toContain('AWIN_FEED_API_KEY: ${{ secrets.AWIN_FEED_API_KEY }}');
    expect(workflow).toContain('AWIN_PUBLISHER_ID: ${{ secrets.AWIN_PUBLISHER_ID }}');
    expect(workflow).not.toMatch(/git (add|commit|push)/i);
    expect(workflow).toContain('peter-evans/create-pull-request');
    expect(workflow).toContain('merch-revenue/awin-advertiser-map');
    expect(workflow).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(workflow).toContain('apps/web/lib/longlive/awin-advertisers.json');
    expect(readFileSync('scripts/merch-engine/sync-awin-programmes.mjs', 'utf8')).not.toContain("relationship: 'any'");
  });
});
