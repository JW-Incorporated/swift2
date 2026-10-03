import type { ContentItem, LensId } from './types';
import type { ReaderCorpus } from './corpus';

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
export function contentForThreadIn(corpus: ReaderCorpus, threadId: LensId): ContentItem[] {
  return corpus
    .content()
    .filter((c) => c.threadIds?.includes(threadId))
    .sort((a, b) => a.date.localeCompare(b.date));
}
