// Mobile data layer (OS-015, `docs/specs/2026-09-05-one-source-three-
// surfaces.md` §6). Reads the SAME published content bundle
// (`packages/content`'s `loadBundle`) every surface reads — no more direct
// Supabase reads (`createVaultClient`, `packages/core/src/vault.ts`, now
// deprecated: see that file's header). `expo-file-system` backs the loader's
// injectable `StorageAdapter` so a bundle already fetched once survives an
// app restart and the offline-with-cache "done when" (network off after one
// successful load still renders).
import * as FileSystem from 'expo-file-system';
import { loadBundle, type StorageAdapter } from '@swift2/content';
import type { VaultSkeleton } from '@swift2/core';
import type { Moment, TrackNote } from '@swift2/shared';
import {
  findMoment,
  findTrackGuide,
  mapBundleToSkeleton,
  type Manifest,
} from './vault-bundle-map';

/**
 * Where the published bundle lives. Same convention as the web
 * (`apps/web/next.config.*` writes to `public/content/`, mirrored to
 * Supabase Storage by OS-012's publish job) — mobile reads the public,
 * CDN-fronted URL directly since it has no build-time filesystem to bake
 * content into. Overridable via `EXPO_PUBLIC_CONTENT_BASE_URL` for local
 * dev against a non-production deploy (mirrors `apps/web/lib/vault.ts`'s
 * `VAULT_FALLBACK_BASE_URL` escape hatch).
 */
function contentBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_CONTENT_BASE_URL ?? 'https://www.longlivets.com/content'
  ).replace(/\/+$/, '');
}

// expo-file-system's directory constants moved from top-level exports
// (`FileSystem.documentDirectory`) to the `Paths` namespace across SDK
// majors; `Paths.document` (a `Directory`, not a bare string) is the
// current SDK 57 shape. One JSON blob per cache key, one file per key,
// under a dedicated subdirectory so a manual "clear cache" never has to
// guess which files are ours.
const CACHE_DIR = new FileSystem.Directory(FileSystem.Paths.document, 'swift2-content-cache');

function cacheFile(key: string): FileSystem.File {
  // Cache keys are `@swift2/content:v1:<baseUrl>:<suffix>` (see load.ts) —
  // safe as a filename once ':' and '/' (from the baseUrl) are escaped, so
  // two different baseUrls (prod vs a dev override) never collide on disk.
  const safeName = encodeURIComponent(key);
  return new FileSystem.File(CACHE_DIR, `${safeName}.json`);
}

/** `StorageAdapter` (packages/content/src/cache.ts) backed by expo-file-system, so a bundle validated once survives
 * an app restart — the loader's `TransportError` fallback (offline, no network) can then serve last-good from disk
 * instead of only from the in-memory default. */
function expoFileSystemStorageAdapter(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      const file = cacheFile(key);
      if (!file.exists) return null;
      try {
        return file.textSync();
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      if (!CACHE_DIR.exists) CACHE_DIR.create({ intermediates: true });
      const file = cacheFile(key);
      file.write(value);
    },
    removeItem(key: string): void {
      const file = cacheFile(key);
      if (file.exists) file.delete();
    },
  };
}

const storage = expoFileSystemStorageAdapter();

/** In-memory holder for the last successfully-mapped bundle's raw `files`, so `loadMoment`/`loadTrackGuide` (Tier 1
 * lookups) don't have to reload+revalidate the whole bundle for every on-demand call — `loadSkeleton()` primes it. */
let lastBundleFiles: Record<string, unknown> | null = null;

async function ensureBundle() {
  const loaded = await loadBundle({ baseUrl: contentBaseUrl(), storage });
  lastBundleFiles = loaded.files;
  return loaded;
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
 * this looks the id up in the last-loaded bundle, loading one if `loadSkeleton()` hasn't run yet this session. */
export async function loadMoment(id: string): Promise<Moment | null> {
  const files = lastBundleFiles ?? (await ensureBundle()).files;
  return findMoment(files, id);
}

/** An album's song track guide, from the same already-loaded bundle. */
export async function loadTrackGuide(eraSlug: string): Promise<TrackNote[]> {
  const files = lastBundleFiles ?? (await ensureBundle()).files;
  return findTrackGuide(files, eraSlug);
}

/** Re-exported for callers that want to know which bundle is currently loaded (e.g. a future debug screen), without
 * reaching into `vault-bundle-map.ts` directly. */
export type { Manifest };
