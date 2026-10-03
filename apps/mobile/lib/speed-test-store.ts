// Speed test mode state: one small SecureStore JSON key, like the other
// Diagnostics switches (diagnostics-override.ts). Never leaves the device
// except as the opt-in `[diag]` reports it drives.
import * as SecureStore from 'expo-secure-store';

export const SPEED_TEST_KEY = 'longlive_diag_speed_test_v1';

export async function loadSpeedTestRaw(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SPEED_TEST_KEY);
  } catch {
    return null;
  }
}

export async function saveSpeedTestRaw(raw: string | null): Promise<void> {
  if (raw === null) await SecureStore.deleteItemAsync(SPEED_TEST_KEY);
  else await SecureStore.setItemAsync(SPEED_TEST_KEY, raw);
}
