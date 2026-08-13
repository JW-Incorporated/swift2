import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import {
  buildVideoGuide,
  normalizeVideo,
  resolveYoutubeId,
  sortVideos,
  youtubeIdFrom,
  VIDEO_KIND_VALUES,
} from './sync-longlive-videos.mjs';
import { VIDEO_KINDS, APPEARANCE_VIDEO_KINDS } from '@swift2/shared';

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
  symbolism: 'The will as a metaphor for legacy and self-judgment.',
  officialUrl: 'https://www.youtube.com/watch?v=b1kbLwvqugk',
  media: [],
  sources: src,
};

describe('the video kind enum', () => {
  it('mirrors packages/shared exactly — the generator silently NULLs any kind it does not know', () => {
    // A drifted mirror is invisible: normalizeVideo degrades an unknown kind to
    // null rather than throwing, so a value added to the shared enum but not
    // here would ship as an unlabelled card instead of a failure.
    expect([...VIDEO_KIND_VALUES].sort()).toEqual([...VIDEO_KINDS].sort());
  });

  it('keeps the appearance family inside the enum', () => {
    for (const kind of APPEARANCE_VIDEO_KINDS) expect(VIDEO_KIND_VALUES.has(kind)).toBe(true);
  });

  it('pins validate-content.mjs’s copy too — the one nothing else could catch', () => {
    // That script runs under plain `node` (see package.json), so it cannot
    // import the TS shared package and has to hand-copy the list. Nothing type-
    // checks it, and drift breaks BOTH ways: add a kind upstream and the
    // validator hard-errors a legitimate record; drop one and a seed passes
    // validation, gets NULLed by the generator, then fails the DB CHECK at
    // db:seed:videos time. Parsed from source because importing the module
    // would execute the whole validation run.
    const src = readFileSync(new URL('./validate-content.mjs', import.meta.url), 'utf8');
    const block = /const VIDEO_KINDS = new Set\(\[([\s\S]*?)\]\)/.exec(src);
    expect(block, 'VIDEO_KINDS literal not found in validate-content.mjs').toBeTruthy();
    const copied = [...block![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(copied.sort()).toEqual([...VIDEO_KINDS].sort());
  });
});

describe('normalizeVideo — appearance kinds', () => {
  it('carries every appearance kind through instead of nulling it', () => {
    for (const kind of APPEARANCE_VIDEO_KINDS) {
      expect(normalizeVideo({ ...base, kind })?.kind).toBe(kind);
    }
  });

  it('still nulls a kind that is not in the enum', () => {
    expect(normalizeVideo({ ...base, kind: 'red_carpet' })?.kind).toBeNull();
    expect(normalizeVideo({ ...base, kind: 'talk_show' })?.kind).toBeNull();
  });

  it('resolves the embed id for an appearance the same way as for a work', () => {
    const v = normalizeVideo({
      ...base,
      kind: 'interview',
      officialUrl: 'https://www.youtube.com/watch?v=GzjZqH0WRwE',
    });
    expect(v?.youtubeId).toBe('GzjZqH0WRwE');
  });
});

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
      symbolism: 'The will as a metaphor for legacy and self-judgment.',
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
