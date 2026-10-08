// `POST /api/devices/register` request contract (extracted from notifications-types.ts).

/** spec §9's `devices.platform` check constraint. */
export const DEVICE_PLATFORMS = ['ios', 'android', 'web'] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export function isDevicePlatform(value: string): value is DevicePlatform {
  return (DEVICE_PLATFORMS as readonly string[]).includes(value);
}

/** The exact fields `POST /api/devices/register` accepts (Phase 0 scope:
 * spec §2 "registers (device_id, platform, push_token, timezone, locale)").
 * `pushToken` is optional — a device may register before permission is
 * granted (spec §7's pre-permission flow) and refresh the token later via
 * the same upsert-by-id call (Phase 0 acceptance: "token refresh
 * re-upserts correctly"). */
export interface DeviceRegistrationInput {
  deviceId: string;
  platform: DevicePlatform;
  pushToken?: string | null;
  tz?: string | null;
  locale?: string | null;
  appVersion?: string | null;
  /** Monotonic per-install write sequence; the server ignores a write lower than the last applied one. Optional for old builds. */
  seq?: number;
}
