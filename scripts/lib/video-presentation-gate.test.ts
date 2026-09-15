import { describe, expect, it } from 'vitest';
import { videoPresentationErrors } from './video-presentation-gate.mjs';

const YOUTUBE_URLS = [
  ['watch query', 'https://www.youtube.com/watch?v=abcdefghijk'],
  ['short link', 'https://youtu.be/bcdefghijkl'],
  ['shorts path', 'https://www.youtube.com/shorts/cdefghijklm'],
  ['embed path', 'https://www.youtube.com/embed/defghijklmn'],
] as const;

const officialSource = (url: string) => [{ source_type: 'official', url }];

describe('videoPresentationErrors', () => {
  it.each(YOUTUBE_URLS)('rejects an official %s URL without a matching player', (_form, url) => {
    expect(videoPresentationErrors({ sources: officialSource(url) })).toHaveLength(1);
  });

  it.each(YOUTUBE_URLS)('accepts a matching player for an official %s URL', (_form, url) => {
    const youtubeId =
      new URL(url).hostname === 'youtu.be'
        ? new URL(url).pathname.slice(1)
        : url.includes('watch?')
          ? new URL(url).searchParams.get('v')
          : new URL(url).pathname.split('/').at(-1);

    expect(
      videoPresentationErrors({
        sources: officialSource(url),
        video: { youtubeId },
      }),
    ).toEqual([]);
  });

  it('rejects a player whose ID differs from the official source', () => {
    expect(
      videoPresentationErrors({
        sources: officialSource('https://www.youtube.com/watch?v=abcdefghijk'),
        video: { youtubeId: 'bcdefghijkl' },
      }),
    ).toEqual([
      'video.youtubeId "bcdefghijkl" does not match the official YouTube source (abcdefghijk) — do not attach unrelated footage',
    ]);
  });

  it('allows an explicit presentation exception without a player', () => {
    expect(
      videoPresentationErrors({
        sources: officialSource('https://www.youtube.com/shorts/abcdefghijk'),
        videoPresentationException: 'rights',
      }),
    ).toEqual([]);
  });
});
