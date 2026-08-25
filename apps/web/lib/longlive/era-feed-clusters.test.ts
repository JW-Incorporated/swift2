import { describe, expect, it } from 'vitest';
import { clusterSameDayMoments } from './era-feed-clusters';
import { mergeEraFeed } from './era-feed';
import type { ContentItem, ContentTag, VideoNote } from './types';

const ERA_START = '2020-01-01';
const ERA_END = '2020-12-31';

const moment = (id: string, date: string, tags: ContentTag[] = []): ContentItem =>
  ({
    id,
    eraId: 'folklore',
    date,
    dateLabel: date,
    title: id,
    summary: '',
    tags,
    image: '',
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

describe('clusterSameDayMoments', () => {
  it('collapses a same-day moment run at or above minSize into one cluster entry', () => {
    const moments = [
      moment('m1', '2020-07-24'),
      moment('m2', '2020-07-24'),
      moment('m3', '2020-07-24'),
      moment('m4', '2020-06-01'),
    ];
    const feed = mergeEraFeed(moments, [], ERA_START, ERA_END);
    const out = clusterSameDayMoments(feed, 3);

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ kind: 'cluster', anchor: { sortDate: '2020-07-24' } });
    expect(out[0].kind === 'cluster' && out[0].items.map((i) => i.id)).toEqual(['m1', 'm2', 'm3']);
    expect(out[1]).toMatchObject({ kind: 'moment', item: { id: 'm4' } });
  });

  it('leaves a same-day run under minSize as plain moment entries', () => {
    const moments = [moment('m1', '2020-07-24'), moment('m2', '2020-07-24')];
    const feed = mergeEraFeed(moments, [], ERA_START, ERA_END);
    const out = clusterSameDayMoments(feed, 3);

    expect(out).toHaveLength(2);
    expect(out.every((e) => e.kind === 'moment')).toBe(true);
  });

  it('never clusters video, thread, egg or current entries', () => {
    const moments = [moment('m1', '2020-07-24'), moment('m2', '2020-07-24'), moment('m3', '2020-07-24')];
    const videos = [video('v1', '2020-07-24')];
    const feed = mergeEraFeed(moments, videos, ERA_START, ERA_END);
    const out = clusterSameDayMoments(feed, 3);

    const kinds = out.map((e) => e.kind);
    expect(kinds).toContain('cluster');
    expect(kinds).toContain('video');
    expect(out.filter((e) => e.kind === 'video')).toHaveLength(1);
  });

  it('preserves feed order (newest-first) around a cluster', () => {
    const moments = [
      moment('newest', '2020-08-01'),
      moment('m1', '2020-07-24'),
      moment('m2', '2020-07-24'),
      moment('m3', '2020-07-24'),
      moment('oldest', '2020-06-01'),
    ];
    const feed = mergeEraFeed(moments, [], ERA_START, ERA_END);
    const out = clusterSameDayMoments(feed, 3);

    expect(out.map((e) => e.kind)).toEqual(['moment', 'cluster', 'moment']);
    expect(out[0].kind === 'moment' && out[0].item.id).toBe('newest');
    expect(out[2].kind === 'moment' && out[2].item.id).toBe('oldest');
  });

  it('defaults to CLUSTER_MIN_SIZE when minSize is omitted', () => {
    const moments = Array.from({ length: 7 }, (_, i) => moment(`m${i}`, '2020-07-24'));
    const feed = mergeEraFeed(moments, [], ERA_START, ERA_END);
    const out = clusterSameDayMoments(feed);

    expect(out.every((e) => e.kind === 'moment')).toBe(true);
  });
});
