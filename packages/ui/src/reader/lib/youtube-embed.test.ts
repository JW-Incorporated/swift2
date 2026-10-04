import { describe, expect, it } from 'vitest';
import { youtubeEmbedSrc } from './youtube-embed';

describe('youtubeEmbedSrc', () => {
  it('web (no embedOrigin): the direct nocookie embed, unchanged', () => {
    expect(youtubeEmbedSrc('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
    );
  });

  it('app (embedOrigin): the wrapper page on that origin', () => {
    expect(youtubeEmbedSrc('dQw4w9WgXcQ', 'https://www.longlivets.com')).toBe(
      'https://www.longlivets.com/embed/youtube/dQw4w9WgXcQ',
    );
    expect(youtubeEmbedSrc('dQw4w9WgXcQ', 'https://www.longlivets.com/')).toBe(
      'https://www.longlivets.com/embed/youtube/dQw4w9WgXcQ',
    );
  });
});
