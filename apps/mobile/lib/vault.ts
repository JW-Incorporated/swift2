// Mobile data layer (OS-015, `docs/specs/2026-09-05-one-source-three-
// surfaces.md` §6). Reads the SAME published content bundle
// (`packages/content`'s `loadBundle`) every surface reads — no more direct
// Supabase reads (`createVaultClient`, `packages/core/src/vault.ts`, now
// deprecated: see that file's header). `expo-file-system` backs the loader's
// injectable `StorageAdapter` so a bundle already fetched once survives an
// app restart and the offline-with-cache "done when" (network off after one
// successful load still renders).
import { loadBundle } from '@swift2/content';
import type { VaultSkeleton } from '@swift2/core';
import type { Moment, TrackNote } from '@swift2/shared';
import {
  findMoment,
  findTrackGuide,
  mapBundleToSkeleton,
  type Manifest,
} from './vault-bundle-map';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

/**
 * Loads the current published bundle. Always calls `loadBundle`, never short-circuits on an in-memory cache: the
 * loader itself re-checks `current.json` and revalidates the manifest by ETag every call, so a fresh publish is
 * picked up immediately (a stale in-memory copy here would otherwise let `loadMoment`/`loadTrackGuide` keep serving
 * an old bundle version indefinitely after `loadSkeleton()` last ran, even once a newer one is live) — a 304 makes
 * the "already have this version" case just as cheap as an in-memory read would have been.
 */
async function ensureBundle() {
  return loadBundle({ baseUrl: contentBaseUrl(), storage });
}

/** Tier 0 Vault skeleton — the always-resident eras/milestones/month index, now read from the published content
 * bundle instead of a live Supabase query. Offline-with-last-good per OS-013's loader: a genuine transport failure
 * (no network) falls back to whatever bundle was cached to disk by a previous successful load; a reachable-but-
 * corrupted response still throws (see `packages/content/src/load.ts`'s module doc). */
export async function loadSkeleton(): Promise<VaultSkeleton> {
  const { files } = await ensureBundle();
  return mapBundleToSkeleton(files);
}

/** One Tier 1 moment. The content bundle carries every item's full body up front (no per-item network fetch), so
 * this is a local lookup once the current bundle is loaded — see `ensureBundle`'s doc for why every call re-checks
 * the published version rather than trusting a cached one. */
export async function loadMoment(id: string): Promise<Moment | null> {
  const { files } = await ensureBundle();
  return findMoment(files, id);
}

/** An album's song track guide, from the current published bundle. */
export async function loadTrackGuide(eraSlug: string): Promise<TrackNote[]> {
  const { files } = await ensureBundle();
  return findTrackGuide(files, eraSlug);
}

/** Re-exported for callers that want to know which bundle is currently loaded (e.g. a future debug screen), without
 * reaching into `vault-bundle-map.ts` directly. */
export type { Manifest };
