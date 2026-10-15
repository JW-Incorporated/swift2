import { describe, expect, it } from 'vitest';
import {
  hammingDistance,
  normalizeUrl,
  TITLE_SIMHASH_DUPLICATE_THRESHOLD,
  titleSimhash,
  urlNormHash,
} from './fingerprint.mjs';

describe('Tidewatch URL fingerprints', () => {
  it('upgrades HTTP to HTTPS', () => {
    expect(normalizeUrl('http://example.com/Story')).toBe('https://example.com/Story');
  });

  it('removes common mobile and web host prefixes', () => {
    for (const prefix of ['www.', 'm.', 'mobile.']) {
      expect(normalizeUrl(`https://${prefix}example.com/Story`)).toBe('https://example.com/Story');
    }
  });

  it('normalizes AMP host, path, and query variants', () => {
    const canonical = 'https://example.com/News/Story';
    expect(normalizeUrl('https://amp.example.com/News/Story')).toBe(canonical);
    expect(normalizeUrl('https://example.com/News/Story/amp')).toBe(canonical);
    expect(normalizeUrl('https://example.com/News/Story?amp')).toBe(canonical);
  });

  it('removes tracking parameters while retaining and sorting content parameters', () => {
    expect(normalizeUrl('https://example.com/Story?utm_source=x&fbclid=f&gclid=g&si=s&igsh=i&b=2&a=1#top'))
      .toBe('https://example.com/Story?a=1&b=2');
  });

  it('removes a non-root trailing slash', () => {
    expect(normalizeUrl('https://example.com/News/Story/')).toBe('https://example.com/News/Story');
  });

  it('normalizes youtu.be IDs to youtube.com watch URLs', () => {
    expect(normalizeUrl('https://youtu.be/dQw4w9WgXcQ?si=share'))
      .toBe(normalizeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
  });

  it('preserves case-sensitive YouTube and Instagram path identifiers', () => {
    expect(urlNormHash('https://youtu.be/dQw4w9WgXcQ')).not.toBe(urlNormHash('https://youtu.be/dqw4w9wgxcq'));
    expect(urlNormHash('https://instagram.com/p/AbCd12')).not.toBe(urlNormHash('https://instagram.com/p/abcd12'));
  });
});

describe('Tidewatch title fingerprints', () => {
  it('strips only known publisher suffixes', () => {
    const title = 'Taylor Swift announces new album at midnight';
    expect(titleSimhash(`${title} | Billboard`)).toBe(titleSimhash(title));
    expect(titleSimhash(`${title} - Rolling Stone`)).toBe(titleSimhash(title));
    expect(titleSimhash('Taylor Swift - Cardigan (Official Video)'))
      .not.toBe(titleSimhash('Taylor Swift'));
  });

  it('keeps a measured same-story paraphrase within the duplicate threshold', () => {
    const distance = hammingDistance(
      titleSimhash('Taylor Swift announces new album at midnight')!,
      titleSimhash('Taylor Swift reveals new album arriving at midnight')!,
    );
    expect(distance).toBe(14);
    expect(distance).toBeLessThanOrEqual(TITLE_SIMHASH_DUPLICATE_THRESHOLD);
  });

  it('keeps different stories beyond the duplicate threshold', () => {
    const album = titleSimhash('Taylor Swift announces new album at midnight')!;
    const donation = titleSimhash('Taylor Swift donates to food bank after concert')!;
    const cardigan = titleSimhash('Taylor Swift - Cardigan (Official Video)')!;
    const willow = titleSimhash('Taylor Swift - Willow (Official Video)')!;
    expect(hammingDistance(album, donation)).toBe(18);
    expect(hammingDistance(album, donation)).toBeGreaterThan(TITLE_SIMHASH_DUPLICATE_THRESHOLD);
    expect(hammingDistance(cardigan, willow)).toBe(19);
    expect(hammingDistance(cardigan, willow)).toBeGreaterThan(TITLE_SIMHASH_DUPLICATE_THRESHOLD);
  });
});
