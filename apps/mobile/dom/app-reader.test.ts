import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createAppStorage } from './bridge/app-adapter-nav';
import { installStorageShim } from './reader/storage-shim';

const src = readFileSync(new URL('./AppReader.tsx', import.meta.url), 'utf8');

describe('G9 measurement instrumentation survives in AppReader (S2/S4/#4895 path)', () => {
  it.each([
    'speedTestOn',
    'reportImageLoad',
    'setImageLoadListener',
    'createProbe',
    'checkMarkers',
    'countPlaceholders',
    'firstPaintMs',
    'heapMb',
    '[4000, 12000]',
    'reportProbe',
    "addEventListener('error'",
    "addEventListener('unhandledrejection'",
    'e.filename === cacheUri',
    'devLoader',
    'useExpoBridge',
    'reportProtocolFatal',
    'installStorageShim',
    'insetsFromQuery',
  ])('keeps %s', (id) => expect(src).toContain(id));

  it('starts the optional art map without awaiting it (it must never gate the reader paint)', () => {
    expect(src).toContain('void loadArtMap(');
    expect(src).not.toMatch(/await[^\n;]*loadArtMap|Promise\.all\([^\n]*loadArtMap/);
  });

  it('has no remount-on-navigate left (reader state survives a native navigate)', () => {
    expect(src).not.toMatch(/readerKey|setReaderKey/);
  });
});

describe('app storage after the DOM shim (the Android DOM has no storage, G3)', () => {
  const brokenWindow = () => ({
    get localStorage(): unknown {
      throw new Error('SecurityError');
    },
    get sessionStorage(): unknown {
      throw new Error('SecurityError');
    },
  });

  it('is tri-state: null for an absent key once shimmed, undefined only when truly unavailable', () => {
    const win = brokenWindow();
    const unavailable = createAppStorage(() => win.localStorage as never);
    expect(unavailable.get('k')).toBeUndefined();
    const shimmed = installStorageShim(win as never);
    expect(shimmed).toEqual(['localStorage', 'sessionStorage']);
    const storage = createAppStorage(() => (win as unknown as { localStorage: never }).localStorage);
    expect(storage.get('k')).toBeNull();
    storage.set('k', 'v');
    expect(storage.get('k')).toBe('v');
    storage.remove('k');
    expect(storage.get('k')).toBeNull();
  });

  it('reportError stays wired through the error listener (message prefix kept)', () => {
    expect(src).toContain('`error: ${e.message}`');
    expect(src).toContain('`unhandledrejection: ${String(e.reason)}`');
  });
});

describe('persistent storage boot order', () => {
  it('loads the native blob before the reader is set', () => {
    const load = src.indexOf('loadStorageSeed(');
    expect(load).toBeGreaterThan(-1);
    expect(load).toBeLessThan(src.indexOf('setReader(() => reader)'));
  });
});
