// Notifications — portable domain types & constants (NOTIFICATIONS_SPEC.md).
// Phase 0 only needs the category catalogue (for Android notification
// channels, spec §4) and the device-registration shape (spec §9's `devices`
// insert surface). Preference/cadence/governor types land in later phases.

/** spec §4 — the ten "steady" categories (T1/T2/T3), 1:1 with an Android
 * notification channel each. Fun categories (spec §4 "Fun categories" table)
 * are intentionally excluded: they're opt-in only and their channel/cadence
 * work is Phase 4 scope, not Phase 0. */
export const NOTIFICATION_CATEGORIES = [
  'song_drop',
  'album_news',
  'tour_news',
  'official_youtube',
  'official_merch',
  'relationship_news',
  'public_appearance',
  'award_news',
  'fan_merch',
  'easter_egg',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export function isNotificationCategory(value: string): value is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/** spec §4's tier column — drives governor behavior in later phases; Phase 0
 * only needs it to group Android channels sensibly (importance mapping). */
export type NotificationTier = 'T1' | 'T2' | 'T3';

export interface NotificationCategoryDef {
  id: NotificationCategory;
  name: string;
  tier: NotificationTier;
}

/** Verbatim from spec §4's table — name + tier, in table order. */
export const NOTIFICATION_CATEGORY_DEFS: readonly NotificationCategoryDef[] = [
  { id: 'song_drop', name: 'New song drop', tier: 'T1' },
  { id: 'album_news', name: 'Album & re-recording announcements', tier: 'T1' },
  { id: 'tour_news', name: 'Tour dates & ticket sales', tier: 'T1' },
  { id: 'official_youtube', name: 'Official Taylor YouTube drop', tier: 'T2' },
  { id: 'official_merch', name: 'Official merch drop', tier: 'T2' },
  { id: 'relationship_news', name: 'Relationship news', tier: 'T2' },
  { id: 'public_appearance', name: 'Public appearances & interviews', tier: 'T2' },
  { id: 'award_news', name: 'Awards & nominations', tier: 'T3' },
  { id: 'fan_merch', name: 'New fan merch', tier: 'T3' },
  { id: 'easter_egg', name: 'Easter egg theories', tier: 'T3' },
];

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
}
