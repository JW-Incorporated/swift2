import { describe, expect, it } from 'vitest';
import { ALL_FILTERS, filterForThread, filterMatches, filtersForEntry, type FilterId } from './filters';
import type { EraFeedEntry } from './era-feed';
import type { Anchored } from './anchor-date';
import type { ContentItem, ContentTag, LensId, VideoNote } from './types';
import type { CurrentItem } from '@swift2/shared';

// filtersForEntry doesn't read the anchor — these tests only exercise
// filter categorisation, so every entry gets the same stub anchor.
const ANCHOR: Anchored = { sortDate: '2019-08-23', displayDate: '2019-08-23', via: 'exact' };

const moment = (id: string, tags: ContentTag[]): ContentItem =>
  ({
    id,
    eraId: 'lover',
    date: '2019-08-23',
    dateLabel: '2019-08-23',
    title: id,
    summary: '',
    tags,
  }) as unknown as ContentItem;

const video = (slug: string): VideoNote =>
  ({
    slug,
    kind: 'music_video',
    title: slug,
    director: null,
    releasedOn: '2019-08-22',
    relatedSongs: [],
    summary: null,
    easterEggs: [],
    symbolism: null,
    youtubeId: `yt-${slug}`,
    sources: [],
  }) as unknown as VideoNote;

describe('ALL_FILTERS', () => {
  it('is exactly the five topic tags plus Videos, six total (R2)', () => {
    expect(ALL_FILTERS).toEqual(['Music', 'Videos', 'Fashion', 'Tour', 'Relationship', 'Lore']);
  });
});

describe('filterMatches', () => {
  const empty = new Set<FilterId>();

  it('shows everything when the active set is empty', () => {
    for (const f of ALL_FILTERS) {
      expect(filterMatches([f], empty)).toBe(true);
    }
  });

  it('OR-matches against a non-empty active set', () => {
    const active = new Set<FilterId>(['Fashion']);
    expect(filterMatches(['Fashion'], active)).toBe(true);
    expect(filterMatches(['Tour'], active)).toBe(false);
  });

  it('matches if ANY of the entry filters is selected', () => {
    const active = new Set<FilterId>(['Videos']);
    expect(filterMatches(['Music', 'Videos'], active)).toBe(true);
    expect(filterMatches(['Music', 'Fashion'], active)).toBe(false);
  });

  it('an entry with zero filter ids can never match a non-empty active set', () => {
    const active = new Set<FilterId>(['Music']);
    expect(filterMatches([], active)).toBe(false);
  });
});

describe('filtersForEntry', () => {
  const noOwners = { inlineVideoOwnerIds: new Set<string>() };

  it('returns a moment’s own tags when it owns no inline video', () => {
    const entry: EraFeedEntry = { kind: 'moment', item: moment('m1', ['Fashion', 'Tour']), anchor: ANCHOR };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Fashion', 'Tour']);
  });

  it('returns Videos only for a video with no authored tags', () => {
    const entry: EraFeedEntry = {
      kind: 'video',
      video: { ...video('vmas'), kind: 'award_speech' },
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Videos']);
  });

  it('a moment with no tags returns an empty list, never invented ones', () => {
    const entry: EraFeedEntry = { kind: 'moment', item: moment('m2', []), anchor: ANCHOR };
    expect(filtersForEntry(entry, noOwners)).toEqual([]);
  });

  // Restored rule 1 (see § Plan amendments, PLAN.md): a moment that OWNS its
  // inline video is watchable, so it must be reachable under {Videos} too.
  it('a footage-owning moment is reachable under {Videos}', () => {
    const entry: EraFeedEntry = { kind: 'moment', item: moment('m3', ['Lore']), anchor: ANCHOR };
    const ctx = { inlineVideoOwnerIds: new Set(['m3']) };
    expect(filtersForEntry(entry, ctx)).toEqual(['Lore', 'Videos']);
    expect(filterMatches(filtersForEntry(entry, ctx), new Set<FilterId>(['Videos']))).toBe(true);
  });

  // A video's topics come from its own authored `tags`, not from an
  // inference over kind/releasedOn (2026-08-13 — see filters.ts doc comment).
  it('a video with an authored Music tag is reachable under {Music}', () => {
    const entry: EraFeedEntry = {
      kind: 'video',
      video: { ...video('mv-lover'), tags: ['Music'] },
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Music', 'Videos']);
    expect(filterMatches(filtersForEntry(entry, noOwners), new Set<FilterId>(['Music']))).toBe(true);
  });

  it('a video with no authored tags gets no invented topic, even a music video', () => {
    const entry: EraFeedEntry = {
      kind: 'video',
      video: { ...video('mv-untagged'), tags: undefined },
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Videos']);
  });

  it('a video may carry more than one authored topic tag', () => {
    const entry: EraFeedEntry = {
      kind: 'video',
      video: { ...video('mv-multi'), tags: ['Music', 'Tour'] },
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Music', 'Tour', 'Videos']);
  });

  // PLAN.md P3 step 13: a thread doorway maps through filterForThread.
  it('a thread doorway carries its mapped filter', () => {
    const entry: EraFeedEntry = {
      kind: 'thread',
      doorway: { threadId: 'fashion', kicker: 'k', title: 'The Runway', example: 'x' },
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Fashion']);
  });

  // An egg doorway is always Lore — theories & eggs are lore, full stop.
  it('an egg doorway is always Lore', () => {
    const entry: EraFeedEntry = {
      kind: 'egg',
      doorway: { eggId: 'lover:e1', threadId: null, kicker: 'k', title: 'A theory' },
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Lore']);
  });

  // PLAN.md Stage 5: a current_item's `tags` are DB-sourced (worker-written,
  // not authored here) — filtered against ALL_FILTERS defensively.
  it('a current item carries its own valid tags', () => {
    const entry: EraFeedEntry = {
      kind: 'current',
      item: { tags: ['Fashion', 'Tour'] } as unknown as CurrentItem,
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Fashion', 'Tour']);
  });

  it('a current item drops any tag outside the known six, rather than crashing', () => {
    const entry: EraFeedEntry = {
      kind: 'current',
      item: { tags: ['Lore', 'not-a-real-tag'] } as unknown as CurrentItem,
      anchor: ANCHOR,
    };
    expect(filtersForEntry(entry, noOwners)).toEqual(['Lore']);
  });
});

describe('filterForThread', () => {
  // One case per LensId (R2) — exhaustive, since a new LensId is a compile
  // error in filterForThread itself, not a silently-defaulted filter.
  const CASES: [LensId, FilterId][] = [
    ['love-story', 'Relationship'],
    ['the-proposal', 'Relationship'],
    ['fashion', 'Fashion'],
    ['taylors-version', 'Music'],
    ['easter-eggs', 'Lore'],
    ['hidden-clues', 'Lore'],
  ];

  it.each(CASES)('%s maps to %s', (lensId, expected) => {
    expect(filterForThread(lensId)).toBe(expected);
  });
});
