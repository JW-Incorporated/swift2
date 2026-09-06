import type { ContentItem, VideoNote } from './types';
import type { CurrentItem } from '@swift2/shared';

/**
 * Feed/anchor/doorway type surface shared between `filters.ts` (moved here
 * in OS-021) and the feed-building logic that still lives in
 * `apps/web/lib/longlive/{anchor-date,era-feed,doorways}.ts` pending OS-022
 * (docs/specs/2026-09-05-one-source-three-surfaces.md §6). `filtersForEntry`
 * needs `EraFeedEntry`'s shape to categorise an entry, but the functions that
 * BUILD an `EraFeedEntry` (mergeEraFeed, threadDoorwaysForEra, …) are
 * explicitly OS-022/OS-023 scope — moving only the type here (not the
 * builder logic) keeps this card's diff to its own "Touches" list while
 * still giving `filters.ts` a real, non-circular home for the type it needs.
 *
 * OS-022/OS-023 should delete the equivalent local declarations in
 * `anchor-date.ts` / `era-feed.ts` / `doorways.ts` and import from here
 * instead, once the builder functions move alongside them.
 */

export type AnchorSource = 'exact' | 'related-item' | 'related-song' | 'clamped' | 'era-scatter';

export type Anchored = {
  /** ISO date used purely for sort order — always present. */
  sortDate: string;
  /** The date actually shown to a reader, or null when `via` isn't 'exact'
   * (the honesty rule: a scattered/clamped position is never presented as a
   * real date). */
  displayDate: string | null;
  via: AnchorSource;
};

/** A doorway into a THREADS gallery — see `doorways.ts`. */
export type ThreadDoorway = {
  threadId: import('./types').LensId;
  kicker: string;
  title: string;
  example: string;
};

/** A doorway into one theory/egg's detail — see `doorways.ts`. */
export type EggDoorway = {
  eggId: string;
  threadId: import('./types').LensId | null;
  kicker: string;
  title: string;
};

/** One entry in the merged era feed — see `era-feed.ts` for the builder. */
export type EraFeedEntry<V extends VideoNote = VideoNote> =
  | { kind: 'moment'; item: ContentItem; anchor: Anchored }
  | { kind: 'video'; video: V; anchor: Anchored }
  | { kind: 'thread'; doorway: ThreadDoorway; anchor: Anchored; displaced?: boolean }
  | { kind: 'egg'; doorway: EggDoorway; anchor: Anchored; displaced?: boolean }
  | { kind: 'current'; item: CurrentItem; anchor: Anchored };
