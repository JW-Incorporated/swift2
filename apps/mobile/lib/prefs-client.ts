// Notifications Phase 1 (NOTIFICATIONS_SPEC.md §8, NOTIFICATIONS_PLAN.md
// Phase 1) — mobile client for the prefs API. Talks to the deployed
// `GET/PUT /api/devices/:id/prefs` route (same `apiBaseUrl()` fallback
// pattern `push-registration.ts` uses — there's no local backend to point
// at from a device/emulator).
import type {
  DeviceNotificationSettings,
  DevicePrefsResponse,
  NotificationPref,
} from '@swift2/shared';
import { getOrCreateDeviceId } from './device-id';

function apiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://swift2-web-nine.vercel.app').replace(
    /\/$/,
    '',
  );
}

async function prefsUrl(): Promise<string> {
  const deviceId = await getOrCreateDeviceId();
  return `${apiBaseUrl()}/api/devices/${deviceId}/prefs`;
}

/** Fetches the full settings screen's state in one call — device settings
 * (master switch, snooze, daily cap, quiet hours, digest hour) plus every
 * category's current cadence. */
export async function fetchDevicePrefs(): Promise<DevicePrefsResponse> {
  const url = await prefsUrl();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET prefs: HTTP ${res.status}`);
  }
  return (await res.json()) as DevicePrefsResponse;
}

/**
 * Instant-apply write (spec §8: "changes apply instantly — no save
 * button"). Callers send only what changed — a single pill tap sends one
 * `prefs` entry, the master switch sends one `settings` field — never a
 * whole-form batch. Returns the round-tripped state so the caller can
 * reconcile optimistic UI with the server's actual write.
 */
export async function saveDevicePrefs(input: {
  settings?: Partial<DeviceNotificationSettings>;
  prefs?: NotificationPref[];
}): Promise<DevicePrefsResponse> {
  const url = await prefsUrl();
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`PUT prefs: HTTP ${res.status}`);
  }
  return (await res.json()) as DevicePrefsResponse;
}

/** One category's cadence changed — the settings screen's per-row handler.
 * Never batches with an unrelated field (instant-apply, one control at a
 * time per spec §8). */
export async function setCategoryCadence(pref: NotificationPref): Promise<DevicePrefsResponse> {
  return saveDevicePrefs({ prefs: [pref] });
}

/** One device-level setting changed (master switch, snooze, daily limit,
 * quiet hours, digest time) — same instant-apply contract. */
export async function setDeviceSetting(
  patch: Partial<DeviceNotificationSettings>,
): Promise<DevicePrefsResponse> {
  return saveDevicePrefs({ settings: patch });
}
