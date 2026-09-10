import type { ContentItem, EraId, LensId } from './types';
import { contentForThreadInjected } from './thread-content-provider';

/**
 * A Thread's content, derived from tagged ContentItems (docs/decisions.md
 * 2026-07-10) rather than a hand-authored array — see `threadIds` on
 * ContentItem and `defaultThreadIdsForTags` in `apps/web/lib/longlive/
 * content.ts` for how an item ends up here. Oldest-first: unlike the era feed
 * (which reads newest-first, scrolling back in time), a thread is read as a
 * story from its beginning.
 *
 * Moved into `packages/experience` in OS-023
 * (docs/specs/2026-09-05-one-source-three-surfaces.md §6). The real content
 * corpus lookup (`CONTENT.filter(...)`) is app-layer/OS-013-OS-014 scope, so
 * — same seam OS-021 established for `lenses.ts`'s `threadPoints` — this
 * reads through the injected `contentForThreadInjected` provider
 * (`apps/web/lib/longlive/threads.ts` wires the real implementation in at
 * import time) instead of importing the app's content module directly.
 */
export function contentForThread(threadId: LensId): ContentItem[] {
  return contentForThreadInjected()
    .filter((c) => c.threadIds?.includes(threadId))
    .sort((a, b) => a.date.localeCompare(b.date));
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
