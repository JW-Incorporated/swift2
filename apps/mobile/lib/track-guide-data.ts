// OS-035 — native track guide + song page data layer.
//
// Reads the SAME published content bundle every surface reads (OS-015's
// `ensureBundle` pattern — see `era-stream-data.ts`) and wires the bundle's
// `tracks.json` file into `@swift2/experience`'s injected track-catalogue
// provider (`setTracksRawProvider`), the same seam `apps/web/lib/longlive/
// tracks.ts` fills on the web. Once wired, every headless track-guide
// accessor (`tracksForEra`, `trackKey`, `resolveTrackKey`,
// `releasedFactValue`, `adjacentTrackOnAlbum`, `keepExploring`,
// `nextTrackOnAlbum`) works exactly as it does on the web — this file's only
// job is the wiring, never re-deriving any of that logic.
//
// Also wires `setContentItemLookup` from every `content:<eraId>` bundle file
// so `keepExploring`'s `moment:` connections resolve to a real `ContentItem`
// (needed for the "Keep exploring" section to even render a moment entry) —
// the same lookup `apps/web/lib/longlive/content.ts` wires for the web.
// Native has no moment-detail screen yet (that's OS-033/OS-037), so a
// resolved moment connection still just renders a label in the "Keep
// exploring" list; tapping it is a documented no-op (see SongScreen.tsx),
// matching OS-032's `handleOpenItem` no-op precedent.
import { loadBundle } from '@swift2/content';
import type { ContentBundleFile, TracksBundleFile } from '@swift2/content';
import {
  setContentItemLookup,
  setTracksRawProvider,
  tracksForEra,
  type ContentItem,
  type EraId,
  type TrackNote,
} from '@swift2/experience';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

async function ensureBundle() {
  return loadBundle({ baseUrl: contentBaseUrl(), storage });
}

/** Every `content:<eraId>` manifest entry's `items` — mirrors `era-stream-data.ts`'s `itemsForEra`, but flattened across every era since a track's "Keep exploring" moment connection can point at any album's content, not just its own. */
function allContentItems(files: Record<string, unknown>): ContentItem[] {
  return Object.entries(files)
    .filter(([name]) => name.startsWith('content:'))
    .flatMap(([, value]) => (value as ContentBundleFile).items);
}

let tracksWired = false;
let contentItemsWired = false;

/** Wires the bundle's tracks into `@swift2/experience`'s injected track-catalogue provider (same seam as the web's `lib/longlive/tracks.ts`). Idempotent; call before any track-guide accessor runs. */
function wireTracks(files: Record<string, unknown>): void {
  const flat = files.tracks as TracksBundleFile[] | undefined;
  const byEra: Partial<Record<EraId, TrackNote[]>> = {};
  for (const f of flat ?? []) byEra[f.eraId as EraId] = f.tracks;
  setTracksRawProvider(byEra);
  tracksWired = true;
}

/** Wires a global (cross-era) content-item lookup so `keepExploring`'s `moment:` connections resolve — see this file's header doc. Idempotent. */
function wireContentItems(files: Record<string, unknown>): void {
  const byId = new Map<string, ContentItem>();
  for (const item of allContentItems(files)) byId.set(item.id, item);
  setContentItemLookup((id) => byId.get(id));
  contentItemsWired = true;
}

/** Ensures the bundle is loaded and both providers above are wired, then returns the bundle's files map for any further per-era reads a caller needs. Safe to call from every screen mount — `loadBundle` itself is cheap on an already-current bundle (manifest revalidated by ETag, not re-downloaded). */
export async function ensureTrackGuideWired(): Promise<Record<string, unknown>> {
  const { files } = await ensureBundle();
  if (!tracksWired) wireTracks(files);
  if (!contentItemsWired) wireContentItems(files);
  return files;
}

/** One era's track guide — every sourced song, generator-sorted (track number ascending, unnumbered last). Analogous to `era-stream-data.ts`'s `loadEraStream`: wires the bundle in, then defers entirely to the shared `tracksForEra` accessor. */
export async function loadTrackGuide(eraId: EraId): Promise<TrackNote[]> {
  await ensureTrackGuideWired();
  return tracksForEra(eraId);
}
