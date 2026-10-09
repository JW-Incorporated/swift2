import { describe, expect, it } from 'vitest';
import { collectArtUrls } from './art-cache';
import { hasImageMagic, isImageType } from './art-image-guard';
import { ORIGIN } from './art-cache.test-kit';

describe('collectArtUrls options', () => {
  const files = {
    eras: [{ image: '/eras/a.png' }],
    'content:a': {
      items: [
        {
          images: [
            { kind: 'primary', url: 'https://t.example/1.jpg' },
            { kind: 'primary', url: '/m/1.jpg' },
            { kind: 'primary', url: 'http://insecure.example/2.jpg' },
          ],
        },
      ],
    },
    'content:b': { items: [{ images: [{ kind: 'primary', url: 'https://t.example/b.jpg' }] }] },
  };
  it('eraId limits to that era; includeThirdParty adds https third-party primaries', () => {
    expect(collectArtUrls(files, ORIGIN, { eraId: 'a' })).toEqual([`${ORIGIN}/m/1.jpg`]);
    expect(collectArtUrls(files, ORIGIN, { eraId: 'a', includeThirdParty: true })).toEqual(['https://t.example/1.jpg', `${ORIGIN}/m/1.jpg`]);
    expect(collectArtUrls(files, ORIGIN, { eraId: 'zz', includeThirdParty: true })).toEqual([]);
  });
  it('no eraId keeps the base set (covers + first-party) unless third-party is asked for', () => {
    expect(collectArtUrls(files, ORIGIN).sort()).toEqual([`${ORIGIN}/eras/a.png`, `${ORIGIN}/m/1.jpg`]);
    expect(collectArtUrls(files, ORIGIN, { includeThirdParty: true })).toContain('https://t.example/b.jpg');
  });
});

describe('image guard helpers', () => {
  it('matches image/* content types only', () => {
    expect(isImageType('image/jpeg')).toBe(true);
    expect(isImageType('IMAGE/PNG; x=1')).toBe(true);
    expect(isImageType('text/html')).toBe(false);
    expect(isImageType(null)).toBe(false);
  });
  it('rejects short and non-image bytes', () => {
    expect(hasImageMagic(new Uint8Array([0xff, 0xd8, 0xff]))).toBe(true);
    expect(hasImageMagic(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42]))).toBe(false);
    expect(hasImageMagic(new Uint8Array(12))).toBe(false);
  });
});
