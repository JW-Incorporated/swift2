// C4 preview override: "Force shared UI (this device)". Persisted, internal
// only. App.tsx reads it once per launch (WP0.4) and mounts the shared-UI DOM host.
import * as SecureStore from 'expo-secure-store';

export const FORCE_SHARED_UI_KEY = 'longlive_diag_force_shared_ui';

export async function getForceSharedUi(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(FORCE_SHARED_UI_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setForceSharedUi(on: boolean): Promise<void> {
  if (on) await SecureStore.setItemAsync(FORCE_SHARED_UI_KEY, 'true');
  else await SecureStore.deleteItemAsync(FORCE_SHARED_UI_KEY);
}
