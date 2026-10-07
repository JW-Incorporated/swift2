// Diagnostics-only persisted switches (watchdog failure drill, test page). Internal only.
import * as SecureStore from 'expo-secure-store';
import { parseDomFailureMode, type DomFailureMode } from './watchdog';

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

// WP0.5b: keep the WP0.4 test page reachable for the DOM host.
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
