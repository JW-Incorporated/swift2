// Notifications Phase 0 (NOTIFICATIONS_SPEC.md §2/§7) — FCM push registration.
//
// Scope note: Phase 0 wires the mechanics (permission request, token
// acquisition, server registration). The pre-permission onboarding screen
// with the three presets (spec §7) and the actual "ask at a value moment"
// trigger are Phase 2 scope (NOTIFICATIONS_PLAN.md) — this module exposes
// `requestPushRegistration()` for a future caller to invoke at the right
// moment, it does not call itself on app start.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { DevicePlatform } from '@swift2/shared';
import { getOrCreateDeviceId } from './device-id';
import { registerNotificationChannels } from './notification-channels';

function apiBaseUrl(): string {
  // Same fallback-base pattern apps/web/lib/vault.ts uses for its own
  // preview fallback — the mobile app talks to the deployed API for the
  // registration endpoint (there's no local backend to point at from a
  // device/emulator). Overridable for local dev against `next dev`.
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://swift2-web-nine.vercel.app'
  ).replace(/\/$/, '');
}

function currentPlatform(): DevicePlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export type PushRegistrationResult =
  | { status: 'registered'; deviceId: string; pushToken: string }
  | { status: 'registered_no_token'; deviceId: string } // device row exists, permission not granted / no token yet
  | { status: 'permission_denied'; deviceId: string }
  | { status: 'unsupported' } // simulators/emulators have no push capability
  | { status: 'error'; error: string };

/**
 * Phase 0 cold-start call: ensures a device_id exists, sets up Android
 * channels, and registers/refreshes the `devices` row — WITHOUT ever asking
 * for notification permission. Safe to call on every app start (App.tsx
 * does). This alone satisfies Phase 0's acceptance criterion ("fresh install
 * on both platforms registers a devices row") without violating spec §7's
 * "never fire the OS permission dialog cold on first launch" — that ask is
 * gated behind the pre-permission onboarding screen, Phase 2 scope, which
 * calls `requestPushRegistration()` below at the right moment instead.
 */
export async function registerDevice(): Promise<{ status: 'registered_no_token'; deviceId: string }> {
  const deviceId = await getOrCreateDeviceId();
  await registerNotificationChannels();
  await registerWithBackend({ deviceId, platform: currentPlatform(), pushToken: null });
  return { status: 'registered_no_token', deviceId };
}

/**
 * Full Phase 0 registration flow: ensure a device_id exists, set up Android
 * channels, request notification permission, get an Expo/FCM push token if
 * granted, and upsert the device with the backend. Safe to call multiple
 * times (idempotent upsert-by-device_id) — this is also the token-refresh
 * path (spec's Phase 0 acceptance criterion).
 *
 * DOES show the OS permission dialog if not yet decided — only call this
 * from the value-moment trigger (Phase 2's pre-permission onboarding
 * screen), never unconditionally on cold start. `registerDevice()` above is
 * the cold-start-safe variant.
 */
export async function requestPushRegistration(): Promise<PushRegistrationResult> {
  const deviceId = await getOrCreateDeviceId();
  await registerNotificationChannels();

  if (!Device.isDevice) {
    // Simulators/emulators can't receive real pushes; still register the
    // device row (tz/locale/platform) so the API round-trip is exercised,
    // but don't attempt a token.
    await registerWithBackend({ deviceId, platform: currentPlatform(), pushToken: null });
    return { status: 'unsupported' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    await registerWithBackend({ deviceId, platform: currentPlatform(), pushToken: null });
    return { status: 'permission_denied', deviceId };
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const pushToken = tokenResponse.data;
    await registerWithBackend({ deviceId, platform: currentPlatform(), pushToken });
    return { status: 'registered', deviceId, pushToken };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

async function registerWithBackend(input: {
  deviceId: string;
  platform: DevicePlatform;
  pushToken: string | null;
}): Promise<void> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const appVersion = Constants.expoConfig?.version ?? undefined;

  const res = await fetch(`${apiBaseUrl()}/api/devices/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      deviceId: input.deviceId,
      platform: input.platform,
      pushToken: input.pushToken,
      tz,
      locale,
      appVersion,
    }),
  });
  if (!res.ok) {
    throw new Error(`devices/register: HTTP ${res.status}`);
  }
}
