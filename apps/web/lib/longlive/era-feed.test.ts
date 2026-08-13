import { describe, expect, it } from 'vitest';
import {
  embeddedYoutubeIds,
  inlineVideoMomentIds,
  mergeEraFeed,
  visibleMoments,
  visibleVideos,
  watchableCount,
  undatedAnchorDate,
  type EraFeedFilter,
} from './era-feed';
import type { ContentItem, ContentTag, VideoNote } from './types';

const moment = (
  id: string,
  date: string,
  tags: ContentTag[],
  video?: { youtubeId: string; title: string },
): ContentItem =>
  ({
    id,
    eraId: 'lover',
    date,
    dateLabel: date,
    title: id,
    summary: '',
    tags,
    image: '',
    ...(video ? { video } : {}),
  }) as unknown as ContentItem;

const video = (slug: string, kind: VideoNote['kind'], releasedOn: string | null): VideoNote =>
  ({
    slug,
    kind,
    title: slug,
    director: null,
    releasedOn,
    relatedSongs: [],
    summary: null,
    easterEggs: [],
    symbolism: null,
    youtubeId: `yt-${slug}`,
    sources: [],
  }) as unknown as VideoNote;

const filterOf = (tags: ContentTag[], videosOnly = false): EraFeedFilter => ({
  tags: new Set(tags),
  videosOnly,
});

const ITEMS = [
  moment('m-lore', '2019-08-23', ['Lore']),
  moment('m-fashion', '2019-08-26', ['Fashion']),
  moment('m-music-with-video', '2019-06-17', ['Music'], { youtubeId: 'yt-mv-you-need', title: 'x' }),
];

/** The tloas duplicate-embed shape (#2057): two moments, one music video. The
 * newer beat is the one ABOUT the video; the older merely references it. */
const DUPLICATE_EMBED_ITEMS = [
  moment('m-premiere', '2026-03-31', ['Music'], { youtubeId: 'yt-liz', title: 'Elizabeth Taylor' }),
  moment('m-radio', '2026-03-09', ['Music'], { youtubeId: 'yt-liz', title: 'Elizabeth Taylor' }),
];

const MUSIC_VIDEOS = [video('mv-lover', 'music_video', '2019-08-22')];
const ALL_VIDEOS = [
  video('mv-lover', 'music_video', '2019-08-22'),
  video('vmas-2019', 'award_speech', '2019-08-26'),
  video('amas-2019', 'award_speech', '2019-11-24'),
  video('undated-film', 'tour_film', null),
];

describe('visibleMoments', () => {
  it('shows everything when no filter is active', () => {
    expect(visibleMoments(ITEMS, filterOf([]))).toBe(ITEMS); // same reference, no allocation
  });

  it('selects by tag when tags are active', () => {
    expect(visibleMoments(ITEMS, filterOf(['Fashion'])).map((i) => i.id)).toEqual(['m-fashion']);
  });

  it('under the Videos filter keeps only moments that carry footage', () => {
    expect(visibleMoments(ITEMS, filterOf([], true)).map((i) => i.id)).toEqual([
      'm-music-with-video',
    ]);
  });

  it('lets the Videos filter win over any stale tag selection', () => {
    expect(visibleMoments(ITEMS, filterOf(['Fashion'], true)).map((i) => i.id)).toEqual([
      'm-music-with-video',
    ]);
  });

  it('shows one card per video, not one per moment, when two moments share an embed', () => {
    // The tloas shape (#2057): the Videos filter offered four cards for two
    // videos. Only the newer moment of each pair survives it.
    expect(visibleMoments(DUPLICATE_EMBED_ITEMS, filterOf([], true)).map((i) => i.id)).toEqual([
      'm-premiere',
    ]);
  });

  it('still shows the deferring moment in the unfiltered feed — no text is lost', () => {
    expect(visibleMoments(DUPLICATE_EMBED_ITEMS, filterOf([])).map((i) => i.id)).toEqual([
      'm-premiere',
      'm-radio',
    ]);
  });
});

describe('inlineVideoMomentIds', () => {
  it('gives the embed to the first moment in feed order (newest wins)', () => {
    expect([...inlineVideoMomentIds(DUPLICATE_EMBED_ITEMS)]).toEqual(['m-premiere']);
  });

  it('is order-independent — seed order does not decide the owner', () => {
    const reversed = [...DUPLICATE_EMBED_ITEMS].reverse();
    expect([...inlineVideoMomentIds(reversed)]).toEqual(['m-premiere']);
  });

  it('leaves moments embedding different videos alone', () => {
    const items = [
      moment('m-a', '2026-03-31', ['Music'], { youtubeId: 'yt-a', title: 'A' }),
      moment('m-b', '2026-03-09', ['Music'], { youtubeId: 'yt-b', title: 'B' }),
    ];
    expect([...inlineVideoMomentIds(items)].sort()).toEqual(['m-a', 'm-b']);
  });

  it('owns nothing for a moment with no footage', () => {
    expect(inlineVideoMomentIds([moment('m-plain', '2019-08-23', ['Lore'])]).size).toBe(0);
  });

  it('keeps the chip badge honest — watchableCount counts cards, not embeds', () => {
    // watchableCount runs through visibleMoments, so the de-dupe reaches the
    // number on the Videos chip too: 2 moments sharing 1 video promise 1 card.
    expect(watchableCount(DUPLICATE_EMBED_ITEMS, [])).toBe(1);
  });
});

