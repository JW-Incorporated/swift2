// OS-034 — native threads mode data layer.
//
// Wires the SAME published content bundle every surface reads (OS-015's
// `ensureBundle` pattern, `vault.ts`/`era-stream-data.ts`) into
// `packages/experience`'s injected thread-content provider
// (`thread-content-provider.ts`) — the exact seam
// `apps/web/lib/longlive/threads.ts` uses to give `contentForThread` a real
// corpus to filter. Once wired, `THREADS`, `getThread`, and
// `contentForThread` (all `@swift2/experience`) are the SAME functions the
// web calls, so a thread's content and its chronological order match by
// construction (docs/specs/2026-09-05-one-source-three-surfaces.md, D2) —
// there is no second "which items belong to this thread" implementation to
// drift out of sync.
import { loadBundle } from '@swift2/content';
import type { ContentBundleFile } from '@swift2/content';
import { ERAS, setThreadContentProvider, type ContentItem, type EraId } from '@swift2/experience';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

let contentWired = false;
/** The full corpus, across every era's `content:<eraId>` manifest file — kept warm after the first successful wire so a second `ensureThreadContent()` call (e.g. re-opening Threads mode) is a no-op fetch-and-diff rather than a re-parse. */
let allContent: ContentItem[] = [];

/**
 * Loads the bundle and wires the full content corpus into
 * `@swift2/experience`'s `setThreadContentProvider` — required once before
 * `contentForThread`/`threadPoints` can return anything. Idempotent per
 * process; safe to call from every screen that needs threads data.
 */
export async function ensureThreadContent(): Promise<ContentItem[]> {
  const { files } = await loadBundle({ baseUrl: contentBaseUrl(), storage });

  const items: ContentItem[] = [];
  for (const era of ERAS) {
    const file = files[`content:${era.id as EraId}`] as ContentBundleFile | undefined;
    if (file) items.push(...(file.items as ContentItem[]));
  }
  allContent = items;

  if (!contentWired) {
    // A function (not a snapshot) so a later re-fetch (pull-to-refresh, a
    // future cache revalidation) can update the provider's answer without
    // re-registering it — same pattern `wireTheories` in
    // `era-stream-data.ts` uses for its own injected provider.
    setThreadContentProvider(() => allContent);
    contentWired = true;
  }

  return allContent;
}
