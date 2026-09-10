// OS-038 — native search data layer.
//
// Builds a `SearchDoc[]` index from the SAME published content bundle every
// native screen reads (`era-stream-data.ts`'s `ensureBundle` pattern) and
// the same `makeSearchDoc` factory + ranking engine the web's
// `apps/web/lib/longlive/search.ts` uses (`@swift2/experience`'s
// `search-index.ts`, OS-025) — so a query returns the same-shaped, same-
// ranked results on both surfaces.
//
// Scoped to what the native app actually renders today (era stream +
// moments, OS-032): `era` and `moment` doc types. Threads, tracks, theories,
// and videos each have their own native home landing in OS-034/OS-035/
// OS-037 — indexing them here ahead of a native screen to open them on would
// produce search hits with nowhere to go, the same reasoning `MomentCard.tsx`
// documents for its `PlaceholderFeedRow`. Extending this index is a one-line
// addition per follow-up card, mirroring `search.ts`'s per-domain loop.
import { loadBundle } from '@swift2/content';
import type { ContentBundleFile } from '@swift2/content';
import { ERAS, makeSearchDoc, type SearchDoc } from '@swift2/experience';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

async function ensureBundle() {
  return loadBundle({ baseUrl: contentBaseUrl(), storage });
}

/** Every `content:<eraId>` manifest entry's `items` — mirrors `era-stream-data.ts`'s `itemsForEra`. */
function itemsForEra(files: Record<string, unknown>, eraId: string) {
  const file = files[`content:${eraId}`] as ContentBundleFile | undefined;
  return file?.items ?? [];
}

let cachedIndex: SearchDoc[] | null = null;

/** Builds the full index from the published bundle — every era, every era's curated moments. Pure given the loaded bundle; exported for tests. */
export function buildSearchIndex(files: Record<string, unknown>): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const era of ERAS) {
    docs.push(
      makeSearchDoc('era', era.id, era.name, era.tagline, era.id, { kind: 'era', eraId: era.id }, [
        era.album,
        era.shortName,
        era.yearLabel,
        era.tagline,
        era.intro,
      ]),
    );

    for (const item of itemsForEra(files, era.id)) {
      docs.push(
        makeSearchDoc(
          'moment',
          item.id,
          item.title,
          item.summary,
          era.id,
          { kind: 'moment', itemId: item.id },
          [item.summary, ...item.body, item.tags.join(' '), item.dateLabel],
          item.significance === 'defining' ? 45 : item.significance === 'notable' ? 18 : 0,
        ),
      );
    }
  }

  return docs;
}

/** The app's index — built once, from the published bundle, cached for the process lifetime (mirrors `search.ts`'s `getSearchIndex` singleton). */
export async function getSearchIndex(): Promise<SearchDoc[]> {
  if (cachedIndex) return cachedIndex;
  const { files } = await ensureBundle();
  cachedIndex = buildSearchIndex(files);
  return cachedIndex;
}
