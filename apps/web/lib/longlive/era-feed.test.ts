import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  embeddedYoutubeIds,
  emptyFeedMessage,
  inlineVideoMomentIds,
  mergeEraFeed as mergeEraFeedRaw,
  visibleFeed,
  type EraFeedEntry,
} from './era-feed';
import type { FilterId } from './filters';
import type { ContentItem, ContentTag, VideoNote } from './types';
import type { ThreadDoorway } from './doorways';
import { spaceDoorways, DOORWAY_MIN_GAP } from './space-doorways';
import type { CurrentItem } from '@swift2/shared';

// Every test era spans the full 2019 calendar year. Undated videos fall back
// to the era-scatter anchor (anchor-date.ts) — a deterministic, id-derived
// position inside [ERA_START, ERA_END], not a single shared value, so there
// is no fixed constant to reuse here the way an era-midpoint test could.
const ERA_START = '2019-01-01';
const ERA_END = '2019-12-31';

const mergeEraFeed = <V extends VideoNote>(moments: ContentItem[], videos: V[]) =>
  mergeEraFeedRaw(moments, videos, ERA_START, ERA_END);

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

const video = (
  slug: string,
  kind: VideoNote['kind'],
  releasedOn: string | null,
  tags: ContentTag[] = [],
): VideoNote =>
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
    tags,
  }) as unknown as VideoNote;

const filterOf = (ids: FilterId[]): ReadonlySet<FilterId> => new Set(ids);

/** The id a merged entry renders under, whatever kind it is — for asserting
 * on the shape of a filtered/merged feed without a kind-by-kind switch in
 * every test. */
const entryIds = (entries: EraFeedEntry[]): string[] =>
  entries.map((e) => {
    switch (e.kind) {
      case 'moment':
        return e.item.id;
      case 'video':
        return e.video.slug;
      case 'thread':
        return `thread:${e.doorway.threadId}`;
      case 'egg':
        return `egg:${e.doorway.eggId}`;
      case 'current':
        return `current:${e.item.id}`;
    }
  });

const threadEntry = (threadId: string, sortDate: string): EraFeedEntry => ({
  kind: 'thread',
  doorway: { threadId: threadId as ThreadDoorway['threadId'], kicker: 'k', title: threadId, example: 'x' },
  anchor: { sortDate, displayDate: sortDate, via: 'exact' },
});

