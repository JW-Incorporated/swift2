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
import * as SecureStore from 'expo-secure-store';
import type { DevicePlatform, DeviceRegistrationInput } from '@swift2/shared';
import { apiBaseUrl } from './api-base';
import { getOrCreateDeviceId } from './device-id';
import { registerNotificationChannels } from './notification-channels';
import { enqueueRegistration, type RegistrationWrite } from './registration-queue';

/**
 * Token-free registration flag, stored as the INVERSE ("explicitly unregistered", set by the in-app turn-off) so
 * devices that registered before the flag existed still read as registered.
 */
const REQUEST_TIMEOUT_MS = 10_000;
export const UNREGISTERED_KEY = 'longlive_push_unregistered';

/** Set when the in-app turn-off could not reach the server; cleared once a null-token write lands or a later opt-in supersedes it. */
export const OPTOUT_PENDING_KEY = 'longlive_push_optout_pending';

export async function isOptOutPending(): Promise<boolean> {
  return (await SecureStore.getItemAsync(OPTOUT_PENDING_KEY)) === '1';
}

async function sendAndSettle(write: RegistrationWrite): Promise<void> {
  await registerWithBackend(write);
  if (write.pushToken === null && (await isOptOutPending())) await SecureStore.deleteItemAsync(OPTOUT_PENDING_KEY);
}

export async function isExplicitlyUnregistered(): Promise<boolean> {
  return (await SecureStore.getItemAsync(UNREGISTERED_KEY)) === '1';
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
 *
 * Refreshes the token when permission is ALREADY granted and the user has not turned notifications off in-app;
 * otherwise upserts null. Never prompts. A token fetch failure falls back to the null upsert (non-fatal).
 */
export function registerDevice(): Promise<{ status: 'registered_no_token'; deviceId: string }> {
  return enqueueRegistration(async (isCurrent) => {
    const deviceId = await getOrCreateDeviceId();
    await registerNotificationChannels();
    let pushToken: string | null = null;
    try {
      if (Device.isDevice && (await Notifications.getPermissionsAsync()).status === 'granted' && !(await isExplicitlyUnregistered())) {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        pushToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
      }
    } catch (e) {
      console.warn('registerDevice: push token unavailable, registering without one', e);
      pushToken = null;
    }
    const result = { status: 'registered_no_token' as const, deviceId };
    // A newer user intent (unregister / explicit register) owns the server state; a stale refresh must not post.
    if (!isCurrent()) return { write: null, result };
    if (pushToken && (await isExplicitlyUnregistered())) pushToken = null;
    return { write: { deviceId, platform: currentPlatform(), pushToken }, result };
  }, sendAndSettle, { supersede: false });
}

/**
 * The in-app turn-off: records the opt-out flag, then upserts a null push token (never prompts, never fetches a
 * token). Supersedes any in-flight registration work.
 */
export function clearRegisteredToken(): Promise<void> {
  return enqueueRegistration(async (isCurrent) => {
    const deviceId = await getOrCreateDeviceId();
    if (!isCurrent()) return { write: null, result: undefined };
    await SecureStore.setItemAsync(UNREGISTERED_KEY, '1');
    await SecureStore.setItemAsync(OPTOUT_PENDING_KEY, '1');
    return { write: { deviceId, platform: currentPlatform(), pushToken: null }, result: undefined };
  }, sendAndSettle, { supersede: true });
}

/**
 * Retries a turn-off whose server write failed (launch / foreground). Idempotent: the cold refresh writes the null
 * token for an opted-out device and settles the flag; a no-op when nothing is pending. Never throws.
 */
export async function flushPendingOptOut(): Promise<void> {
  try {
    if (await isOptOutPending()) await registerDevice();
  } catch (e) {
    console.warn('flushPendingOptOut: still offline, will retry', e);
  }
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
export async function requestPushRegistration(opts: { clearOptOut?: boolean } = {}): Promise<PushRegistrationResult> {
  // The OS permission prompt can wait on the user indefinitely, so it runs OUTSIDE the queue.
  let finalStatus: string | null = null;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  }
  return enqueueRegistration(async (isCurrent) => {
    const deviceId = await getOrCreateDeviceId();
    await registerNotificationChannels();
    const platform = currentPlatform();
    const finish = async (result: PushRegistrationResult, pushToken: string | null) => {
      if (!isCurrent()) return { write: null, result }; // superseded by a newer user intent
      if (opts.clearOptOut) {
        await SecureStore.deleteItemAsync(UNREGISTERED_KEY);
        await SecureStore.deleteItemAsync(OPTOUT_PENDING_KEY);
      }
      return { write: { deviceId, platform, pushToken }, result };
    };

    if (!Device.isDevice) {
      // Simulators/emulators can't receive real pushes; still register the
      // device row (tz/locale/platform) so the API round-trip is exercised,
      // but don't attempt a token.
      return finish({ status: 'unsupported' }, null);
    }

    if (finalStatus !== 'granted') return finish({ status: 'permission_denied', deviceId }, null);

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      const pushToken = tokenResponse.data;
      return await finish({ status: 'registered', deviceId, pushToken }, pushToken);
    } catch (err) {
      return { write: null, result: { status: 'error', error: err instanceof Error ? err.message : String(err) } as PushRegistrationResult };
    }
  }, registerWithBackend, { supersede: true });
}
export const REGISTER_SEQ_KEY = 'longlive_register_seq';

/**
 * Persisted per-install write counter, stored as "<deviceId>:<n>" next to the device identity. A regenerated device id
 * (reinstall / data clear) is a new server row, so a counter scoped to another id restarts at 1. Never clock-derived,
 * so restarts, OTAs and clock rollback cannot lower it. Callers are serialized by the registration queue.
 */
async function nextSeq(deviceId: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(REGISTER_SEQ_KEY);
  const sep = raw ? raw.lastIndexOf(':') : -1;
  const prev = raw && sep > 0 && raw.slice(0, sep) === deviceId ? Number(raw.slice(sep + 1)) : 0;
  const next = (Number.isSafeInteger(prev) && prev > 0 ? prev : 0) + 1;
  await SecureStore.setItemAsync(REGISTER_SEQ_KEY, `${deviceId}:${next}`);
  return next;
}

async function registerWithBackend(input: {
  deviceId: string;
  platform: DevicePlatform;
  pushToken: string | null;
}): Promise<void> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const appVersion = Constants.expoConfig?.version ?? undefined;
  const body: DeviceRegistrationInput = {
    deviceId: input.deviceId,
    platform: input.platform,
    pushToken: input.pushToken,
    tz,
    locale,
    appVersion,
    seq: await nextSeq(input.deviceId),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBaseUrl()}/api/devices/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`devices/register: HTTP ${res.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
