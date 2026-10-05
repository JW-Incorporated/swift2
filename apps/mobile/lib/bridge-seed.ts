// Loads (or mints once) a per-install random seed in SecureStore and hands it to the bridge-token fallback.
import * as SecureStore from 'expo-secure-store';
import { newBridgeToken, setBridgeSeed } from './bridge-token';

const KEY = 'longlive_bridge_seed';

export async function primeBridgeSeed(): Promise<void> {
  try {
    let seed = await SecureStore.getItemAsync(KEY);
    if (!seed) {
      seed = newBridgeToken();
      await SecureStore.setItemAsync(KEY, seed);
    }
    setBridgeSeed(seed);
  } catch {
    /* best effort: the fallback still mixes the other sources */
  }
}