describe('visibleVideos', () => {
  it('merges only the music videos by default (issue #439 behaviour is unchanged)', () => {
    expect(visibleVideos(MUSIC_VIDEOS, ALL_VIDEOS, filterOf([])).map((v) => v.slug)).toEqual([
      'mv-lover',
    ]);
  });

  it('keeps music videos under the Music tag', () => {
    expect(visibleVideos(MUSIC_VIDEOS, ALL_VIDEOS, filterOf(['Music'])).map((v) => v.slug)).toEqual([
      'mv-lover',
    ]);
  });

  it('drops video entries under an unrelated category filter', () => {
    expect(visibleVideos(MUSIC_VIDEOS, ALL_VIDEOS, filterOf(['Fashion']))).toEqual([]);
  });

  it('shows every kind — appearances included — under the Videos filter', () => {
    expect(visibleVideos(MUSIC_VIDEOS, ALL_VIDEOS, filterOf([], true)).map((v) => v.slug)).toEqual([
      'mv-lover',
      'vmas-2019',
      'amas-2019',
      'undated-film',
    ]);
  });
});

describe('mergeEraFeed', () => {
  it('interleaves moments and videos newest-first rather than concatenating', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(entries.map((e) => (e.kind === 'moment' ? e.item.id : e.video.slug))).toEqual([
      'm-fashion', // 2019-08-26
      'm-lore', // 2019-08-23
      'mv-lover', // 2019-08-22
      'm-music-with-video', // 2019-06-17
    ]);
  });

  it('sorts undated video records last instead of dropping them', () => {
    const entries = mergeEraFeed(ITEMS, ALL_VIDEOS);
    const last = entries[entries.length - 1];
    expect(last.kind).toBe('video');
    expect(last.kind === 'video' && last.video.slug).toBe('undated-film');
    expect(entries).toHaveLength(ITEMS.length + ALL_VIDEOS.length);
  });

  it('is stable when there is nothing to merge', () => {
    expect(mergeEraFeed([], [])).toEqual([]);
  });
});

describe('undatedAnchorDate', () => {
  it('floors at the era start when every dated card is inside the era', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(undatedAnchorDate(entries, '2019-01-01')).toBe('2019-01-01');
  });

  it('uses the earliest dated card when one predates the era start', () => {
    // debut is the real case: the era starts 2006-10-24 but carries a moment
    // dated 2006-06-19, so anchoring the tail at era.start would step the
    // anchor sequence back UP and break the scrubber's ordering assumption.
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(undatedAnchorDate(entries, '2019-08-01')).toBe('2019-06-17');
  });

  it('never returns a date later than any card in the feed', () => {
    const entries = mergeEraFeed(ITEMS, ALL_VIDEOS);
    const anchor = undatedAnchorDate(entries, '2019-12-31');
    for (const e of entries) {
      const date = e.kind === 'moment' ? e.item.date : e.video.releasedOn;
      if (date) expect(anchor <= date).toBe(true);
    }
  });
});

describe('watchableCount', () => {
  it('equals the number of cards the Videos filter actually renders', () => {
    // The invariant that matters: the chip's badge must predict the result.
    // It regressed once (the badge showed the RAIL count, so tloas promised 10
    // and rendered 13) — this is what catches that.
    const filter = filterOf([], true);
    const rendered = mergeEraFeed(
      visibleMoments(ITEMS, filter),
      visibleVideos(MUSIC_VIDEOS, ALL_VIDEOS, filter),
    ).length;
    expect(watchableCount(ITEMS, ALL_VIDEOS)).toBe(rendered);
  });

  it('counts moments carrying footage even when the era has no video records', () => {
    expect(watchableCount(ITEMS, [])).toBe(1);
  });

  it('is zero when there is nothing to watch, so the chip stays hidden', () => {
    expect(watchableCount([moment('m', '2019-01-01', ['Lore'])], [])).toBe(0);
  });
});

describe('embeddedYoutubeIds', () => {
  it('collects the ids already embedded on moments, so a video is never shown twice', () => {
    expect([...embeddedYoutubeIds(ITEMS)]).toEqual(['yt-mv-you-need']);
  });

  it('is empty when no moment carries a video', () => {
    expect(embeddedYoutubeIds([moment('m', '2019-01-01', ['Lore'])]).size).toBe(0);
  });
});
