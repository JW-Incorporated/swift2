// The one place mobile loads the content bundle. Forward-compatible by policy
// (docs/decisions.md 2026-10-01): unknown enum values are dropped, unknown
// catalogues skipped, a broken publish serves last-good, and any of those
// triggers a once-per-process OTA self-heal so old JS fixes itself.
import { loadBundle, type LoadedBundle } from '@swift2/content';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';

const storage = expoFileSystemStorageAdapter();

export interface UpdatesLike {
  isEnabled: boolean;
  checkForUpdateAsync(): Promise<{ isAvailable: boolean }>;
  fetchUpdateAsync(): Promise<{ isNew: boolean }>;
  reloadAsync(): Promise<unknown>;
}

let updatesOverride: UpdatesLike | null = null;
let selfHealStarted = false;

/** Test seam: inject a fake `expo-updates` (null restores the real module). */
export function setUpdatesForTests(updates: UpdatesLike | null): void {
  updatesOverride = updates;
}

/** Test seam: re-arm the once-per-process guard. */
export function resetSelfHealForTests(): void {
  selfHealStarted = false;
}

/** Check -> fetch -> reload via expo-updates, at most once per JS process. Never throws or rejects. */
export async function selfHealOnce(): Promise<void> {
  if (selfHealStarted) return;
  selfHealStarted = true;
  try {
    // Loaded lazily so importing this module never pulls native code into unit tests.
    const Updates: UpdatesLike = updatesOverride ?? (await import('expo-updates'));
    if (!Updates.isEnabled) return;
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;
    // Only a genuinely new update may reload: reloading into the same JS
    // would degrade again on next launch and loop.
    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return;
    await Updates.reloadAsync();
  } catch {
    // Self-heal is best-effort; the app keeps running on what it has.
  }
}

let inFlight: Promise<LoadedBundle> | null = null;
let memo: LoadedBundle | null = null;

/** Test seam: drop the in-process memo and any in-flight load. */
export function resetBundleMemoForTests(): void {
  memo = null;
  inFlight = null;
}

/**
 * The lightweight pointer check. 'unreachable' (network/HTTP failure) keeps the memo silently;
 * 'malformed' (reachable but unparseable) is a data problem that must still trigger the OTA repair.
 */
async function fetchCurrentVersion(): Promise<string | 'unreachable' | 'malformed'> {
  let res: Response;
  try {
    res = await fetch(`${contentBaseUrl().replace(/\/+$/, '')}/current.json`);
    if (!res.ok) return 'unreachable';
  } catch {
    return 'unreachable';
  }
  try {
    const body = (await res.json()) as { bundleVersion?: unknown };
    return typeof body.bundleVersion === 'string' && body.bundleVersion ? body.bundleVersion : 'malformed';
  } catch {
    return 'malformed';
  }
}

/**
 * The settled bundle is kept for the process lifetime: re-reading and parsing
 * the multi-MB cache is a synchronous RN-thread stall (20-250 ms). Later calls
 * only revalidate the tiny current.json pointer; a changed version reloads and
 * replaces the memo atomically, and a failed reload keeps the previous memo.
 * Concurrent callers share ONE in-flight load (the era stream mounts several
 * sections at once). Options are fixed in this module, so every caller's equal.
 */
export function loadContentBundle(): Promise<LoadedBundle> {
  if (inFlight) return inFlight;
  const run = refresh();
  const slot = run.finally(() => {
    if (inFlight === slot) inFlight = null;
  });
  inFlight = slot;
  return slot;
}

async function refresh(): Promise<LoadedBundle> {
  const held = memo;
  let advertised: string | null = null;
  if (held) {
    const current = await fetchCurrentVersion();
    if (current === 'unreachable') return held;
    if (current === 'malformed') {
      void selfHealOnce();
      return held;
    }
    if (current === held.manifest?.bundleVersion) return held;
    advertised = current;
  }
  try {
    const next = await loadOnce();
    // A resolved fallback (stale last-good) must not displace a memo: only the advertised version replaces it.
    if (held && next.manifest?.bundleVersion !== advertised) return held;
    memo = next;
    return next;
  } catch (err) {
    if (held) return held;
    throw err;
  }
}

async function loadOnce(): Promise<LoadedBundle> {
  let bundle: LoadedBundle;
  try {
    bundle = await loadBundle({
      baseUrl: contentBaseUrl(),
      storage,
      unknownEnumPolicy: 'drop',
      dataErrorFallback: 'last-good',
    });
  } catch (err) {
    void selfHealOnce();
    throw err;
  }
  if (bundle.dataError || (bundle.skipped && bundle.skipped.length > 0)) void selfHealOnce();
  return bundle;
}
