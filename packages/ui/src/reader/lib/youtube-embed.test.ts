import { describe, expect, it } from 'vitest';
import { youtubeEmbedSrc } from './youtube-embed';

describe('youtubeEmbedSrc', () => {
  it('web (no resolveUrl): the direct nocookie embed, unchanged', () => {
    expect(youtubeEmbedSrc('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
    );
  });

  it('app (resolveUrl): the wrapper page on the canonical origin', () => {
    const resolve = (p: string) => `https://www.longlivets.com${p}`;
    expect(youtubeEmbedSrc('dQw4w9WgXcQ', resolve)).toBe(
      'https://www.longlivets.com/embed/youtube/dQw4w9WgXcQ',
    );
  });
});