const eggEntry = (eggId: string, sortDate: string): EraFeedEntry => ({
  kind: 'egg',
  doorway: { eggId, threadId: null, kicker: 'k', title: eggId },
  anchor: { sortDate, displayDate: null, via: 'era-scatter' },
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

const MUSIC_VIDEOS = [video('mv-lover', 'music_video', '2019-08-22', ['Music'])];
const ALL_VIDEOS = [
  video('mv-lover', 'music_video', '2019-08-22', ['Music']),
  video('vmas-2019', 'award_speech', '2019-08-26'),
  video('amas-2019', 'award_speech', '2019-11-24'),
  video('undated-film', 'tour_film', null),
];

describe('visibleFeed', () => {
  it('shows everything when the active filter set is empty', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(visibleFeed(entries, filterOf([]))).toBe(entries); // same reference, no allocation
  });

  it('selects moments by topic tag', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(entryIds(visibleFeed(entries, filterOf(['Fashion'])))).toEqual(['m-fashion']);
  });

  // The three concrete cases from R2: Videos is a PEER chip, OR-matched, not
  // a second mutually-exclusive axis. `mv-lover` carries an AUTHORED 'Music'
  // tag (VideoNote.tags — filters.ts no longer infers this from kind/date);
  // and `m-music-with-video` OWNS an inline video, so per the other restored
  // rule it also carries 'Videos' — both fixtures exercise the contract on
  // purpose, not just the plain topic/Videos split.
  it('with {Music} active: shows music-tagged moments AND authored-Music videos', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(entryIds(visibleFeed(entries, filterOf(['Music']))).sort()).toEqual(
      ['m-music-with-video', 'mv-lover'].sort(),
    );
  });

  it('with {Music, Videos} active: also pulls in a non-music video Music alone would miss', () => {
    const videos = [...MUSIC_VIDEOS, video('vmas-2019', 'award_speech', '2019-08-26')];
    const entries = mergeEraFeed(ITEMS, videos);
    expect(entryIds(visibleFeed(entries, filterOf(['Music', 'Videos']))).sort()).toEqual(
      ['m-music-with-video', 'mv-lover', 'vmas-2019'].sort(),
    );
  });

  it('with {Videos} active: shows videos AND footage-owning moments', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(entryIds(visibleFeed(entries, filterOf(['Videos']))).sort()).toEqual(
      ['m-music-with-video', 'mv-lover'].sort(),
    );
  });

  it('an entry with zero matching filter ids never survives a non-empty active set', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(entryIds(visibleFeed(entries, filterOf(['Tour'])))).toEqual([]);
  });

  it('still shows a deferring moment in the unfiltered feed — no text is lost', () => {
    // Unfiltered (active empty = show everything): both the owning moment
    // and the one that merely defers to it are on screen, exactly as
    // mergeEraFeed produced them.
    const entries = mergeEraFeed(DUPLICATE_EMBED_ITEMS, []);
    expect(entryIds(visibleFeed(entries, filterOf([])))).toEqual(['m-premiere', 'm-radio']);
  });

  it('re-homes video ownership when a filter hides the owner (#2051)', () => {
    // Ownership must be computed over the moments actually on screen, not
    // era-wide — otherwise a tag filter that hides the owner leaves the
    // survivor with no play control at all. This exercises the exact
    // pipeline EraSection wires: merge, filter, then derive owners from the
    // filtered moments.
    const items = [
      moment('m-premiere', '2026-03-31', ['Music'], { youtubeId: 'yt-liz', title: 'Liz' }),
      moment('m-radio', '2026-03-09', ['Music', 'Fashion'], { youtubeId: 'yt-liz', title: 'Liz' }),
    ];
    const entries = visibleFeed(mergeEraFeed(items, []), filterOf(['Fashion']));
    const visibleMoments = entries.flatMap((e) => (e.kind === 'moment' ? [e.item] : []));
    expect(visibleMoments.map((i) => i.id)).toEqual(['m-radio']);
    expect([...inlineVideoMomentIds(visibleMoments)]).toEqual(['m-radio']);
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
});

