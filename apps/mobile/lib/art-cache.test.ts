import { describe, expect, it } from 'vitest';
import { artFileName, artMapSource, collectArtUrls, hashUrl } from './art-cache';
import { ORIGIN, u } from './art-cache.test-kit';

describe('url hashing + file names', () => {
  it('is deterministic, distinct per url, and keeps the extension', () => {
    expect(hashUrl(u(1))).toBe(hashUrl(u(1)));
    expect(hashUrl(u(1))).not.toBe(hashUrl(u(2)));
    expect(artFileName(u(1))).toBe(`${hashUrl(u(1))}.png`);
    expect(artFileName(`${ORIGIN}/x/y.JPG?z=1`)).toMatch(/\.jpg$/);
    expect(artFileName(`${ORIGIN}/x/noext`)).toMatch(/\.img$/);
  });
});

describe('collectArtUrls', () => {
  it('takes era covers and first-party primary images only', () => {
    const files = {
      eras: [{ image: '/eras/a.png' }, { image: 'https://cdn.example.com/b.png' }, { image: `${ORIGIN}/eras/c.png` }],
      'content:a': {
        items: [
          { images: [{ kind: 'primary', url: '/m/1.jpg' }, { kind: 'reference', url: '/m/2.jpg' }] },
          { images: [{ kind: 'primary', url: 'https://third.party/3.jpg' }, { kind: 'primary', url: '//evil/4.jpg' }] },
          { images: [{ kind: 'primary', url: '/m/1.jpg' }] },
        ],
      },
      merch: [{ imageUrl: '/merch/1.png' }],
      'content:bad': null,
    };
    expect(collectArtUrls(files, ORIGIN).sort()).toEqual([`${ORIGIN}/eras/a.png`, `${ORIGIN}/eras/c.png`, `${ORIGIN}/m/1.jpg`]);
    expect(collectArtUrls({ eras: 'nope' }, ORIGIN)).toEqual([]);
  });
});

describe('artMapSource', () => {
  it('is a single globalThis assignment of the url->uri map', () => {
    const src = artMapSource({ [u(1)]: 'file:///a.png' });
    expect(src.startsWith('globalThis.__swift2ArtMap=')).toBe(true);
    const g = {} as { __swift2ArtMap?: unknown };
    new Function('globalThis', src)(g);
    expect(g.__swift2ArtMap).toEqual({ [u(1)]: 'file:///a.png' });
    expect(artMapSource({ a: ' ' })).not.toContain(' ');
  });
});
