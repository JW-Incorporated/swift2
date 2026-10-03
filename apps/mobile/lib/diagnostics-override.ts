// C4 preview override: "Force shared UI (this device)". Persisted, internal
// only. App.tsx reads it once per launch (WP0.4) and mounts the shared-UI DOM host.
import * as SecureStore from 'expo-secure-store';
import { parseDomFailureMode, type DomFailureMode } from './watchdog';

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
