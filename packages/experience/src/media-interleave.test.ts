import { describe, expect, it } from 'vitest';
import { mergeEraFeed } from './era-feed';
import { clusterSameDayMoments, CLUSTER_MIN_SIZE, type RenderFeedEntry } from './era-feed-clusters';
import { interleaveRecentVideo, isVideoEntry, MAX_TEXT_RUN } from './media-interleave';
import { buildEraStreamViewModel } from './era-stream';
import { ERAS } from './eras';
import type { ContentItem, VideoNote } from './types';

const ERA_START = '2026-01-01';
const ERA_END = '2026-12-31';
const NOW = Date.parse('2026-11-08T12:00:00Z');

const moment = (id: string, date: string, youtubeId?: string): ContentItem =>
  ({
    id,
    eraId: 'tloas',
    date,
    dateLabel: date,
    title: id,
    summary: '',
    tags: [],
    image: '',
    body: [],
    images: [],
    ...(youtubeId ? { video: { youtubeId } } : {}),
  }) as unknown as ContentItem;

const video = (slug: string, releasedOn: string): VideoNote =>
  ({
    slug,
    kind: 'music-video',
    title: slug,
    director: null,
    releasedOn,
    relatedSongs: [],
    summary: null,
    easterEggs: [],
    symbolism: null,
    youtubeId: `yt-${slug}`,
    sources: [],
    tags: [],
  }) as unknown as VideoNote;

const key = (e: RenderFeedEntry): string =>
  e.kind === 'moment' ? e.item.id : e.kind === 'video' ? e.video.slug : e.kind;

/** What the renderer sees: merge, cluster, then (when a clock is given) interleave. */
const rendered = (moments: ContentItem[], videos: VideoNote[], nowMs?: number): RenderFeedEntry[] => {
  const clustered = clusterSameDayMoments(mergeEraFeed(moments, videos, ERA_START, ERA_END));
  return nowMs === undefined ? clustered : interleaveRecentVideo(clustered, nowMs);
};

const maxTextRun = (feed: RenderFeedEntry[]): number => {
  let run = 0;
  let max = 0;
  for (const e of feed) {
    run = (e.kind === 'moment' || e.kind === 'cluster') && !isVideoEntry(e) ? run + 1 : 0;
    max = Math.max(max, run);
  }
  return max;
};

/** n texts, two per day counting down from startDay of Nov 2026 (so none cluster). */
const textMoments = (n: number, startDay = 7) =>
  Array.from({ length: n }, (_, i) =>
    moment(
      `t${String(i).padStart(2, '0')}`,
      `2026-11-${String(startDay - Math.floor(i / 2)).padStart(2, '0')}`,
    ),
  );

