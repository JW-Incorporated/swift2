import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkMarkers, countPlaceholders, createProbe, latestProbeJson, probeLines, setLatestProbeJson, withNativeTiming } from './probe';

describe('countPlaceholders', () => {
  it('counts tiny and errored images per host and reports unfinished loads as pending', () => {
    const out = countPlaceholders([
      { src: 'https://a.example/x.jpg', complete: true, naturalWidth: 800 },
      { src: 'https://a.example/y.jpg', complete: true, naturalWidth: 1 },
      { src: 'https://b.example/z.jpg', complete: true, naturalWidth: 0, errored: true },
      { src: 'https://b.example/w.jpg', complete: false, naturalWidth: 0 },
      { src: 'not a url', complete: true, naturalWidth: 10 },
    ]);
    expect(out).toEqual({
      'a.example': { total: 2, bad: 1, pending: 0 },
      'b.example': { total: 1, bad: 1, pending: 1 },
      invalid: { total: 1, bad: 0, pending: 0 },
    });
  });

  it('treats naturalWidth 2 as a placeholder and 3 as real', () => {
    const out = countPlaceholders([
      { src: 'https://a.example/1', complete: true, naturalWidth: 2 },
      { src: 'https://a.example/2', complete: true, naturalWidth: 3 },
    ]);
    expect(out['a.example']).toEqual({ total: 2, bad: 1, pending: 0 });
  });
});

describe('native timing + export', () => {
  it('stamps the native delta and labels both clocks', () => {
    const p = createProbe('v');
    p.report.firstPaintMs = 800;
    const merged = withNativeTiming(p.json(), 1234);
    expect(JSON.parse(merged).nativeLaunchToReadyMs).toBe(1234);
    expect(withNativeTiming(p.json(), null)).toBe(p.json());
    const lines = probeLines(JSON.parse(merged));
    expect(lines).toContain('Webview first paint ms: 800, heap - MB');
    expect(lines).toContain('Native launch->ready ms: 1234');
  });

  it('keeps the exact exported JSON', () => {
    setLatestProbeJson('{"a":1}');
    expect(latestProbeJson()).toBe('{"a":1}');
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
    expect(lines).toContain('Storage: localStorage present, indexedDB absent, adapter memory-shim');
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
    expect(p.report.adapter).toBe('localStorage');
    await checkMarkers('v2', p);
    expect(p.report.marker.localStorage).toBe('miss');
    expect(store.get('wp05-marker')).toBe('v2');
  });

  it('falls back to the memory shim when localStorage is shimmed and there is no indexedDB', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: () => {} } });
    const p = createProbe();
    p.report.storage.localStorage = 'shimmed';
    await checkMarkers('v1', p);
    expect(p.report.adapter).toBe('memory-shim');
  });

  it('prints pending images in the panel line', () => {
    const p = createProbe();
    p.report.placeholders = { 'a.example': { total: 3, bad: 1, pending: 2 } };
    expect(probeLines(p.report)).toContain('Placeholder images (bad/total): a.example 1/3 (+2 pending)');
  });
});
