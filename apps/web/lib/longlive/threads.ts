import { CONTENT } from './content';
import type { ContentItem, EraId, LensId } from './types';

/**
 * A Thread's content, derived from tagged ContentItems (docs/decisions.md
 * 2026-07-10) rather than a hand-authored array — see `threadIds` on
 * ContentItem and `defaultThreadIdsForTags` in content.ts for how an item
 * ends up here. Oldest-first: unlike the era feed (which reads newest-first,
 * scrolling back in time), a thread is read as a story from its beginning.
 */
export function contentForThread(threadId: LensId): ContentItem[] {
  return CONTENT.filter((c) => c.threadIds?.includes(threadId)).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/**
 * Content tagged for `threadId` whose date falls inside [start, end] — the
 * per-entry "From the Eras" cross-link (issue #436, Thread -> Eras
 * direction). `contentForThread()` returns everything ever tagged into a
 * thread; this narrows that to the window one specific entry (a
 * relationship, a solo stretch, a re-record, …) actually covers, so the link
 * list is auto-derived from real date overlap rather than hand-picked per
 * entry. `end` null (open-ended, e.g. an ongoing relationship) uses today.
 */
export function contentForThreadInRange(
  threadId: LensId,
  start: string,
  end: string | null,
): ContentItem[] {
  const upto = end ?? new Date().toISOString().slice(0, 10);
  return contentForThread(threadId).filter((c) => c.date >= start && c.date <= upto);
}

/**
 * Content tagged for `threadId` belonging to one specific era — the
 * per-entry "From the Eras" cross-link for threads keyed by era rather than
 * a date range (e.g. Runway's one-look-per-era structure).
 */
export function contentForThreadInEra(threadId: LensId, eraId: EraId): ContentItem[] {
  return contentForThread(threadId).filter((c) => c.eraId === eraId);
}
