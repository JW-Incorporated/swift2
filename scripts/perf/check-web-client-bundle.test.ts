import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script
import { analyzeChunks, firstLoadChunks, formatTable, parseArgs, sizes } from './check-web-client-bundle.mjs';

const SENTINELS = [
  { kind: 'track', text: 'TRACK SENTINEL' },
  { kind: 'merch', text: 'MERCH SENTINEL' },
];
const chunk = (file: string, text: string) => ({ file, buf: Buffer.from(text) });

describe('check-web-client-bundle pure parts', () => {
  it('parses --max-content-bytes and rejects junk', () => {
    expect(parseArgs([])).toEqual({ maxContentBytes: null });
    expect(parseArgs(['--max-content-bytes', '1500'])).toEqual({ maxContentBytes: 1500 });
    expect(() => parseArgs(['--max-content-bytes', 'x'])).toThrow();
    expect(() => parseArgs(['--max-content-bytes'])).toThrow();
  });

  it('sizes reports raw, gzip and brotli', () => {
    const s = sizes(Buffer.from('a'.repeat(5000)));
    expect(s.raw).toBe(5000);
    expect(s.gzip).toBeLessThan(5000);
    expect(s.brotli).toBeLessThan(5000);
  });

  it('reads the home first-load chunk names from route-bundle-stats (either path separator)', () => {
    const stats = [
      { route: '/', firstLoadChunkPaths: ['.next\\static\\chunks\\a.js', '.next/static/chunks/b.js'] },
      { route: '/x', firstLoadChunkPaths: ['.next/static/chunks/c.js'] },
    ];
    expect(firstLoadChunks(stats, '/')).toEqual(['a.js', 'b.js']);
    expect(firstLoadChunks(stats, '/nope')).toBeNull();
    expect(firstLoadChunks(null, '/')).toBeNull();
  });

  it('attributes sentinel-bearing chunks as content, sorted largest first, with first-load totals', () => {
    const a = analyzeChunks(
      [
        chunk('small.js', 'x'.repeat(10)),
        chunk('big.js', `${'y'.repeat(500)}TRACK SENTINEL`),
        chunk('mid.js', `${'z'.repeat(100)}MERCH SENTINEL`),
      ],
      SENTINELS,
      ['big.js', 'small.js'],
    );
    expect(a.rows.map((r: { file: string }) => r.file)).toEqual(['big.js', 'mid.js', 'small.js']);
    expect(a.rows[0]).toMatchObject({ content: true, kinds: ['track'], firstLoad: true });
    expect(a.rows[1]).toMatchObject({ content: true, kinds: ['merch'], firstLoad: false });
    expect(a.rows[2]).toMatchObject({ content: false, kinds: [] });
    expect(a.total.raw).toBe(10 + 514 + 114);
    expect(a.content.raw).toBe(514 + 114);
    expect(a.firstLoad.raw).toBe(524);
    expect(a.firstLoadContent.raw).toBe(514);
  });

  it('leaves first-load fields null when the manifest is unavailable, and renders a table', () => {
    const a = analyzeChunks([chunk('a.js', 'TRACK SENTINEL')], SENTINELS, null);
    expect(a.firstLoad).toBeNull();
    expect(a.rows[0].firstLoad).toBeNull();
    const table = formatTable(a.rows);
    expect(table.split('\n')[0]).toContain('chunk');
    expect(table).toContain('a.js');
    expect(table).toContain('track');
  });
});
