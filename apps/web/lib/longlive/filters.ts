import type { ContentTag, LensId } from './types';
import type { EraFeedEntry } from './era-feed';

/** R2: exactly six, forever. Videos is a peer chip, not a separate axis. */
export type FilterId = ContentTag | 'Videos';

export const ALL_FILTERS: readonly FilterId[] = [
  'Music',
  'Fashion',
  'Tour',
  'Relationship',
  'Lore',
  'Videos',
] as const;

/**
 * Empty active set means "show everything".
 * A non-empty set is OR-matched against the entry's own filter ids.
 * An entry with zero filter ids can therefore never match an active
 * filter — which is exactly why check:filter-coverage exists.
 */
export function filterMatches(
  entryFilters: readonly FilterId[],
  active: ReadonlySet<FilterId>,
): boolean {
  return active.size === 0 || entryFilters.some((f) => active.has(f));
}

/**
 * Which of the six filters a THREADS doorway belongs under, derived from its
 * `LensId` (PLAN.md P3 step 13). Exhaustive on purpose: a new `LensId` must
 * fail to compile here rather than silently fall back to a default topic —
 * the same discipline `filtersForEntry`'s own `never` check enforces below.
 */
export function filterForThread(id: LensId): FilterId {
  switch (id) {
    case 'love-story':
    case 'the-proposal':
      return 'Relationship';
    case 'fashion':
      return 'Fashion';
    case 'taylors-version':
      return 'Music';
    case 'easter-eggs':
    case 'hidden-clues':
      return 'Lore';
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

/**
 * The six ids an entry belongs to, whatever kind of entry it is.
 *
 * Two restored rules, both shipped behaviour before the global-filter
 * rework, neither a new invention:
 *
 *  1. A moment that OWNS its inline video is watchable, so it belongs under
 *     Videos as well as its own topics. `ctx.inlineVideoOwnerIds` is exactly
 *     `inlineVideoMomentIds`'s output — ownership is a property of the list
 *     on screen, not of the era, hence the ctx argument (see that function's
 *     doc comment in era-feed.ts).
 *  2. A video's topics come from its own authored `VideoNote.tags` (added
 *     2026-08-13, backfilled per record — see docs/longlive-experience.md
 *     §5.8). This REPLACES the earlier inference ("a dated music video is
 *     Music"): two mechanisms deciding the same thing was the exact defect
 *     an adversarial review caught twice on this branch. Every video still
 *     carries `Videos` — that is structural, not authored.
 *
 * `thread`/`egg` doorways (PLAN.md P3 step 13): a thread doorway maps through
 * `filterForThread`; an egg doorway is always Lore (theories & eggs are lore,
 * full stop — no per-theory topic exists to read one from).
 *
 * `EraFeedEntry` is the four-kind union (`moment` | `video` | `thread` |
 * `egg`). The `never` check below is the safety net step 13 relies on: it
 * turns any future widening of the union into a compile error here rather
 * than a silent fallthrough that would leave a new kind unfiltered.
 */
export function filtersForEntry(
  entry: EraFeedEntry,
  ctx: { inlineVideoOwnerIds: ReadonlySet<string> },
): readonly FilterId[] {
  switch (entry.kind) {
    case 'moment':
      return ctx.inlineVideoOwnerIds.has(entry.item.id)
        ? [...entry.item.tags, 'Videos']
        : entry.item.tags;
    case 'video':
      // A video's topics are whatever was authored onto the record itself
      // (VideoNote.tags) — never inferred here. Videos is always added: it
      // is structural (every video is watchable), not a topic claim.
      return [...(entry.video.tags ?? []), 'Videos'];
    case 'thread':
      return [filterForThread(entry.doorway.threadId)];
    case 'egg':
      return ['Lore'];
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
}
