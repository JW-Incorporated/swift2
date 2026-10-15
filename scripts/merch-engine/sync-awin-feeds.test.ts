import { readFile } from 'node:fs/promises';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { syncAwinFeeds } from './sync-awin-feeds.mjs';

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
});
