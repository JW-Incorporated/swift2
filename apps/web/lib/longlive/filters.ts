import type { ContentTag } from './types';
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
 *  2. A dated music video is Music, not just Videos — the old code encoded
 *     the topic in the selection rule (`visibleVideos`) rather than on the
 *     record. Everything else in the video kind space (lyric videos, tour
 *     films, the appearance family) gets Videos only — no invented topics.
 *
 * `EraFeedEntry` is the two-kind union as it exists today (`moment` | `video`)
 * — step 13 of PLAN.md widens it to four kinds. The `never` check below turns
 * that widening into a compile error here rather than a silent fallthrough
 * that would leave the new kinds unfiltered.
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
      // VideoNote carries no topic tags of its own (see types.ts) — a video
      // record is a topic entry ONLY in this one documented case, never
      // invented into a topic it isn't authored with.
      return entry.video.kind === 'music_video' && entry.video.releasedOn != null
        ? ['Music', 'Videos']
        : ['Videos'];
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
}
