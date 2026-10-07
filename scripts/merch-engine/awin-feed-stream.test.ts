import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { feedRowBatches, writeFeedStream } from './awin-feed-stream.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { fetchChangedFeeds, rowsFromCsv, syncAwinFeeds } from './sync-awin-feeds.mjs';

const FEED = { feedId: 'f1', advertiserMid: '9', updatedAt: '2026-10-01' };
const CSV =
  'merchant_id,aw_product_id,product_name,description\n9,p1,Dress,"Line one\nLine ""two"", with comma"\r\n9,p2,Hat,plain\n9,,NoId,skipped\n9,p3,Scarf,last';

async function* chunksOf(data: Buffer, size: number) {
  for (let at = 0; at < data.length; at += size) yield data.subarray(at, at + size);
}

async function collect(iterable: AsyncIterable<unknown[]>) {
  const batches: unknown[][] = [];
  for await (const batch of iterable) batches.push(batch);
  return batches;
}

const sqliteSupported = Number(process.versions.node.split('.')[0]) >= 22;

describe('Awin streaming feed parser', () => {
  it('parses identically to the whole-string parser at every chunk boundary, including a split multibyte char and quoted newline', async () => {
    const csv = `${CSV}\n9,p4,Café ☃,snow`;
    const expected = rowsFromCsv(FEED, csv);
    expect(expected).toHaveLength(4);
    for (const size of [1, 2, 3, 5, 7, 11, 64]) {
      const rows = (await collect(feedRowBatches(FEED, chunksOf(Buffer.from(csv), size)))).flat();
      expect(rows).toEqual(expected);
    }
  });

  it('strips a leading UTF-8 BOM so the first header column still matches', async () => {
    const plain = (await collect(feedRowBatches(FEED, chunksOf(Buffer.from(CSV), 64)))).flat();
    expect(plain).toHaveLength(3);
    for (const size of [1, 2, 3, 64]) {
      const withBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(CSV)]);
      const rows = (await collect(feedRowBatches(FEED, chunksOf(withBom, size)))).flat();
      expect(rows).toEqual(plain);
    }
  });

  (sqliteSupported ? it : it.skip)(
    'rolls back and flags a feed that streams cleanly but yields zero rows, with or without old rows',
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'awin-zero-'));
      const indexPath = join(directory, 'index.sqlite');
      const html = Buffer.from('<html>temporary error</html>\n');
      const productIds = async (feedId: string) => {
        const { DatabaseSync } = await import('node:sqlite');
        const database = new DatabaseSync(indexPath);
        const rows = database
          .prepare('SELECT product_id FROM products WHERE feed_id = ?')
          .all(feedId);
        database.close();
        return rows.map((row) => row.product_id);
      };
      try {
        const old = Buffer.from('aw_product_id,product_name\nold1,A\n');
        await writeFeedStream(indexPath, 'f1', feedRowBatches(FEED, chunksOf(old, 8)));
        await expect(
          writeFeedStream(indexPath, 'f1', feedRowBatches(FEED, chunksOf(html, 8))),
        ).rejects.toMatchObject({ feedSource: true, message: expect.stringContaining('0 rows') });
        expect(await productIds('f1')).toEqual(['old1']);
        await expect(
          writeFeedStream(
            indexPath,
            'fresh',
            feedRowBatches({ ...FEED, feedId: 'fresh' }, chunksOf(html, 8)),
          ),
        ).rejects.toMatchObject({ feedSource: true });
        expect(await productIds('fresh')).toEqual([]);
      } finally {
        await rm(directory, { force: true, recursive: true });
      }
    },
  );

  it('emits row batches of the configured size', async () => {
    const csv = `aw_product_id,product_name\n${Array.from({ length: 5 }, (_, i) => `${i},n${i}`).join('\n')}\n`;
    const batches = await collect(
      feedRowBatches(FEED, chunksOf(Buffer.from(csv), 4), { batchSize: 2 }),
    );
    expect(batches.map((batch) => batch.length)).toEqual([2, 2, 1]);
  });

  it('gunzips a feed served as a raw gzip body', async () => {
    const rows = (
      await collect(feedRowBatches(FEED, chunksOf(gzipSync(Buffer.from(CSV)), 9)))
    ).flat();
    expect(rows).toEqual(rowsFromCsv(FEED, CSV));
  });

  it('aborts with a tagged error once decoded bytes or rows pass the cap', async () => {
    await expect(
      collect(feedRowBatches(FEED, chunksOf(Buffer.from(CSV), 8), { maxBytes: 40 })),
    ).rejects.toMatchObject({ feedSource: true, message: expect.stringContaining('size cap') });
    await expect(
      collect(feedRowBatches(FEED, chunksOf(Buffer.from(CSV), 8), { maxRows: 2 })),
    ).rejects.toMatchObject({ feedSource: true, message: expect.stringContaining('row cap') });
  });

  (sqliteSupported ? it : it.skip)(
    'writes batches in one transaction and rolls back to the old rows on a mid-stream error',
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'awin-stream-'));
      const indexPath = join(directory, 'index.sqlite');
      const productIds = async () => {
        const { DatabaseSync } = await import('node:sqlite');
        const database = new DatabaseSync(indexPath);
        const rows = database
          .prepare('SELECT product_id FROM products WHERE feed_id = ? ORDER BY product_id')
          .all('f1');
        database.close();
        return rows.map((row) => row.product_id);
      };
      try {
        const original = 'aw_product_id,product_name\nold1,A\nold2,B\n';
        const first = feedRowBatches(FEED, chunksOf(Buffer.from(original), 6), { batchSize: 1 });
        expect(await writeFeedStream(indexPath, 'f1', first)).toBe(2);
        expect(await productIds()).toEqual(['old1', 'old2']);

        async function* failing() {
          yield [
            { feedId: 'f1', advertiserMid: '9', productId: 'new1', title: 'N', updatedAt: 'x' },
          ];
          throw new Error('connection reset');
        }
        await expect(writeFeedStream(indexPath, 'f1', failing())).rejects.toThrow(
          'connection reset',
        );
        expect(await productIds()).toEqual(['old1', 'old2']);

        const next = 'aw_product_id,product_name\nnew1,X\nnew2,Y\nnew3,Z\n';
        const second = feedRowBatches(FEED, chunksOf(Buffer.from(next), 5), { batchSize: 2 });
        expect(await writeFeedStream(indexPath, 'f1', second)).toBe(3);
        expect(await productIds()).toEqual(['new1', 'new2', 'new3']);
      } finally {
        await rm(directory, { force: true, recursive: true });
      }
    },
  );

  it('aborts and warns on a stalled stream, then continues with the next feed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const rowChunk = new TextEncoder().encode('aw_product_id,product_name\n1,a\n');
    const fetchImpl = vi.fn(async (url: string, init: { signal: AbortSignal }) => {
      if (!url.includes('/slow')) return new Response(rowChunk);
      const body = new ReadableStream({
        start(controller) {
          init.signal.addEventListener('abort', () => controller.error(new Error('aborted')));
          controller.enqueue(rowChunk);
        },
      });
      return new Response(body);
    });
    const failures: { feedId: string; message: string }[] = [];
    const seen: string[] = [];
    const downloaded = await fetchChangedFeeds({
      feeds: [
        { feedId: 'slow', downloadUrl: 'https://f/slow', updatedAt: '1' },
        { feedId: 'ok', downloadUrl: 'https://f/ok', updatedAt: '1' },
      ],
      fetchImpl,
      sleep: async () => undefined,
      idleTimeoutMs: 30,
      failures,
      onFeed: async (feed: { feedId: string; body: AsyncIterable<Buffer> }) => {
        const rows = (await collect(feedRowBatches(feed, feed.body))).flat();
        seen.push(`${feed.feedId}:${rows.length}`);
      },
    });
    warn.mockRestore();
    expect(downloaded.map((feed: { feedId: string }) => feed.feedId)).toEqual(['ok']);
    expect(failures).toEqual([{ feedId: 'slow', message: expect.stringContaining('no data for') }]);
    expect(seen).toEqual(['ok:1']);
  });

  it('skips an oversized feed with a warning, keeps it out of the cache, and still refreshes the others', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'awin-cap-'));
    const cachePath = join(directory, 'cache.json');
    const list =
      'feed id,last imported,url,advertiser id\nbig,2026-10-01,https://f/big,1\nsmall,2026-10-02,https://f/small,2\n';
    const small = 'aw_product_id,product_name\n1,x\n';
    const big = `aw_product_id,product_name\n${'1,y'.repeat(100)}\n`;
    const fetchImpl = vi.fn(
      async (url: string) =>
        new Response(url.includes('list') ? list : url.includes('big') ? big : small),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const drained: Record<string, number> = {};
    const writeFeedImpl = vi.fn(
      async (_path: string, feedId: string, batches: AsyncIterable<unknown[]>) => {
        let rows = 0;
        for await (const batch of batches) rows += batch.length;
        drained[feedId] = rows;
        return rows;
      },
    );
    try {
      await writeFile(cachePath, JSON.stringify({ feeds: { big: '2026-09-01' } }));
      await syncAwinFeeds({
        cachePath,
        indexPath: join(directory, 'i.sqlite'),
        apiKey: 'k',
        fetchImpl,
        writeSqliteImpl: vi.fn(),
        writeFeedImpl,
        maxFeedBytes: 100,
      });
      expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toMatch(
        /::warning::Awin feed big .*size cap/,
      );
      expect(drained).toEqual({ small: 1 });
      expect(JSON.parse(await readFile(cachePath, 'utf8')).feeds).toEqual({
        big: '2026-09-01',
        small: '2026-10-02',
      });
      const lines = log.mock.calls.map((call) => String(call[0]));
      expect(JSON.parse(lines.at(-1) as string)).toMatchObject({
        changedFeeds: 1,
        failedFeeds: 1,
        indexedProducts: 1,
      });
      expect(
        lines.some(
          (line) => line.includes('Awin feed small (advertiser 2)') && line.includes('1 rows'),
        ),
      ).toBe(true);
    } finally {
      warn.mockRestore();
      log.mockRestore();
      await rm(directory, { force: true, recursive: true });
    }
  });
});
