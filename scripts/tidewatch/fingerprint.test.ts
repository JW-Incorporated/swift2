import { describe, expect, it } from 'vitest';
import { hammingDistance, normalizeUrl, titleSimhash, urlNormHash } from './fingerprint.mjs';

describe('Tidewatch fingerprints', () => {
  it('normalizes case, parameter order, fragments, and tracking parameters', () => {
    expect(normalizeUrl('HTTPS://Example.COM/News/Story/?utm_source=x&b=2&a=1#top')).toBe(
      'https://example.com/news/story?a=1&b=2',
    );
    expect(urlNormHash('https://example.com/NEWS/story?b=2&a=1')).toBe(
      urlNormHash('https://EXAMPLE.com/news/story/?a=1&b=2&utm_medium=social'),
    );
  });

  it('is stable and keeps near-duplicate title variants within distance three', () => {
    const base = titleSimhash('Taylor Swift announces new album at midnight');
    const repeat = titleSimhash('Taylor Swift announces new album at midnight');
    const syndicated = titleSimhash('Taylor Swift announces new album at midnight — Example News');
    expect(base).toHaveLength(64);
    expect(repeat).toBe(base);
    expect(hammingDistance(base!, syndicated!)).toBeLessThanOrEqual(3);
  });
});
