import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkMarkers, countPlaceholders, createProbe, probeLines } from './probe';

describe('countPlaceholders', () => {
  it('counts tiny and errored images per host and skips unfinished loads', () => {
    const out = countPlaceholders([
      { src: 'https://a.example/x.jpg', complete: true, naturalWidth: 800 },
      { src: 'https://a.example/y.jpg', complete: true, naturalWidth: 1 },
      { src: 'https://b.example/z.jpg', complete: true, naturalWidth: 0, errored: true },
      { src: 'https://b.example/w.jpg', complete: false, naturalWidth: 0 },
      { src: 'not a url', complete: true, naturalWidth: 10 },
    ]);
    expect(out).toEqual({
      'a.example': { total: 2, bad: 1 },
      'b.example': { total: 1, bad: 1 },
      invalid: { total: 1, bad: 0 },
    });
  });

  it('treats naturalWidth 2 as a placeholder and 3 as real', () => {
    const out = countPlaceholders([
      { src: 'https://a.example/1', complete: true, naturalWidth: 2 },
      { src: 'https://a.example/2', complete: true, naturalWidth: 3 },
    ]);
    expect(out['a.example']).toEqual({ total: 2, bad: 1 });
  });
});

describe('probe recorder', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('records read attempts and renders panel lines', () => {
    const p = createProbe('abcdef0123456789');
    p.attempts([
      { method: 'fetch', ok: false },
      { method: 'xhr', ok: true },
    ]);
    p.report.snapshot = { hash: 'h'.repeat(64), items: 3, eras: 2 };
    expect(p.report.read).toEqual({ fetch: 'fail', xhr: 'ok', script: 'n/a' });
    const lines = probeLines(JSON.parse(p.json()));
    expect(lines).toContain('Read: fetch fail, xhr ok, script n/a');
    expect(lines.some((l) => l.startsWith('Snapshot: hhhhhhhhhhhh (3 items, 2 eras)'))).toBe(true);
  });

  it('reports the previous launch marker as a hit, then writes the current one', async () => {
    const store = new Map<string, string>([['wp05-marker', 'v1']]);
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    });
    const p = createProbe();
    await checkMarkers('v1', p);
    expect(p.report.marker.localStorage).toBe('hit');
    expect(p.report.storage.indexedDB).toBe('absent');
    await checkMarkers('v2', p);
    expect(p.report.marker.localStorage).toBe('miss');
    expect(store.get('wp05-marker')).toBe('v2');
  });
});
