// OS-032 — native era stream data layer.
//
// Reads the SAME published content bundle every surface reads (OS-015's
// `ensureBundle` pattern, `vault.ts`) and assembles the exact
// `EraStreamInputs` the shared `buildEraStreamViewModel` pipeline
// (`@swift2/experience/era-stream.ts`) needs for one era: the era's own
// curated moments, its playable video feed, and its thread/egg doorways —
// the same three inputs `apps/web/components/longlive/EraSection.tsx`
// assembles, sourced from the bundle instead of the web's generated-file
// imports.
//
// Live current-items (Stage 5 `current_item` rows) and image-suppression
// (`feedCardImageHidden`) are deliberately NOT wired here yet — OS-032's
// "done when" is section order parity for three eras' curated content, not
// the live-current overlay (that's `apps/web/lib/longlive/use-current-items`,
// a `/vault/current/[eraId]` ISR fetch with no native-app equivalent built
// yet) or the video-affordance photo-suppression rule (a purely cosmetic
// refinement layered on top of the same ordering, tracked for a follow-up
// once the native card renders images at all). Both default to empty/off,
// which `buildEraStreamViewModel` already treats as "no live entries" /
// "no image suppressed" — a strict subset of the web's behavior, not a
// divergence from it.
import { loadBundle } from '@swift2/content';
import type { ContentBundleFile, TheoriesBundleFile, VideosBundleFile } from '@swift2/content';
import {
  ERAS,
  buildEraStreamViewModel,
  embeddedYoutubeIds,
  threadDoorwaysForEra,
  eggDoorwaysForEra,
  setTheoriesRawProvider,
  type ContentItem,
  type Era,
  type EraId,
  type EraStreamViewModel,
  type TheoryNote,
} from '@swift2/experience';
import { eraVideoFeed, type PlayableVideoNote } from '@swift2/content-enrichment';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

async function ensureBundle() {
  return loadBundle({ baseUrl: contentBaseUrl(), storage });
}

/** Every `content:<eraId>` manifest entry's `items`, keyed by era — mirrors `vault-bundle-map.ts`'s `eraContentFiles`. */
function itemsForEra(files: Record<string, unknown>, eraId: EraId) {
  const file = files[`content:${eraId}`] as ContentBundleFile | undefined;
  return file?.items ?? [];
}

function videosRawForEra(files: Record<string, unknown>, eraId: EraId) {
  const flat = files.videos as VideosBundleFile[] | undefined;
  return flat?.find((f) => f.eraId === eraId)?.videos ?? [];
}

let theoriesWired = false;

/** Wires the bundle's theories into `@swift2/experience`'s injected provider (same seam as `apps/web/lib/longlive/theories.ts`) — required once before `eggDoorwaysForEra` can return anything. Idempotent; call before building any era's view-model. */
function wireTheories(files: Record<string, unknown>): void {
  const flat = files.theories as TheoriesBundleFile[] | undefined;
  const byEra: Partial<Record<EraId, TheoryNote[]>> = {};
  for (const f of flat ?? []) byEra[f.eraId] = f.theories;
  setTheoriesRawProvider(() => byEra);
  theoriesWired = true;
}

/** One era's golden view-model, built from the published bundle via the same shared pipeline the web uses. */
export async function loadEraStream(eraId: EraId): Promise<EraStreamViewModel<PlayableVideoNote>> {
  const { files } = await ensureBundle();
  if (!theoriesWired) wireTheories(files);

  const era = ERAS.find((e) => e.id === eraId);
  if (!era) throw new Error(`loadEraStream: unknown eraId "${eraId}"`);

  const items = itemsForEra(files, eraId);
  const embeddedVideoIds = embeddedYoutubeIds(items);
  const videoFeed = eraVideoFeed(videosRawForEra(files, eraId), embeddedVideoIds);
  const doorwayEntries = [
    ...threadDoorwaysForEra(era.id, era.start, era.end),
    ...eggDoorwaysForEra(era.id, era.start, era.end),
  ];

  return buildEraStreamViewModel({
    era,
    items,
    videoFeed,
    doorwayEntries,
    filters: new Set(),
  });
}

/** Every era, newest-first — the order `EraStream.tsx`'s selector and `RouteFlags`-gated native stream both present eras in. */
export function orderedEras(): Era[] {
  return [...ERAS].sort((a, b) => b.start.localeCompare(a.start));
}

/**
 * OS-033 — one moment by id, searched across every era's `content:<eraId>`
 * bundle file (mirrors `vault-bundle-map.ts`'s `findMoment`, which does the
 * same id search but returns the mapped Vault `Moment` shape; this returns
 * the raw `ContentItem` the shared `@swift2/experience` detail helpers
 * (video-affordance-equivalent lookups, `getEra`, etc.) expect). Returns
 * `undefined` for an unknown id — a dead `?item=` link degrades to "moment
 * not found" rather than throwing, the same silent-skip contract
 * `content-item-provider.ts` documents for the web's own lookup.
 */
export async function loadMomentById(itemId: string): Promise<ContentItem | undefined> {
  const { files } = await ensureBundle();
  if (!theoriesWired) wireTheories(files);
  for (const era of ERAS) {
    const items = itemsForEra(files, era.id);
    const found = items.find((item) => item.id === itemId);
    if (found) return found;
  }
  return undefined;
}
