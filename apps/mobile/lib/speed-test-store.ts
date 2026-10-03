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

// Reports waiting to be (re)sent: one key per entry (SecureStore values should stay
// small) plus a count key. Bounded by MAX_OUTBOX in speed-test.ts.
export const SPEED_OUTBOX_KEY = 'longlive_diag_speed_outbox_v1';

export async function loadSpeedOutbox(): Promise<string[]> {
  try {
    const n = Number(await SecureStore.getItemAsync(`${SPEED_OUTBOX_KEY}_n`));
    if (!Number.isInteger(n) || n < 1 || n > 16) return [];
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const v = await SecureStore.getItemAsync(`${SPEED_OUTBOX_KEY}_${i}`);
      if (v) out.push(v);
    }
    return out;
  } catch {
    return [];
  }
}

export async function saveSpeedOutbox(entries: string[]): Promise<void> {
  const prev = Number(await SecureStore.getItemAsync(`${SPEED_OUTBOX_KEY}_n`).catch(() => '0')) || 0;
  for (let i = 0; i < entries.length; i++) await SecureStore.setItemAsync(`${SPEED_OUTBOX_KEY}_${i}`, entries[i]);
  for (let i = entries.length; i < Math.min(prev, 16); i++) {
    await SecureStore.deleteItemAsync(`${SPEED_OUTBOX_KEY}_${i}`);
  }
  if (entries.length === 0) await SecureStore.deleteItemAsync(`${SPEED_OUTBOX_KEY}_n`);
  else await SecureStore.setItemAsync(`${SPEED_OUTBOX_KEY}_n`, String(entries.length));
}
