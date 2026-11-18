// Diagnostics-only persisted switches (watchdog failure drill, test page). Internal only. Each applies to one launch.
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

export interface LaunchOverrides {
  failure: DomFailureMode;
  testPage: boolean;
}

let launchOverrides: Promise<LaunchOverrides> | null = null;

/**
 * The drills are one-launch-only: read once per JS runtime (every caller this launch sees the same answer), and an
 * armed one is wiped from storage as soon as it is read, so the next launch is normal whatever happens to this one.
 * A read that throws counts as "off" for this launch but still wipes, and a failed wipe is retried once (never awaited).
 */
export function takeLaunchOverrides(): Promise<LaunchOverrides> {
  launchOverrides ??= Promise.all([readRaw(FORCE_DOM_FAILURE_KEY), readRaw(USE_TEST_PAGE_KEY)]).then(([f, t]) => {
    const failure = parseDomFailureMode(f.value);
    const testPage = t.value === 'true';
    if (failure !== 'off' || testPage || f.failed || t.failed) void clearWithRetry();
    return { failure, testPage };
  });
  return launchOverrides;
}

async function readRaw(key: string): Promise<{ value: string | null; failed: boolean }> {
  try {
    return { value: await SecureStore.getItemAsync(key), failed: false };
  } catch {
    return { value: null, failed: true };
  }
}

async function clearWithRetry(): Promise<void> {
  try {
    await clearDiagOverrides();
  } catch {
    await clearDiagOverrides().catch(() => undefined);
  }
}

/** Removes both drills from storage (Recovery Retry, and the consume step above). */
export async function clearDiagOverrides(): Promise<void> {
  await Promise.all([setForceDomFailure('off'), setUseTestPage(false)]);
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