describe('interleaveRecentVideo', () => {
  it('pulls a same-week video up after at most two text entries', () => {
    const feed = rendered(textMoments(9), [video('clip', '2026-11-02')], NOW);
    expect(feed.map(key).slice(0, 4)).toEqual(['t00', 't01', 'clip', 't02']);
    expect(feed).toHaveLength(10);
  });

  it('keeps the video at its natural place when recency already puts it first', () => {
    const feed = rendered(textMoments(5, 3), [video('clip', '2026-11-07')], NOW);
    expect(feed.map(key)).toEqual(['clip', 't00', 't01', 't02', 't03', 't04']);
  });

  it('caps text runs at MAX_TEXT_RUN while videos remain, then lets the rest flow', () => {
    const videos = [video('v1', '2026-11-04'), video('v2', '2026-11-03')];
    const feed = rendered(textMoments(10), videos, NOW);
    expect(feed.map(key).slice(0, 6)).toEqual(['t00', 't01', 'v1', 't02', 't03', 'v2']);
    expect(maxTextRun(feed.slice(0, 6))).toBeLessThanOrEqual(MAX_TEXT_RUN);
    expect(feed.map(key).slice(6)).toEqual(['t04', 't05', 't06', 't07', 't08', 't09']);
  });

  it("leaves entries outside the window in today's order", () => {
    const old = [moment('o1', '2026-10-01'), moment('o2', '2026-09-30'), moment('o3', '2026-09-29')];
    const feed = rendered(
      [...textMoments(3), ...old],
      [video('clip', '2026-11-05'), video('older', '2026-09-01')],
      NOW,
    );
    expect(feed.map(key)).toEqual(['t00', 't01', 'clip', 't02', 'o1', 'o2', 'o3', 'older']);
  });

  it('counts a moment that carries an embed as a video', () => {
    const feed = rendered([...textMoments(4), moment('embed', '2026-11-01', 'abc')], [], NOW);
    expect(feed.map(key).slice(0, 3)).toEqual(['t00', 't01', 'embed']);
  });

  it('counts a same-day cluster as one card and keeps it intact', () => {
    const pileup = Array.from({ length: CLUSTER_MIN_SIZE }, (_, i) => moment(`p${i}`, '2026-11-06'));
    const texts = [moment('x1', '2026-11-05'), moment('x2', '2026-11-05')];
    const feed = rendered([...pileup, ...texts], [video('clip', '2026-11-03')], NOW);
    expect(feed.map(key)).toEqual(['cluster', 'x1', 'clip', 'x2']);
    const cluster = feed[0];
    expect(cluster?.kind === 'cluster' && cluster.items.length).toBe(CLUSTER_MIN_SIZE);
  });

  it('does not treat a moment without an embed as video', () => {
    const feed = rendered([...textMoments(4), moment('nope', '2026-11-01')], [], NOW);
    expect(feed.map(key)).toEqual(['t00', 't01', 't02', 't03', 'nope']);
  });

  it('pulls forward only live items with a playable embed', () => {
    const cur = (id: string, date: string, extra: Record<string, unknown>): RenderFeedEntry =>
      ({
        kind: 'current',
        item: { id, ...extra },
        anchor: { sortDate: date, displayDate: date, via: 'exact' },
      }) as unknown as RenderFeedEntry;
    const embed = (provider: string, videoId: string) => ({ mediaKind: 'video', embed: { provider, videoId } });
    const [m1, m2] = rendered(textMoments(2), []);
    const list = [
      m1!,
      m2!,
      cur('bad-provider', '2026-11-06', embed('vimeo', 'dQw4w9WgXcQ')),
      cur('bad-id', '2026-11-06', embed('youtube', 'nope')),
      cur('good', '2026-11-05', embed('youtube', 'dQw4w9WgXcQ')),
    ];
    expect(list.map(isVideoEntry)).toEqual([false, false, false, false, true]);
    expect(interleaveRecentVideo(list, NOW).map(key)).toEqual(['t00', 't01', 'current', 'current', 'current']);
    expect(interleaveRecentVideo(list, NOW).map((e) => (e.kind === 'current' ? e.item.id : ''))).toEqual([
      '',
      '',
      'good',
      'bad-provider',
      'bad-id',
    ]);
  });

  it('leaves entries dated after today alone, even when the clock is behind the content', () => {
    const future = [moment('f1', '2026-11-20'), moment('f2', '2026-11-19'), moment('f3', '2026-11-18')];
    const feed = rendered([...future, ...textMoments(3)], [video('fv', '2026-11-17'), video('clip', '2026-11-05')], NOW);
    expect(feed.map(key)).toEqual(['f1', 'f2', 'f3', 'fv', 't00', 't01', 'clip', 't02']);
  });

  it('is pure recency without a clock', () => {
    const withClock = rendered(textMoments(9), [video('clip', '2026-11-02')], NOW);
    const without = rendered(textMoments(9), [video('clip', '2026-11-02')]);
    expect(without.map(key)[9]).toBe('clip');
    expect(withClock.map(key)).not.toEqual(without.map(key));
  });

  it('property: same multiset in and out, deterministic, regardless of input order', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = seed * 7919;
      const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
      const day = () =>
        `2026-${rnd() < 0.5 ? '11' : '10'}-${String(1 + Math.floor(rnd() * 8)).padStart(2, '0')}`;
      const moments = Array.from({ length: 12 }, (_, i) =>
        moment(`m${i}`, day(), rnd() < 0.2 ? `yt${i}` : undefined),
      );
      const videos = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => video(`v${i}`, day()));
      const base = rendered(moments, videos);
      const out = interleaveRecentVideo(base, NOW);
      expect(out.map(key).sort()).toEqual(base.map(key).sort());
      expect(interleaveRecentVideo(base, NOW).map(key)).toEqual(out.map(key));
      const shuffled = interleaveRecentVideo(rendered([...moments].reverse(), [...videos].reverse()), NOW);
      expect(shuffled.map(key)).toEqual(out.map(key));
    }
  });
});

describe('buildEraStreamViewModel interleave gate', () => {
  it('first render (no interleaveNowMs) is pure recency; the clock turns the interleave on', () => {
    const era = { ...ERAS[0]!, start: ERA_START, end: ERA_END };
    const base = {
      era,
      items: textMoments(9),
      videoFeed: [video('clip', '2026-11-02')],
      filters: new Set<never>(),
    };
    const first = buildEraStreamViewModel(base).entries.map(key);
    expect(first).toEqual(rendered(base.items, base.videoFeed).map(key));
    expect(first[9]).toBe('clip');
    const mounted = buildEraStreamViewModel({ ...base, interleaveNowMs: NOW }).entries.map(key);
    expect(mounted.slice(0, 3)).toEqual(['t00', 't01', 'clip']);
  });
});
