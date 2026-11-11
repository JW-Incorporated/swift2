import { readFile } from 'node:fs/promises';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { rebuildFtsIndex, syncAwinFeeds, writeSqlite } from './sync-awin-feeds.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .mjs script, no declaration file
import { writeFeedStream } from './awin-feed-stream.mjs';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function temporaryCache(cache: object) {
  const directory = await mkdtemp(join(tmpdir(), 'awin-partial-cache-'));
  temporaryDirectories.push(directory);
  const cachePath = join(directory, 'cache.json');
  await writeFile(cachePath, `${JSON.stringify(cache)}\n`);
  return { cachePath, indexPath: join(directory, 'index.sqlite') };
}

function product(feedId: string, advertiserMid: string, title: string) {
  return {
    feedId,
    advertiserMid,
    productId: `${feedId}-product`,
    title,
    description: '',
    brand: '',
    updatedAt: '2026-10-01',
  };
}

async function ftsTitles(indexPath: string) {
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(indexPath);
  try {
    return database.prepare('SELECT title FROM products_fts ORDER BY title').all();
  } finally {
    database.close();
  }
}

describe('Awin feed progress', () => {
  it('persists each completed feed before a simulated mid-run kill', async () => {
    const { cachePath, indexPath } = await temporaryCache({
      feeds: { a: '2026-10-01', b: '2026-10-01', retired: '2026-09-01' },
    });
    const directory = [
      'feed id,last imported,url,advertiser id',
      'a,2026-10-02,https://feeds.example/a.csv,1',
      'b,2026-10-02,https://feeds.example/b.csv,2',
    ].join('\n');
    const fetchImpl = vi.fn((url: string) =>
      Promise.resolve(
        new Response(url.includes('datafeed/list') ? directory : 'aw_product_id,product_name\n1,Dress'),
      ),
    );
    const writeFeedImpl = vi.fn(async (_path: string, feedId: string) => {
      if (feedId === 'b') throw new Error('simulated kill');
      return 1;
    });

    await expect(
      syncAwinFeeds({
        cachePath,
        indexPath,
        apiKey: 'test',
        fetchImpl,
        writeFeedImpl,
        writeSqliteImpl: vi.fn(),
        joinedAdvertiserIds: new Set(['1', '2']),
        requestIntervalMs: 0,
      }),
    ).rejects.toThrow('simulated kill');

    expect(JSON.parse(await readFile(cachePath, 'utf8'))).toEqual({
      feeds: { a: '2026-10-02', b: '2026-10-01', retired: '2026-09-01' },
      ftsDirty: true,
    });
  });

  it('skips the feed API when no advertisers are joined', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const fetchImpl = vi.fn();

    await syncAwinFeeds({ fetchImpl, joinedAdvertiserIds: new Set() });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('no joined advertisers, skipping feeds');
  });

  const sqliteSupported = Number(process.versions.node.split('.')[0]) >= 22;

  (sqliteSupported ? it : it.skip)('rolls back a mid-rebuild failure and preserves the old FTS index', async () => {
    const { indexPath } = await temporaryCache({ feeds: {} });
    await writeSqlite(indexPath, [product('a', '1', 'Old Dress')], ['a']);
    await writeSqlite(indexPath, [product('a', '1', 'New Dress')], ['a'], { rebuildFts: false });
    const { DatabaseSync } = await import('node:sqlite');
    const database = new DatabaseSync(indexPath);

    expect(() => rebuildFtsIndex(database, () => { throw new Error('simulated rebuild failure'); }))
      .toThrow('simulated rebuild failure');
    database.close();

    expect(await ftsTitles(indexPath)).toEqual([{ title: 'Old Dress' }]);
  });

  (sqliteSupported ? it : it.skip)('rejects a zero-row FTS rebuild and preserves the old index', async () => {
    const { indexPath } = await temporaryCache({ feeds: {} });
    await writeSqlite(indexPath, [product('a', '1', 'Old Dress')], ['a']);
    await writeSqlite(indexPath, [product('a', '1', 'New Dress')], ['a'], { rebuildFts: false });
    const { DatabaseSync } = await import('node:sqlite');
    const database = new DatabaseSync(indexPath);

    expect(() => rebuildFtsIndex(database, (current: InstanceType<typeof DatabaseSync>) => {
      current.exec('DELETE FROM products_fts');
    })).toThrow('FTS rebuild produced 0 rows for 1 products; old index preserved');
    database.close();

    expect(await ftsTitles(indexPath)).toEqual([{ title: 'Old Dress' }]);
  });

  (sqliteSupported ? it : it.skip)('stops inside a large feed and persists completed-feed progress', async () => {
    const { cachePath, indexPath } = await temporaryCache({
      feeds: { a: '2026-10-01', b: '2026-10-01' },
    });
    await writeSqlite(indexPath, [product('a', '1', 'Old A'), product('b', '2', 'Old B')], ['a', 'b']);
    const directory = [
      'feed id,last imported,url,advertiser id',
      'a,2026-10-02,https://feeds.example/a.csv,1',
      'b,2026-10-02,https://feeds.example/b.csv,2',
    ].join('\n');
    const largeFeed = [
      'merchant_id,aw_product_id,product_name',
      ...Array.from({ length: 2_001 }, (_, index) => `2,b-${index},Dress ${index}`),
    ].join('\n');
    const fetchImpl = vi.fn((url: string) => Promise.resolve(new Response(
      url.includes('datafeed/list')
        ? directory
        : url.endsWith('/a.csv') ? 'merchant_id,aw_product_id,product_name\n1,a-product,New A' : largeFeed,
    )));
    let clock = 0;
    const writeFeedImpl = async (path: string, feedId: string, batches: AsyncIterable<unknown[]>) => {
      async function* advanceClock() {
        for await (const batch of batches) {
          yield batch;
          if (feedId === 'b') clock = 10;
        }
      }
      return writeFeedStream(path, feedId, advanceClock());
    };

    await syncAwinFeeds({
      cachePath,
      indexPath,
      apiKey: 'test',
      fetchImpl,
      writeFeedImpl,
      deadlineMs: 5,
      now: () => clock,
      requestIntervalMs: 0,
    });

    expect(JSON.parse(await readFile(cachePath, 'utf8')).feeds).toEqual({
      a: '2026-10-02',
      b: '2026-10-01',
    });
    expect(await ftsTitles(indexPath)).toEqual([{ title: 'New A' }, { title: 'Old B' }]);
  });
});
