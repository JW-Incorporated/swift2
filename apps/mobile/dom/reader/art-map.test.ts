import { beforeEach, describe, expect, it } from 'vitest';
import { artSrc, artStats, loadArtMap, noteArtFallback, noteArtLoaded, resetArtMapForTests } from './art-map';

const ORIGIN = 'https://www.longlivets.com';
const g = globalThis as unknown as Record<string, unknown>;

function fakeDoc(outcome: 'load' | 'error' | 'hang', map?: unknown) {
  const el: Record<string, unknown> = { remove: () => {} };
  const doc = {
    createElement: () => el,
    head: {
      appendChild: () => {
        if (outcome === 'load') {
          g.__swift2ArtMap = map;
          queueMicrotask(() => (el.onload as () => void)());
        } else if (outcome === 'error') queueMicrotask(() => (el.onerror as () => void)());
      },
    },
  };
  return { doc: doc as unknown as Document, el };
}

beforeEach(() => {
  resetArtMapForTests();
  delete g.__swift2ArtMap;
});

describe('art map (DOM side)', () => {
  it('loads the script twin and resolves relative and absolute keys', async () => {
    const { doc, el } = fakeDoc('load', { [`${ORIGIN}/eras/a.png`]: 'file:///art/a.png' });
    await loadArtMap('file:///art/art-map.js?v=1', doc);
    expect(el.src).toBe('file:///art/art-map.js?v=1');
    expect(artSrc('/eras/a.png', ORIGIN)).toBe('file:///art/a.png');
    expect(artSrc(`${ORIGIN}/eras/a.png`, ORIGIN)).toBe('file:///art/a.png');
    expect(artSrc('/eras/other.png', ORIGIN)).toBeNull();
    expect(artSrc('https://third.party/x.png', ORIGIN)).toBeNull();
    expect(artSrc('constructor', ORIGIN)).toBeNull();
  });

  it('a missing uri, script error or timeout leaves an empty map and never rejects', async () => {
    await loadArtMap(undefined);
    await loadArtMap('file:///x.js', fakeDoc('error').doc);
    await loadArtMap('file:///x.js', fakeDoc('hang').doc, 5);
    expect(artSrc('/eras/a.png', ORIGIN)).toBeNull();
    expect(artStats()).toBeNull();
  });

  it('ignores a non-object map global', async () => {
    await loadArtMap('file:///x.js', fakeDoc('load', 'oops').doc);
    expect(artSrc('/a.png', ORIGIN)).toBeNull();
  });

  it('counts loads and fallbacks for diagnostics', async () => {
    await loadArtMap('file:///x.js', fakeDoc('load', { a: 'b' }).doc);
    noteArtLoaded();
    noteArtLoaded();
    noteArtFallback();
    expect(artStats()).toEqual({ map: 1, loaded: 2, fallback: 1 });
  });
});
