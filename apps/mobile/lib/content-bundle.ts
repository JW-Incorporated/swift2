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
  fetchUpdateAsync(): Promise<unknown>;
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
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    // Self-heal is best-effort; the app keeps running on what it has.
  }
}

export async function loadContentBundle(): Promise<LoadedBundle> {
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
