import { CONTENT } from './content';
import type { ContentItem, LensId } from './types';

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
