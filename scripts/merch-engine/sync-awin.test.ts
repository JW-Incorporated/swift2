import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildAdvertiserDirectory,
  jitterDelay,
  requestProgrammes,
} from './sync-awin-programmes.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildFeedDirectorySyncPlan,
  buildFeedSyncPlan,
  fetchChangedFeeds,
  parseFeedList,
  removedFeedIds,
  rowsFromCsv,
  syncAwinFeeds,
  writeSqlite,
} from './sync-awin-feeds.mjs';

const EMPTY_DIRECTORY = 'feed id,last imported,url,advertiser id\n';
const CURRENT_DIRECTORY =
  'feed id,last imported,url,advertiser id\ncurrent,2026-08-30,https://feeds.example/current.csv,100';

async function withCache(
  cache: object,
  run: (cachePath: string, indexPath: string) => Promise<void>,
) {
  const directory = await mkdtemp(join(tmpdir(), 'awin-feed-cache-'));
  const cachePath = join(directory, 'cache.json');
  const indexPath = join(directory, 'index.sqlite');
  await writeFile(cachePath, `${JSON.stringify(cache)}\n`);
  try {
    await run(cachePath, indexPath);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

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
        cache: {
          feeds: { unchanged: '2026-08-29T00:00:00.000Z', changed: '2026-08-29T00:00:00.000Z' },
        },
      }),
    ).toEqual([{ feedId: 'changed', updatedAt: '2026-08-30T00:00:00.000Z' }]);
  });

  it('follows each documented next-page link while reading the programme directory', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1 }]), { headers: { link: '<?page=2>; rel="next"' } }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 2 }])));

    await expect(
      requestProgrammes({ publisherId: '123', token: 'test-token', fetchImpl }),
    ).resolves.toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(new URL(fetchImpl.mock.calls[1][0]).pathname).toBe('/publishers/123/programmes');
    expect(new URL(fetchImpl.mock.calls[1][0]).searchParams.get('page')).toBe('2');
  });

  it('rejects programme pagination links outside the Awin API origin', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        headers: { link: '<https://outside.example/programmes?page=2>; rel="next"' },
      }),
    );

    await expect(
      requestProgrammes({ publisherId: '123', token: 'test-token', fetchImpl }),
    ).rejects.toThrow('Awin programme pagination must remain on the Awin API origin');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('identifies feeds removed from the latest directory', () => {
    expect(
      removedFeedIds({
        feeds: [
          {
            feedId: 'still-here',
            updatedAt: '2026-08-30',
            downloadUrl: 'https://feeds.example/still-here.csv',
          },
        ],
        cache: { feeds: { 'still-here': '2026-08-30', removed: '2026-08-29' } },
      }),
    ).toEqual(['removed']);
  });

  it('does not treat a malformed successful directory response as feed removals', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: '<html>temporary upstream error</html>',
        cache: { feeds: { current: '2026-08-30', retained: '2026-08-29' } },
      }),
    ).toEqual({ complete: false, feeds: [], changed: [], removed: [] });
  });

  it('defers empty-directory removals until a second consecutive response', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: 'feed id,last imported,url,advertiser id\n',
        cache: { feeds: { retained: '2026-08-29' } },
      }),
    ).toEqual({ complete: true, feeds: [], changed: [], removed: [], deferredRemoval: true });
  });

  it('removes cached feeds after a second consecutive empty directory response', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: 'feed id,last imported,url,advertiser id\n',
        cache: { feeds: { retained: '2026-08-29' }, emptyDirectoryStreak: 1 },
      }),
    ).toEqual({ complete: true, feeds: [], changed: [], removed: ['retained'] });
  });

  it('accepts an empty directory when no cached feeds need protection', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: 'feed id,last imported,url,advertiser id\n',
        cache: { feeds: {} },
      }),
    ).toEqual({ complete: true, feeds: [], changed: [], removed: [] });
  });

  it('clears an empty-directory confirmation streak after a complete nonempty response', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: 'feed id,last imported,url,advertiser id\ncurrent,2026-08-30,https://feeds.example/current.csv,100',
        cache: { feeds: { current: '2026-08-30' }, emptyDirectoryStreak: 1 },
      }),
    ).toEqual({
      complete: true,
      feeds: [
        {
          feedId: 'current',
          updatedAt: '2026-08-30',
          downloadUrl: 'https://feeds.example/current.csv',
          advertiserMid: '100',
        },
      ],
      changed: [],
      removed: [],
    });
  });

  it('does not confirm an empty-directory streak with malformed input', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: '<html>temporary upstream error</html>',
        cache: { feeds: { retained: '2026-08-29' }, emptyDirectoryStreak: 1 },
      }),
    ).toEqual({ complete: false, feeds: [], changed: [], removed: [] });
  });

  it('does not treat an incomplete directory row as a feed removal', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: 'feed id,last imported,url,advertiser id\ncurrent,2026-08-30,https://feeds.example/current.csv,100\nretained,2026-08-29',
        cache: { feeds: { current: '2026-08-30', retained: '2026-08-29' } },
      }),
    ).toEqual({
      complete: false,
      feeds: [
        {
          feedId: 'current',
          updatedAt: '2026-08-30',
          downloadUrl: 'https://feeds.example/current.csv',
          advertiserMid: '100',
        },
      ],
      changed: [],
      removed: [],
    });
  });

  it('removes cached feeds absent from a complete directory response', () => {
    expect(
      buildFeedDirectorySyncPlan({
        csv: 'feed id,last imported,url,advertiser id\ncurrent,2026-08-31,https://feeds.example/current.csv,100',
        cache: { feeds: { current: '2026-08-30', removed: '2026-08-29' } },
      }),
    ).toEqual({
      complete: true,
      feeds: [
        {
          feedId: 'current',
          updatedAt: '2026-08-31',
          downloadUrl: 'https://feeds.example/current.csv',
          advertiserMid: '100',
        },
      ],
      changed: [
        {
          feedId: 'current',
          updatedAt: '2026-08-31',
          downloadUrl: 'https://feeds.example/current.csv',
          advertiserMid: '100',
        },
      ],
      removed: ['removed'],
    });
  });

  it('clears a prior empty marker before a valid nonempty download failure, making the next empty response a first observation', async () => {
    await withCache(
      { feeds: { retained: '2026-08-29' }, emptyDirectoryStreak: 1 },
      async (cachePath, indexPath) => {
        const fetchImpl = vi
          .fn()
          .mockResolvedValueOnce(new Response(CURRENT_DIRECTORY))
          .mockResolvedValueOnce(new Response('', { status: 500 }))
          .mockResolvedValueOnce(new Response(EMPTY_DIRECTORY));

        await expect(
          syncAwinFeeds({
            cachePath,
            indexPath,
            apiKey: 'test',
            fetchImpl,
            writeSqliteImpl: vi.fn(),
          }),
        ).rejects.toThrow('download failed');
        expect(JSON.parse(readFileSync(cachePath, 'utf8'))).toEqual({
          feeds: { retained: '2026-08-29' },
        });

        await syncAwinFeeds({
          cachePath,
          indexPath,
          apiKey: 'test',
          fetchImpl,
          writeSqliteImpl: vi.fn(),
        });
        expect(JSON.parse(readFileSync(cachePath, 'utf8'))).toEqual({
          feeds: { retained: '2026-08-29' },
          emptyDirectoryStreak: 1,
        });
      },
    );
  });

  it('clears a prior empty marker before a valid nonempty index failure without advancing feed timestamps', async () => {
    await withCache(
      { feeds: { current: '2026-08-30', retained: '2026-08-29' }, emptyDirectoryStreak: 1 },
      async (cachePath, indexPath) => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response(CURRENT_DIRECTORY));
        const writeSqliteImpl = vi.fn().mockRejectedValue(new Error('index write failed'));

        await expect(
          syncAwinFeeds({ cachePath, indexPath, apiKey: 'test', fetchImpl, writeSqliteImpl }),
        ).rejects.toThrow('index write failed');
        expect(JSON.parse(readFileSync(cachePath, 'utf8'))).toEqual({
          feeds: { current: '2026-08-30', retained: '2026-08-29' },
        });
        expect(writeSqliteImpl).toHaveBeenCalledWith(indexPath, [], ['retained']);
      },
    );
  });

  it('preserves an empty marker after malformed input because malformed directories are non-observations', async () => {
    await withCache(
      { feeds: { retained: '2026-08-29' }, emptyDirectoryStreak: 1 },
      async (cachePath, indexPath) => {
        const fetchImpl = vi
          .fn()
          .mockResolvedValue(new Response('<html>temporary upstream error</html>'));

        await expect(
          syncAwinFeeds({
            cachePath,
            indexPath,
            apiKey: 'test',
            fetchImpl,
            writeSqliteImpl: vi.fn(),
          }),
        ).rejects.toThrow('directory response is incomplete');
        expect(JSON.parse(readFileSync(cachePath, 'utf8'))).toEqual({
          feeds: { retained: '2026-08-29' },
          emptyDirectoryStreak: 1,
        });
      },
    );
  });

  it('persists a valid empty cache marker and removes feeds only after the next valid empty directory', async () => {
    await withCache({ feeds: { retained: '2026-08-29' } }, async (cachePath, indexPath) => {
      const fetchImpl = vi.fn(() => Promise.resolve(new Response(EMPTY_DIRECTORY)));
      const writeSqliteImpl = vi.fn();

      await syncAwinFeeds({ cachePath, indexPath, apiKey: 'test', fetchImpl, writeSqliteImpl });
      expect(JSON.parse(readFileSync(cachePath, 'utf8'))).toEqual({
        feeds: { retained: '2026-08-29' },
        emptyDirectoryStreak: 1,
      });

      await syncAwinFeeds({ cachePath, indexPath, apiKey: 'test', fetchImpl, writeSqliteImpl });
      expect(writeSqliteImpl).toHaveBeenCalledWith(indexPath, [], ['retained']);
      expect(JSON.parse(readFileSync(cachePath, 'utf8'))).toEqual({ feeds: {} });
    });
  });

  const sqliteSupported = Number(process.versions.node.split('.')[0]) >= 22;
  (sqliteSupported ? it : it.skip)(
    'removes absent feeds and keeps FTS lookups linked to refreshed products',
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'awin-feed-index-'));
      const indexPath = join(directory, 'index.sqlite');
      try {
        await writeSqlite(
          indexPath,
          [
            {
              feedId: 'current',
              advertiserMid: '100',
              productId: 'dress',
              title: 'Original Dress',
              description: '',
              brand: '',
              updatedAt: '2026-08-30',
            },
            {
              feedId: 'removed',
              advertiserMid: '200',
              productId: 'gone',
              title: 'Gone Product',
              description: '',
              brand: '',
              updatedAt: '2026-08-30',
            },
          ],
          ['current', 'removed'],
        );
        await writeSqlite(
          indexPath,
          [
            {
              feedId: 'current',
              advertiserMid: '100',
              productId: 'dress',
              title: 'Updated Dress',
              description: '',
              brand: '',
              updatedAt: '2026-08-31',
            },
          ],
          ['current', 'removed'],
        );

        const { DatabaseSync } = await import('node:sqlite');
        const database = new DatabaseSync(indexPath);
        expect(
          database
            .prepare("SELECT product_key FROM products_fts WHERE products_fts MATCH 'Updated'")
            .all(),
        ).toEqual([{ product_key: 'current:dress' }]);
        expect(
          database
            .prepare("SELECT product_key FROM products_fts WHERE products_fts MATCH 'Gone'")
            .all(),
        ).toEqual([]);
        database.close();
      } finally {
        await rm(directory, { force: true, recursive: true });
      }
    },
  );

  it('keeps quoted multiline CSV fields inside their original product record', () => {
    expect(
      rowsFromCsv(
        { feedId: 'feed-1', updatedAt: '2026-08-30T00:00:00.000Z' },
        'merchant_id,aw_product_id,product_name,description\n123,p1,Dress,"First line\nSecond line"',
      ),
    ).toEqual([
      expect.objectContaining({
        feedId: 'feed-1',
        advertiserMid: '123',
        productId: 'p1',
        description: 'First line\nSecond line',
      }),
    ]);
  });

  it('treats an empty changed feed as zero rows', () => {
    expect(rowsFromCsv({ feedId: 'feed-1', updatedAt: '2026-08-30T00:00:00.000Z' }, '')).toEqual(
      [],
    );
  });

  it('reads the feed advertiser ID so a changed empty feed can remove its stale rows', () => {
    expect(
      parseFeedList(
        'feed id,last imported,url,advertiser id\nfeed-1,2026-08-30,https://feeds.example/one.csv,123',
      ),
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
    const fetchImpl = vi.fn(
      async (url: string) => new Response(`id,title\n${url},Dress`, { status: 200 }),
    );
    const sleep = vi.fn(async () => undefined);

    await fetchChangedFeeds({
      feeds: [
        {
          feedId: 'one',
          downloadUrl: 'https://feeds.example/one.csv',
          updatedAt: '2026-08-30T00:00:00.000Z',
        },
        {
          feedId: 'two',
          downloadUrl: 'https://feeds.example/two.csv',
          updatedAt: '2026-08-30T00:00:00.000Z',
        },
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
    expect(workflow).toContain('npx tsx scripts/merch-engine/affiliate-coverage.mjs');
    expect(workflow).toContain('sync-awin-feeds.mjs');
    expect(workflow).toContain('AWIN_API_TOKEN: ${{ secrets.AWIN_API_TOKEN }}');
    expect(workflow).toContain('AWIN_FEED_API_KEY: ${{ secrets.AWIN_FEED_API_KEY }}');
    expect(workflow).toContain('AWIN_PUBLISHER_ID: ${{ secrets.AWIN_PUBLISHER_ID }}');
    expect(workflow).not.toMatch(/git (add|commit|push)/i);
    expect(workflow).toContain('peter-evans/create-pull-request');
    expect(workflow).toContain('merch-revenue/awin-advertiser-map');
    expect(workflow).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(workflow).toContain('apps/web/lib/longlive/awin-advertisers.json');
    expect(workflow).toContain('docs/ops/AFFILIATE-COVERAGE.md');
    expect(readFileSync('scripts/merch-engine/sync-awin-programmes.mjs', 'utf8')).not.toContain(
      "relationship: 'any'",
    );
  });
});
