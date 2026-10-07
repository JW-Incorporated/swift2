// Wire contracts for `POST /api/devices/register` and
// `GET/PUT /api/devices/:id/prefs`. The request/prefs shapes already live in
// `notifications-types.ts` (`DeviceRegistrationInput`, `DevicePrefsResponse`,
// `DevicePrefsUpdateInput`) and are reused as-is; this file adds only the
// register response and the runtime guards.
import { isAnyNotificationCategory, isNotificationCadence } from '../notifications-types';
import type { DevicePrefsResponse } from '../notifications-types';

/** `POST /api/devices/register` 200 response. */
export interface DeviceRegisterResponse {
  ok: true;
  device: {
    id: string;
    platform: string;
    tz: string;
    lastSeenAt: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isDeviceRegisterResponse(value: unknown): value is DeviceRegisterResponse {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.device)) return false;
  const d = value.device;
  return (
    typeof d.id === 'string' &&
    typeof d.platform === 'string' &&
    typeof d.tz === 'string' &&
    typeof d.lastSeenAt === 'string'
  );
}

export function isDevicePrefsResponse(value: unknown): value is DevicePrefsResponse {
  if (!isRecord(value) || !isRecord(value.settings) || !Array.isArray(value.prefs)) return false;
  const s = value.settings;
  const settingsOk =
    typeof s.masterEnabled === 'boolean' &&
    (s.snoozeUntil === null || typeof s.snoozeUntil === 'string') &&
    typeof s.dailyCap === 'number' &&
    typeof s.quietStart === 'number' &&
    typeof s.quietEnd === 'number' &&
    typeof s.digestHour === 'number';
  if (!settingsOk) return false;
  return value.prefs.every(
    (p) =>
      isRecord(p) &&
      typeof p.category === 'string' &&
      isAnyNotificationCategory(p.category) &&
      typeof p.cadence === 'string' &&
      isNotificationCadence(p.cadence),
  );
}
