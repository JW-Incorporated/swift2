import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import {
  buildVideoGuide,
  normalizeVideo,
  resolveYoutubeId,
  sortVideos,
  youtubeIdFrom,
} from './sync-longlive-videos.mjs';

const src = [{ source_url: 'https://en.wikipedia.org/wiki/Example', source_title: 'Example', publisher: 'Wikipedia' }];

const base = {
  slug: 'anti-hero-mv',
  kind: 'music_video',
  title: 'Anti-Hero',
  director: 'Taylor Swift',
  releasedOn: '2022-10-21',
  relatedSongs: ['Anti-Hero'],
  summary: 'Release-day centerpiece.',
  easterEggs: ['The will scene.'],
  officialUrl: 'https://www.youtube.com/watch?v=b1kbLwvqugk',
  media: [],
  sources: src,
};

describe('youtubeIdFrom', () => {
  it('extracts the id from the canonical URL shapes', () => {
    expect(youtubeIdFrom('https://www.youtube.com/watch?v=b1kbLwvqugk')).toBe('b1kbLwvqugk');
    expect(youtubeIdFrom('https://youtu.be/b1kbLwvqugk')).toBe('b1kbLwvqugk');
    expect(youtubeIdFrom('https://www.youtube.com/embed/b1kbLwvqugk')).toBe('b1kbLwvqugk');
    expect(youtubeIdFrom('https://m.youtube.com/watch?v=b1kbLwvqugk&t=10')).toBe('b1kbLwvqugk');
    expect(youtubeIdFrom('https://www.youtube.com/shorts/b1kbLwvqugk')).toBe('b1kbLwvqugk');
  });

  it('rejects non-YouTube hosts and malformed ids — a bogus id must never reach an embed', () => {
    expect(youtubeIdFrom('https://vimeo.com/watch?v=b1kbLwvqugk')).toBeNull();
    expect(youtubeIdFrom('https://evilyoutube.com/watch?v=b1kbLwvqugk')).toBeNull();
    expect(youtubeIdFrom('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(youtubeIdFrom('https://www.youtube.com/watch')).toBeNull();
    expect(youtubeIdFrom('not a url')).toBeNull();
    expect(youtubeIdFrom(null)).toBeNull();
  });
});

describe('resolveYoutubeId', () => {
  it('prefers the oEmbed-verified youtube media entry over officialUrl', () => {
    expect(
      resolveYoutubeId({
        media: [
          { kind: 'oembed', provider: 'youtube', post_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' },
        ],
        officialUrl: 'https://www.youtube.com/watch?v=BBBBBBBBBBB',
      }),
    ).toBe('AAAAAAAAAAA');
  });

  it('falls back to officialUrl and skips non-youtube media', () => {
    expect(
      resolveYoutubeId({
        media: [{ kind: 'oembed', provider: 'instagram', post_url: 'https://instagram.com/p/x' }],
        officialUrl: 'https://youtu.be/BBBBBBBBBBB',
      }),
    ).toBe('BBBBBBBBBBB');
    expect(resolveYoutubeId({ media: [], officialUrl: null })).toBeNull();
  });
});

describe('normalizeVideo', () => {
  it('normalizes a seed-shape video into the UI VideoNote shape', () => {
    expect(normalizeVideo({ ...base, title: '  Anti-Hero ' })).toEqual({
      slug: 'anti-hero-mv',
      kind: 'music_video',
      title: 'Anti-Hero',
      director: 'Taylor Swift',
      releasedOn: '2022-10-21',
      relatedSongs: ['Anti-Hero'],
      summary: 'Release-day centerpiece.',
      easterEggs: ['The will scene.'],
      youtubeId: 'b1kbLwvqugk',
      sources: [{ name: 'Example', url: 'https://en.wikipedia.org/wiki/Example' }],
    });
  });

  it('accepts DB snake_case column names', () => {
    const v = normalizeVideo({
      slug: 'x-mv',
      kind: 'tour_film',
      title: 'X',
      released_on: '2023-10-13',
      related_songs: ['X'],
      easter_eggs: ['egg'],
      official_url: 'https://www.youtube.com/watch?v=b1kbLwvqugk',
      sources: src,
    });
    expect(v?.releasedOn).toBe('2023-10-13');
    expect(v?.relatedSongs).toEqual(['X']);
    expect(v?.easterEggs).toEqual(['egg']);
    expect(v?.youtubeId).toBe('b1kbLwvqugk');
  });

  it('degrades gracefully: unknown kind, bad date, blank summary, and no embed become null', () => {
    const v = normalizeVideo({
      ...base,
      kind: 'vlog',
      releasedOn: 'October 2022',
      summary: '  ',
      officialUrl: null,
      media: [],
    });
    expect(v).toMatchObject({ kind: null, releasedOn: null, summary: null, youtubeId: null });
  });

  it('drops works missing slug, title, or a real source', () => {
    expect(normalizeVideo({ ...base, slug: ' ' })).toBeNull();
    expect(normalizeVideo({ ...base, title: '' })).toBeNull();
    expect(normalizeVideo({ ...base, sources: [] })).toBeNull();
  });
});

describe('sortVideos', () => {
  it('orders by release date ascending with undated works last, ties alphabetical', () => {
    const mk = (title: string, releasedOn: string | null) => ({ ...base, title, releasedOn });
    const sorted = sortVideos([
      mk('Zeta doc', null),
      mk('Late', '2023-01-01'),
      mk('Alpha doc', null),
      mk('Early', '2022-01-01'),
      mk('Also early', '2022-01-01'),
    ]);
    expect(sorted.map((v) => v.title)).toEqual(['Also early', 'Early', 'Late', 'Alpha doc', 'Zeta doc']);
  });
});

describe('buildVideoGuide', () => {
  it('maps seed era slugs to LongLive EraIds and passes matching slugs through', () => {
    const byEra = buildVideoGuide([
      { eraSlug: 'tortured-poets', ...base, slug: 'a' },
      { eraSlug: 'the-life-of-a-showgirl', ...base, slug: 'b' },
      { eraSlug: '1989', ...base, slug: 'c' },
    ]);
    expect(Object.keys(byEra).sort()).toEqual(['1989', 'tloas', 'ttpd']);
  });

  it('de-dupes repeated slugs within an era (first wins) and sorts by release date', () => {
    const byEra = buildVideoGuide([
      { eraSlug: 'red', ...base, slug: 'one', title: 'First', releasedOn: '2013-01-01' },
      { eraSlug: 'red', ...base, slug: 'two', title: 'Second', releasedOn: '2012-01-01' },
      { eraSlug: 'red', ...base, slug: 'one', title: 'Dupe', releasedOn: '2011-01-01' },
    ]);
    expect(byEra.red.map((v) => v.title)).toEqual(['Second', 'First']);
  });
});
