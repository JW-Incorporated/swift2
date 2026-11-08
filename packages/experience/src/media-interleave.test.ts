import { describe, expect, it } from 'vitest';
import { mergeEraFeed, type EraFeedEntry } from './era-feed';
import { interleaveRecentVideo, isVideoEntry, MAX_TEXT_RUN } from './media-interleave';
import { mergeEraStreamFeed } from './era-stream';
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

const key = (e: EraFeedEntry): string =>
  e.kind === 'moment' ? e.item.id : e.kind === 'video' ? e.video.slug : `${e.kind}`;

const maxTextRun = (feed: EraFeedEntry[]): number => {
  let run = 0;
  let max = 0;
  for (const e of feed) {
    run = e.kind === 'moment' && !isVideoEntry(e) ? run + 1 : 0;
    max = Math.max(max, run);
  }
  return max;
};

const textMoments = (n: number, date = '2026-11-07') =>
  Array.from({ length: n }, (_, i) => moment(`t${String(i).padStart(2, '0')}`, date));

describe('interleaveRecentVideo', () => {
  it('pulls a same-week video up after at most two text entries', () => {
    const feed = mergeEraFeed(textMoments(9), [video('clip', '2026-11-02')], ERA_START, ERA_END, [], NOW);
    expect(feed.map(key).slice(0, 4)).toEqual(['t00', 't01', 'clip', 't02']);
    expect(feed).toHaveLength(10);
  });

  it('keeps the video at its natural place when recency already puts it first', () => {
    const feed = mergeEraFeed(textMoments(5, '2026-11-03'), [video('clip', '2026-11-07')], ERA_START, ERA_END, [], NOW);
    expect(feed.map(key)).toEqual(['clip', 't00', 't01', 't02', 't03', 't04']);
  });

  it('caps text runs at MAX_TEXT_RUN while videos remain, then lets the rest flow', () => {
    const videos = [video('v1', '2026-11-04'), video('v2', '2026-11-03')];
    const feed = mergeEraFeed(textMoments(10), videos, ERA_START, ERA_END, [], NOW);
    expect(feed.map(key).slice(0, 6)).toEqual(['t00', 't01', 'v1', 't02', 't03', 'v2']);
    expect(maxTextRun(feed.slice(0, 6))).toBeLessThanOrEqual(MAX_TEXT_RUN);
    expect(feed.map(key).slice(6)).toEqual(['t04', 't05', 't06', 't07', 't08', 't09']);
  });

  it('leaves entries outside the window in today\'s order', () => {
    const old = [moment('o1', '2026-10-01'), moment('o2', '2026-09-30'), moment('o3', '2026-09-29')];
    const feed = mergeEraFeed(
      [...textMoments(3), ...old],
      [video('clip', '2026-11-05'), video('older', '2026-09-01')],
      ERA_START,
      ERA_END,
      [],
      NOW,
    );
    expect(feed.map(key)).toEqual(['t00', 't01', 'clip', 't02', 'o1', 'o2', 'o3', 'older']);
  });

  it('counts a moment that carries an embed as a video', () => {
    const feed = mergeEraFeed(
      [...textMoments(4), moment('embed', '2026-11-01', 'abc')],
      [],
      ERA_START,
      ERA_END,
      [],
      NOW,
    );
    expect(feed.map(key).slice(0, 3)).toEqual(['t00', 't01', 'embed']);
  });

  it('is pure recency without a clock', () => {
    const withClock = mergeEraFeed(textMoments(9), [video('clip', '2026-11-02')], ERA_START, ERA_END, [], NOW);
    const without = mergeEraFeed(textMoments(9), [video('clip', '2026-11-02')], ERA_START, ERA_END);
    expect(without.map(key)[9]).toBe('clip');
    expect(withClock.map(key)).not.toEqual(without.map(key));
  });

  it('property: same multiset in and out, deterministic, regardless of input order', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = seed * 7919;
      const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
      const day = () => `2026-${rnd() < 0.5 ? '11' : '10'}-${String(1 + Math.floor(rnd() * 8)).padStart(2, '0')}`;
      const moments = Array.from({ length: 12 }, (_, i) =>
        moment(`m${i}`, day(), rnd() < 0.2 ? `yt${i}` : undefined),
      );
      const videos = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => video(`v${i}`, day()));
      const base = mergeEraFeed(moments, videos, ERA_START, ERA_END);
      const out = interleaveRecentVideo(base, NOW);
      expect(out.map(key).sort()).toEqual(base.map(key).sort());
      expect(interleaveRecentVideo(base, NOW).map(key)).toEqual(out.map(key));
      const shuffled = mergeEraFeed([...moments].reverse(), [...videos].reverse(), ERA_START, ERA_END, [], NOW);
      expect(shuffled.map(key)).toEqual(out.map(key));
    }
  });
});

describe('mergeEraStreamFeed', () => {
  it('applies the interleave only when the caller supplies nowMs', () => {
    const era = { ...ERAS[0]!, start: ERA_START, end: ERA_END };
    const base = { era, items: textMoments(9), videoFeed: [video('clip', '2026-11-02')] };
    expect(mergeEraStreamFeed({ ...base, nowMs: NOW }).map(key).slice(0, 3)).toEqual(['t00', 't01', 'clip']);
    expect(mergeEraStreamFeed(base).map(key)[9]).toBe('clip');
  });
});
