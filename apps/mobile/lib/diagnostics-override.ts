// C4 preview override: "Force shared UI (this device)". Persisted, internal
// only. App.tsx reads it once per launch (WP0.4) and mounts the shared-UI DOM host.
import * as SecureStore from 'expo-secure-store';
import { parseDomFailureMode, STRIKES_TO_FALLBACK, type DomFailureMode } from './watchdog';

export const FORCE_SHARED_UI_KEY = 'longlive_diag_force_shared_ui';

export async function getForceSharedUi(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(FORCE_SHARED_UI_KEY)) === 'true';
  } catch {
    return false;
  }
}

// WP0.4b: tri-state "force DOM failure" (off / throw / hang) to drill the watchdog.
export const FORCE_DOM_FAILURE_KEY = 'longlive_diag_force_dom_failure';

export async function getForceDomFailure(): Promise<DomFailureMode> {
  try {
    return parseDomFailureMode(await SecureStore.getItemAsync(FORCE_DOM_FAILURE_KEY));
  } catch {
    return 'off';
  }
}

export async function setForceDomFailure(mode: DomFailureMode): Promise<void> {
  if (mode === 'off') await SecureStore.deleteItemAsync(FORCE_DOM_FAILURE_KEY);
  else await SecureStore.setItemAsync(FORCE_DOM_FAILURE_KEY, mode);
}

export async function setForceSharedUi(on: boolean): Promise<void> {
  if (on) await SecureStore.setItemAsync(FORCE_SHARED_UI_KEY, 'true');
  else await SecureStore.deleteItemAsync(FORCE_SHARED_UI_KEY);
}

// WP0.5b: keep the WP0.4 test page reachable now that the C4 override mounts ReaderSpike.
export const USE_TEST_PAGE_KEY = 'longlive_diag_use_test_page';

export async function getUseTestPage(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(USE_TEST_PAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setUseTestPage(on: boolean): Promise<void> {
  if (on) await SecureStore.setItemAsync(USE_TEST_PAGE_KEY, 'true');
  else await SecureStore.deleteItemAsync(USE_TEST_PAGE_KEY);
}

export interface PersistResult<T> {
  value: T;
  error: string | null;
}

/** Awaits a write, swallows its failure into `error`, then re-reads so the UI shows what is stored. */
export async function persistAndReread<T>(
  write: () => Promise<unknown>,
  read: () => Promise<T>,
): Promise<PersistResult<T>> {
  let error: string | null = null;
  try {
    await write();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return { value: await read(), error };
}

/** The watchdog turns the Force shared UI override off once it has reached the fallback strike count. */
export const strikeClearedOverride = (wd: { strikes: number } | null): boolean =>
  wd !== null && wd.strikes >= STRIKES_TO_FALLBACK;
