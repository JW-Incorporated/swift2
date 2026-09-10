// OS-037 — native merch data layer: reads the SAME published content
// bundle every surface reads (OS-015's `ensureBundle` pattern, mirrored
// from `era-stream-data.ts`) and hands back the `MerchCatalogue`
// (`shopTheLook`/`officialStore`/`fanMade`) the web's `MerchSection.tsx`
// renders from `@swift2/content-enrichment`'s `MERCH_CATALOGUE`. This is
// the bundle-backed equivalent of `apps/web/lib/longlive/merch.ts` — no
// generated-literal fallback here since this module only exists for the
// native surface, which has no build-time `.generated.ts` to read.
import { loadBundle, type MerchCatalogue } from '@swift2/content';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

/** The published bundle's merch catalogue — same shape and content the web's `MERCH_CATALOGUE` renders. */
export async function loadMerchCatalogue(): Promise<MerchCatalogue> {
  const { files } = await loadBundle({ baseUrl: contentBaseUrl(), storage });
  return files.merch as MerchCatalogue;
}
