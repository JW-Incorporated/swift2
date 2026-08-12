import { describe, expect, it } from 'vitest';
import {
  embeddedYoutubeIds,
  mergeEraFeed,
  visibleMoments,
  visibleVideos,
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

describe('embeddedYoutubeIds', () => {
  it('collects the ids already embedded on moments, so a video is never shown twice', () => {
    expect([...embeddedYoutubeIds(ITEMS)]).toEqual(['yt-mv-you-need']);
  });

  it('is empty when no moment carries a video', () => {
    expect(embeddedYoutubeIds([moment('m', '2019-01-01', ['Lore'])]).size).toBe(0);
  });
});
