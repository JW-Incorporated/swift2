// Notifications Phase 0 (NOTIFICATIONS_SPEC.md §2) — anonymous device_id.
//
// Generated once on first launch, persisted via Expo SecureStore (the RN
// equivalent of iOS Keychain / Android EncryptedSharedPreferences), so it
// survives app updates but NOT uninstall/reinstall (spec §2's stated,
// accepted tradeoff). Never sent anywhere except `POST /api/devices/register`
// and never tied to a login — identity here IS the device, not a user.
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'longlive_device_id';

/** RFC 4122 v4 UUID via the platform's CSPRNG (`expo-crypto`'s
 * `getRandomBytes` equivalent is unnecessary here — `crypto.randomUUID` is
 * available in the Hermes runtime on SDK 57+; no extra dependency needed). */
function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for any runtime where the Hermes crypto global isn't present
  // (should not happen on SDK 57, kept defensive rather than throwing).
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex
    .slice(8, 10)
    .join('')}-${hex.slice(10, 16).join('')}`;
}

/**
 * Returns this install's persistent anonymous device id, minting and
 * persisting one on first call. Idempotent across the app's lifetime — every
 * caller (registration, token refresh, future prefs calls) gets the same id.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = generateDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}

/** Test/debug only — never called from app code. */
export async function clearDeviceIdForTests(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
}