describe('mergeEraFeed', () => {
  it('interleaves moments and videos newest-first rather than concatenating', () => {
    const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
    expect(entryIds(entries)).toEqual([
      'm-fashion', // 2019-08-26
      'm-lore', // 2019-08-23
      'mv-lover', // 2019-08-22
      'm-music-with-video', // 2019-06-17
    ]);
  });

  it('is stable when there is nothing to merge', () => {
    expect(mergeEraFeed([], [])).toEqual([]);
  });

  // Anchoring — see anchor-date.ts / § Plan amendments. Undated video records
  // used to sort to the absolute end of the feed; now each gets a real anchor
  // (resolveAnchor) and sorts chronologically like everything else.
  describe('anchoring', () => {
    it('gives moments and dated videos an exact anchor equal to their own date', () => {
      const entries = mergeEraFeed(ITEMS, MUSIC_VIDEOS);
      for (const e of entries) {
        // No doorways passed in here, so only 'moment'/'video' ever occur at
        // runtime — asserted so the widened `EraFeedEntry` union (step 13)
        // still narrows safely below.
        expect(e.kind === 'moment' || e.kind === 'video').toBe(true);
        const ownDate = e.kind === 'moment' ? e.item.date : e.kind === 'video' ? e.video.releasedOn : null;
        expect(e.anchor).toEqual({ sortDate: ownDate, displayDate: ownDate, via: 'exact' });
      }
    });

    it('anchors an undated video at a scattered position inside the era, not the feed tail', () => {
      const entries = mergeEraFeed(ITEMS, ALL_VIDEOS);
      const undated = entries.find((e) => e.kind === 'video' && e.video.slug === 'undated-film');
      expect(undated?.anchor.via).toBe('era-scatter');
      const ms = Date.parse(`${undated?.anchor.sortDate}T00:00:00Z`);
      expect(ms).toBeGreaterThanOrEqual(Date.parse(`${ERA_START}T00:00:00Z`));
      expect(ms).toBeLessThanOrEqual(Date.parse(`${ERA_END}T00:00:00Z`));
      // The honesty rule: a synthetic anchor is never a claim about the date.
      expect(undated?.anchor.displayDate).toBeNull();
    });

    it('scatters distinct undated ids to distinct positions, not one shared value', () => {
      // The bug era-midpoint had: every undated item resolved to the exact
      // same sortDate and clumped. era-scatter must not repeat that for two
      // different undated videos in the same era.
      const videos = [
        ...ALL_VIDEOS,
        video('undated-film-2', 'tour_film', null),
      ];
      const entries = mergeEraFeed(ITEMS, videos);
      const undatedDates = entries
        .filter((e) => e.kind === 'video' && e.video.releasedOn === null)
        .map((e) => e.anchor.sortDate);
      expect(undatedDates).toHaveLength(2);
      expect(new Set(undatedDates).size).toBe(2);
    });
  });

  // PLAN.md P3 step 13: the optional 5th arg folds thread/egg doorways into
  // the same newest-first sort as moments and videos.
  describe('with doorways (step 13)', () => {
    it('interleaves doorways into the merged feed by their own anchor, newest-first', () => {
      const doorways = [threadEntry('fashion', '2019-08-25'), eggEntry('lover:e1', '2019-06-18')];
      const entries = mergeEraFeedRaw(ITEMS, MUSIC_VIDEOS, ERA_START, ERA_END, doorways);
      expect(entryIds(entries)).toEqual([
        'm-fashion', // 2019-08-26
        'thread:fashion', // 2019-08-25
        'm-lore', // 2019-08-23
        'mv-lover', // 2019-08-22
        'egg:lover:e1', // 2019-06-18
        'm-music-with-video', // 2019-06-17
      ]);
    });

    it('an empty doorways list behaves exactly as the 4-arg call', () => {
      const withEmpty = mergeEraFeedRaw(ITEMS, MUSIC_VIDEOS, ERA_START, ERA_END, []);
      expect(entryIds(withEmpty)).toEqual(entryIds(mergeEraFeed(ITEMS, MUSIC_VIDEOS)));
    });
  });

  // PLAN.md Stage 5: current-item entries (built by current-feed.ts's
  // currentFeedEntries) are ALREADY EraFeedEntry-shaped with their own exact
  // anchor, so they fold into the same 5th-arg slot doorways use — no change
  // to mergeEraFeed's signature.
  describe('with current-item entries (Stage 5)', () => {
    const currentEntry = (id: string, observedOn: string): EraFeedEntry => ({
      kind: 'current',
      item: { id, observedOn } as unknown as CurrentItem,
      anchor: { sortDate: observedOn, displayDate: observedOn, via: 'exact' },
    });

    it('interleaves current items with moments/videos by observedOn, newest-first', () => {
      const extras = [currentEntry('ci-1', '2019-08-27'), currentEntry('ci-2', '2019-06-01')];
      const entries = mergeEraFeedRaw(ITEMS, MUSIC_VIDEOS, ERA_START, ERA_END, extras);
      expect(entryIds(entries)).toEqual([
        'current:ci-1', // 2019-08-27
        'm-fashion', // 2019-08-26
        'm-lore', // 2019-08-23
        'mv-lover', // 2019-08-22
        'm-music-with-video', // 2019-06-17
        'current:ci-2', // 2019-06-01
      ]);
    });

    it('a vault-only feed (no current items) is unaffected', () => {
      const entries = mergeEraFeedRaw(ITEMS, MUSIC_VIDEOS, ERA_START, ERA_END, []);
      expect(entryIds(entries)).toEqual(entryIds(mergeEraFeed(ITEMS, MUSIC_VIDEOS)));
    });
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

// PLAN.md P3 step 14 — DOORWAY_MIN_GAP spacing.
describe('spaceDoorways', () => {
  // A run of 12 plain content cards, newest-first, real-shaped enough for
  // entryIds to read: alternating moment/video so the fixture isn't
  // suspiciously uniform.
  const filler = (n: number): EraFeedEntry[] =>
    Array.from({ length: n }, (_, i) =>
      i % 2 === 0
        ? { kind: 'moment', item: moment(`f${i}`, '2019-01-01', []), anchor: { sortDate: '2019-01-01', displayDate: '2019-01-01', via: 'exact' } }
        : { kind: 'video', video: video(`f${i}`, 'music_video', '2019-01-01'), anchor: { sortDate: '2019-01-01', displayDate: '2019-01-01', via: 'exact' } },
    );

  it('leaves an already-spaced feed untouched', () => {
    const feed = [threadEntry('t1', '2019-01-01'), ...filler(6), eggEntry('e1', '2019-01-01')];
    expect(spaceDoorways(feed)).toEqual(feed);
  });

  it('delays a doorway that clumps within DOORWAY_MIN_GAP of the previous one', () => {
    // Two doorways back-to-back with nothing between them, then plenty of
    // filler — the second doorway must move to clear the 4-card gap.
    const feed = [threadEntry('t1', '2019-01-01'), eggEntry('e1', '2019-01-01'), ...filler(8)];
    const spaced = spaceDoorways(feed);
    const doorwayIndexes = spaced
      .map((e, i) => ((e.kind === 'thread' || e.kind === 'egg') ? i : -1))
      .filter((i) => i >= 0);
    expect(doorwayIndexes).toHaveLength(2);
    expect(doorwayIndexes[1] - doorwayIndexes[0]).toBeGreaterThan(DOORWAY_MIN_GAP);
    // Every doorway from the input is still present in the output.
    expect(entryIds(spaced).filter((id) => id.startsWith('thread:') || id.startsWith('egg:')).sort()).toEqual(
      ['egg:e1', 'thread:t1'].sort(),
    );
  });

  it('never drops a doorway when the era is dense with doorways (best-effort spacing)', () => {
    // 6 doorways, only 3 filler cards total — nowhere near enough room to
    // give every doorway its own 4-card gap.
    const doorways = Array.from({ length: 6 }, (_, i) => threadEntry(`t${i}`, '2019-01-01'));
    const feed = [doorways[0], ...filler(1), doorways[1], ...filler(1), doorways[2], ...filler(1), doorways[3], doorways[4], doorways[5]];
    const spaced = spaceDoorways(feed);
    // Nothing lost: same total length, and every doorway id from the input
    // is present in the output exactly once.
    expect(spaced).toHaveLength(feed.length);
    expect(entryIds(spaced).filter((id) => id.startsWith('thread:')).sort()).toEqual(
      entryIds(feed).filter((id) => id.startsWith('thread:')).sort(),
    );
  });

  it('never moves a doorway earlier than its original position, and never reorders two doorways', () => {
    const doorways = Array.from({ length: 5 }, (_, i) => threadEntry(`t${i}`, '2019-01-01'));
    const feed = [doorways[0], doorways[1], ...filler(2), doorways[2], doorways[3], doorways[4]];
    const spaced = spaceDoorways(feed);
    const orderInSpaced = ['t0', 't1', 't2', 't3', 't4'].map((id) =>
      spaced.findIndex((e) => e.kind === 'thread' && e.doorway.threadId === id),
    );
    // Ascending — doorway-to-doorway relative order preserved.
    for (let i = 1; i < orderInSpaced.length; i++) {
      expect(orderInSpaced[i]).toBeGreaterThan(orderInSpaced[i - 1]);
    }
  });

  it('is deterministic — the same input always produces the same output', () => {
    const feed = [threadEntry('t1', '2019-01-01'), eggEntry('e1', '2019-01-01'), ...filler(3), threadEntry('t2', '2019-01-01')];
    expect(spaceDoorways(feed)).toEqual(spaceDoorways(feed));
  });

  it('does not reorder two non-doorway cards relative to each other', () => {
    const plain = filler(8);
    const feed = [threadEntry('t1', '2019-01-01'), threadEntry('t2', '2019-01-01'), ...plain];
    const spaced = spaceDoorways(feed);
    const plainIdsInSpaced = entryIds(spaced).filter((id) => !id.startsWith('thread:') && !id.startsWith('egg:'));
    expect(plainIdsInSpaced).toEqual(entryIds(plain));
  });

  // Adversarial review finding #2 (2026-08-13): a delayed doorway keeps its
  // original anchor date but now renders BELOW cards it hopped over, which
  // breaks the scrubber's "dates descend down the page" assumption. The fix
  // marks a delayed doorway `displaced: true` so DoorwayCard can stop
  // offering it as a rail anchor — see TimelineScrubber.tsx's `measure()`.
  it('marks a doorway placed immediately (no queueing) as NOT displaced', () => {
    const feed = [threadEntry('t1', '2019-01-01'), ...filler(6), eggEntry('e1', '2019-01-01')];
    const spaced = spaceDoorways(feed);
    for (const e of spaced) {
      if (e.kind === 'thread' || e.kind === 'egg') expect(e.displaced).toBeFalsy();
    }
  });

  it('marks a doorway that had to be delayed to clear the gap as displaced', () => {
    const feed = [threadEntry('t1', '2019-01-01'), eggEntry('e1', '2019-01-01'), ...filler(8)];
    const spaced = spaceDoorways(feed);
    // Only one thread/egg doorway of each kind in this fixture, so kind
    // alone identifies them.
    const t1 = spaced.find((e) => e.kind === 'thread');
    const e1 = spaced.find((e) => e.kind === 'egg');
    // t1 placed immediately (nothing ahead of it) — not displaced.
    expect(t1 && t1.kind === 'thread' ? t1.displaced : undefined).toBeFalsy();
    // e1 had to wait for the gap — displaced.
    expect(e1 && e1.kind === 'egg' ? e1.displaced : undefined).toBe(true);
  });

  it('marks every best-effort-tail doorway as displaced (dense-era case)', () => {
    const doorways = Array.from({ length: 6 }, (_, i) => threadEntry(`t${i}`, '2019-01-01'));
    const feed = [doorways[0], ...filler(1), doorways[1], ...filler(1), doorways[2], ...filler(1), doorways[3], doorways[4], doorways[5]];
    const spaced = spaceDoorways(feed);
    // t3/t4/t5 land in the un-spaceable tail with no gap at all — displaced.
    for (const id of ['t3', 't4', 't5']) {
      const e = spaced.find((e) => e.kind === 'thread' && e.doorway.threadId === id);
      expect(e && e.kind === 'thread' ? e.displaced : undefined).toBe(true);
    }
  });
});

// PLAN.md step 6a: the global filter can now zero out an era that never had
// a given topic (Tour in folklore) — the section must stay, and this is the
// line that replaces its feed.
describe('emptyFeedMessage', () => {
  it('names the era but not a filter when nothing is active (era genuinely has no moments)', () => {
    expect(emptyFeedMessage(filterOf([]), 'folklore')).toBe('No moments in this era yet.');
  });

  it('names the one active filter and the era, in the shipped example wording', () => {
    expect(emptyFeedMessage(filterOf(['Tour']), 'folklore')).toBe('Nothing under Tour in folklore.');
  });

  it('joins two active filters naturally', () => {
    expect(emptyFeedMessage(filterOf(['Tour', 'Videos']), 'evermore')).toBe(
      'Nothing under Tour and Videos in evermore.',
    );
  });

  it('joins three+ active filters in ALL_FILTERS chip order, regardless of Set insertion order', () => {
    expect(emptyFeedMessage(filterOf(['Videos', 'Lore', 'Music']), 'evermore')).toBe(
      'Nothing under Music, Lore and Videos in evermore.',
    );
  });

  it('renders the era by its own shortName casing (TTPD, not "ttpd" or "Ttpd")', () => {
    expect(emptyFeedMessage(filterOf(['Fashion']), 'TTPD')).toBe('Nothing under Fashion in TTPD.');
  });
});

describe('EraSection wires ownership to the rendered list', () => {
  // The rule above is only true if the component hands it the moments actually
  // on screen. There are no component tests in this suite (vitest runs in a
  // `node` environment), so this is a source lock in the idiom of
  // components/longlive/close-affordance.test.ts.
  const src = readFileSync(
    new URL('../../components/longlive/EraSection.tsx', import.meta.url),
    'utf8',
  );

  it('derives the video owners from `visible`, never from the full era list', () => {
    expect(src).toContain('inlineVideoMomentIds(visible)');
    expect(src).not.toContain('inlineVideoMomentIds(items)');
  });
});
