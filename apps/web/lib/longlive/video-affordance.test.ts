import { describe, expect, it } from 'vitest';
import { detailVideoFor, feedVideoFor, footnoteVideoSources } from './video-affordance';
import type { ContentItem, EggSource } from './types';

const source = (name: string, url: string): EggSource => ({ name, url }) as EggSource;

const moment = (over: Partial<ContentItem> = {}): ContentItem =>
  ({
    id: 'm1',
    eraId: 'lover',
    date: '2019-08-23',
    dateLabel: 'August 23, 2019',
    title: 'A Moment',
    summary: '',
    body: [],
    tags: ['Music'],
    images: [],
    ...over,
  }) as unknown as ContentItem;

const YT = 'https://www.youtube.com/watch?v=abcdefghijk';
const YT_ID = 'abcdefghijk';

describe('feedVideoFor', () => {
  it('is the moment’s own video, so the badge and the Videos filter agree', () => {
    const v = { youtubeId: 'abc', title: 'T' };
    expect(feedVideoFor(moment({ video: v }))).toEqual(v);
  });

  it('is null for a moment with no footage — no badge on that card', () => {
    expect(feedVideoFor(moment())).toBeNull();
  });

  it('does NOT promote a YouTube source into the feed (that would widen the filter)', () => {
    expect(feedVideoFor(moment({ sources: [source('Clip', YT)] }))).toBeNull();
  });
});

describe('detailVideoFor', () => {
  it('is the moment’s own video, with MomentVideo’s default caption', () => {
    const v = { youtubeId: 'abc', title: 'T' };
    expect(detailVideoFor(moment({ video: v }))).toEqual({ video: v });
  });

  // #2051 decision point 3 proposed promoting a lone YouTube CITATION into this
  // slot. Deliberately not implemented — six of the 29 citations it would fire
  // on are fan re-uploads, and presenting one as a page's lead media is a
  // rights/product call for Joey, not a refactor. See detailVideoFor's comment.
  it('does NOT promote a lone YouTube citation into the lead slot', () => {
    const item = moment({ sources: [source('YouTube — someone (fan archive)', YT)] });
    expect(detailVideoFor(item)).toBeNull();
  });

  it('does not promote even a single citation from an official-looking channel', () => {
    const item = moment({ sources: [source('YouTube — GRAMMYS', YT)] });
    expect(detailVideoFor(item)).toBeNull();
  });

  it('prefers the moment’s own video over any citation', () => {
    const own = { youtubeId: 'own-id', title: 'Own' };
    const item = moment({ video: own, sources: [source('Clip', YT)] });
    expect(detailVideoFor(item)).toEqual({ video: own });
  });

  it('is null when there is no footage at all', () => {
    expect(
      detailVideoFor(moment({ sources: [source('Billboard', 'https://b.com/x')] })),
    ).toBeNull();
  });
});

describe('footnoteVideoSources', () => {
  it('keeps a lone YouTube citation in the footnote (nothing is promoted out)', () => {
    expect(
      footnoteVideoSources(moment({ sources: [source('Clip', YT)] })).map((s) => s.youtubeId),
    ).toEqual([YT_ID]);
  });

  it('drops a citation duplicating the moment’s own video', () => {
    const item = moment({
      video: { youtubeId: YT_ID, title: 'Own' },
      sources: [source('Clip', YT)],
    });
    expect(footnoteVideoSources(item)).toEqual([]);
  });

  it('keeps multiple YouTube citations in the footnote, where references belong', () => {
    const item = moment({
      sources: [source('Clip A', YT), source('Clip B', 'https://youtu.be/zzzzzzzzzzz')],
    });
    expect(footnoteVideoSources(item).map((s) => s.youtubeId)).toEqual([YT_ID, 'zzzzzzzzzzz']);
  });

  it('ignores non-YouTube citations', () => {
    const item = moment({ sources: [source('Billboard', 'https://www.billboard.com/x')] });
    expect(footnoteVideoSources(item)).toEqual([]);
  });

  it('keeps the other YouTube citations when the moment has its own video', () => {
    const item = moment({
      video: { youtubeId: 'ownidownid1', title: 'Own' },
      sources: [source('Own', 'https://youtu.be/ownidownid1'), source('Clip', YT)],
    });
    expect(footnoteVideoSources(item).map((s) => s.youtubeId)).toEqual([YT_ID]);
  });
});
