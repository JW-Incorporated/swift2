import { describe, expect, it } from 'vitest';
import {
  detailVideoFor,
  displayHost,
  feedVideoFor,
  footnoteVideoSources,
  watchAffordance,
} from './video-affordance';
import { VIDEOS_RAW } from './videos.generated';
import type { ContentItem, EggSource, VideoNote } from './types';

const video = (over: Partial<VideoNote> = {}): VideoNote =>
  ({
    slug: 'a-video',
    kind: 'music_video',
    title: 'A Video',
    director: null,
    releasedOn: '2019-08-22',
    relatedSongs: [],
    summary: null,
    easterEggs: [],
    symbolism: null,
    youtubeId: null,
    sources: [],
    ...over,
  }) as VideoNote;

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

describe('displayHost', () => {
  it('returns the bare host without a www prefix', () => {
    expect(displayHost('https://www.billboard.com/a/b')).toBe('billboard.com');
    expect(displayHost('https://en.wikipedia.org/wiki/X')).toBe('en.wikipedia.org');
  });

  it('returns null for a URL that does not parse, so no broken link renders', () => {
    expect(displayHost('not a url')).toBeNull();
    expect(displayHost('')).toBeNull();
  });

  it('rejects a non-http scheme even though it parses into a host', () => {
    // Parses fine and yields host 'evil.example' — a host-only check would put
    // this straight into an href.
    expect(displayHost('javascript://evil.example/%0aalert(1)')).toBeNull();
    expect(displayHost('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(displayHost('file:///etc/passwd')).toBeNull();
  });
});

describe('watchAffordance', () => {
  it('embeds when the record has an official upload', () => {
    expect(watchAffordance(video({ youtubeId: 'xyz' }))).toEqual({
      kind: 'embed',
      youtubeId: 'xyz',
    });
  });

  it('prefers the embed over a link even when sources exist', () => {
    const v = video({
      youtubeId: 'xyz',
      sources: [source('Wikipedia', 'https://en.wikipedia.org/wiki/X')],
    });
    expect(watchAffordance(v).kind).toBe('embed');
  });

  it('links out to the first citation when there is no upload to embed', () => {
    const v = video({
      sources: [
        source('Wikipedia', 'https://en.wikipedia.org/wiki/X'),
        source('Billboard', 'https://www.billboard.com/x'),
      ],
    });
    expect(watchAffordance(v)).toEqual({
      kind: 'link',
      url: 'https://en.wikipedia.org/wiki/X',
      host: 'en.wikipedia.org',
      sourceName: 'Wikipedia',
    });
  });

  it('skips an unusable source URL rather than rendering a broken link', () => {
    const v = video({
      sources: [source('Broken', 'javascript'), source('Billboard', 'https://www.billboard.com/x')],
    });
    expect(watchAffordance(v)).toMatchObject({ kind: 'link', host: 'billboard.com' });
  });

  it('never hands a non-http scheme to an href', () => {
    const v = video({ sources: [source('Nope', 'javascript://evil.example/%0aalert(1)')] });
    expect(watchAffordance(v).kind).toBe('none');
  });

  it('reports "none" only when there is genuinely nothing to embed or link', () => {
    expect(watchAffordance(video({ sources: [] })).kind).toBe('none');
  });
});

describe('watchAffordance over the real video data (#2050 regression guard)', () => {
  // The bug this replaces: BOTH surfaces that render a VideoNote gated their
  // only interactive element on `youtubeId`, so all 19 records without one
  // rendered as dead rectangles — three of them in the unfiltered era feed.
  //
  // This asserts the INVARIANT ("no record can be inert") rather than #721's
  // proposed allowlist of records-missing-an-id. An allowlist restates content
  // state in a second place and goes stale silently the moment a record is
  // added or backfilled; the invariant is what the UI actually depends on, and
  // it stays true whether the content gap is fixed or not.
  const all = Object.values(VIDEOS_RAW).flat();

  it('has records to check', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it('gives every single video record something to do', () => {
    const inert = all.filter((v) => watchAffordance(v).kind === 'none');
    expect(inert.map((v) => v.slug)).toEqual([]);
  });

  it('still finds the records with no embed — they link out instead of dying', () => {
    const linked = all.filter((v) => watchAffordance(v).kind === 'link');
    // Every record without a youtubeId must resolve to a link.
    const noEmbed = all.filter((v) => !v.youtubeId);
    expect(linked.length).toBe(noEmbed.length);
    expect(noEmbed.length).toBeGreaterThan(0);
  });
});

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
