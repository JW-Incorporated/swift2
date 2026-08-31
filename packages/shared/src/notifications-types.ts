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

// ---------------------------------------------------------------------------
// Phase 1 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§5/§8) —
// preferences & settings. Portable domain types only; the prefs API and
// settings screens (web + mobile) import from here so the cadence set, the
// category→group mapping, and the preview copy live in exactly one place.
// ---------------------------------------------------------------------------

/** spec §4's "Fun categories" table — opt-in only, Phase 4 scope to actually
 * *send*, but the pill component and settings rows are built now (Phase 1
 * scope per NOTIFICATIONS_PROMPTS.md: "fun categories are Phase 4, just make
 * the pill component support both variants now"). */
export const FUN_NOTIFICATION_CATEGORIES = [
  'lyric_of_day',
  'on_this_day',
  'swiftie_trivia',
] as const;

export type FunNotificationCategory = (typeof FUN_NOTIFICATION_CATEGORIES)[number];

export function isFunNotificationCategory(value: string): value is FunNotificationCategory {
  return (FUN_NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/** Every settings-row category, steady + fun, in one set — used to validate
 * a prefs PUT body regardless of which pill variant a row uses. */
export const ALL_NOTIFICATION_CATEGORIES = [
  ...NOTIFICATION_CATEGORIES,
  ...FUN_NOTIFICATION_CATEGORIES,
] as const;

export type AnyNotificationCategory = NotificationCategory | FunNotificationCategory;

export function isAnyNotificationCategory(value: string): value is AnyNotificationCategory {
  return (ALL_NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/** spec §5 — the two cadence-pill variants. Steady categories:
 * Instant · Daily · Weekly · Off. Fun categories swap Instant for Monthly:
 * Daily · Weekly · Monthly · Off. One pill *component*, two value sets —
 * built here so Phase 1 ships both variants even though only the steady one
 * sends anything until later phases wire the governor/fun cron. */
export const STEADY_CADENCES = ['instant', 'daily', 'weekly', 'off'] as const;
export type SteadyCadence = (typeof STEADY_CADENCES)[number];

export const FUN_CADENCES = ['daily', 'weekly', 'monthly', 'off'] as const;
export type FunCadence = (typeof FUN_CADENCES)[number];

/** Union of every cadence value the `notification_prefs.cadence` CHECK
 * constraint accepts (spec §9's table, migration
 * 20260910000000_notification_prefs.sql). */
export const NOTIFICATION_CADENCES = [
  'instant',
  'daily',
  'weekly',
  'monthly',
  'on',
  'off',
] as const;
export type NotificationCadence = (typeof NOTIFICATION_CADENCES)[number];

export function isNotificationCadence(value: string): value is NotificationCadence {
  return (NOTIFICATION_CADENCES as readonly string[]).includes(value);
}

/** Which pill variant a category uses — steady categories never accept
 * `monthly`; fun categories never accept `instant`. Used by both the prefs
 * API (validation) and the settings screen (which pill row to render). */
export function cadenceVariantFor(category: AnyNotificationCategory): 'steady' | 'fun' {
  return isFunNotificationCategory(category) ? 'fun' : 'steady';
}

export function isValidCadenceForCategory(
  category: AnyNotificationCategory,
  cadence: string,
): cadence is NotificationCadence {
  if (!isNotificationCadence(cadence)) return false;
  const variant = cadenceVariantFor(category);
  if (variant === 'steady') {
    return (STEADY_CADENCES as readonly string[]).includes(cadence);
  }
  return (FUN_CADENCES as readonly string[]).includes(cadence);
}

/** spec §8's settings-screen grouping: "category list (grouped: News /
 * Merch / Community / Fun)". */
export const NOTIFICATION_GROUPS = ['News', 'Merch', 'Community', 'Fun'] as const;
export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number];

/** spec §4's default cadence per category — applied only after explicit
 * opt-in (onboarding preset, Phase 2 scope); the settings screen shows these
 * as the value a fresh prefs row would carry, but nothing sends before a
 * device has actually opted in. */
export const DEFAULT_CADENCE: Record<AnyNotificationCategory, NotificationCadence> = {
  song_drop: 'instant',
  album_news: 'instant',
  tour_news: 'instant',
  official_youtube: 'daily',
  official_merch: 'daily',
  relationship_news: 'daily',
  public_appearance: 'daily',
  award_news: 'weekly',
  fan_merch: 'weekly',
  easter_egg: 'weekly',
  lyric_of_day: 'off',
  on_this_day: 'off',
  swiftie_trivia: 'off',
};

export interface SettingsCategoryDef {
  id: AnyNotificationCategory;
  name: string;
  group: NotificationGroup;
  /** One-line description shown under the row name (spec §8). */
  description: string;
  /** Verbatim example push text from spec §4's table — shown as the row's
   * preview text, per NOTIFICATIONS_PROMPTS.md Phase 1 scope ("use the
   * preview text examples from spec §4 table verbatim"). */
  previewText: string;
}

/** Every settings-screen row, in spec §4 table order, grouped per spec §8.
 * `official_youtube`/`official_merch` → Merch group name notwithstanding —
 * §8 groups by mental category, not literal category id:
 * `official_merch`/`fan_merch` → Merch, `relationship_news`/
 * `public_appearance`/`easter_egg` → Community (fan-facing, social), the
 * rest of the T1/T2 releases-and-news set → News, `award_news` → News
 * (industry news, not a merch/community fit). Fun categories → Fun. */
export const SETTINGS_CATEGORY_DEFS: readonly SettingsCategoryDef[] = [
  {
    id: 'song_drop',
    name: 'New song drop',
    group: 'News',
    description: 'The moment a new song is officially out.',
    previewText: '🚨 NEW SONG. \u2018Imgonnagetyouback (Live)\u2019 is out NOW →',
  },
  {
    id: 'album_news',
    name: 'Album & re-recording announcements',
    group: 'News',
    description: 'New albums and re-recordings, the moment they\u2019re announced.',
    previewText: 'SHE ANNOUNCED IT. New album Oct 13 →',
  },
  {
    id: 'tour_news',
    name: 'Tour dates & ticket sales',
    group: 'News',
    description: 'New tour dates and ticket on-sales.',
    previewText: 'Tour dates just dropped — 3 shows near you? →',
  },
  {
    id: 'official_youtube',
    name: 'Official Taylor YouTube drop',
    group: 'News',
    description: 'New videos on Taylor\u2019s official channel.',
    previewText: 'New on Taylor\u2019s channel: BTS of the video shoot →',
  },
  {
    id: 'award_news',
    name: 'Awards & nominations',
    group: 'News',
    description: 'Award nominations and wins.',
    previewText: '6 Grammy nominations this morning →',
  },
  {
    id: 'official_merch',
    name: 'Official merch drop',
    group: 'Merch',
    description: 'New drops and restocks in the official store.',
    previewText: 'New in the official store: 1989 crewneck restock →',
  },
  {
    id: 'fan_merch',
    name: 'New fan merch',
    group: 'Merch',
    description: 'New fan-made merch worth a look.',
    previewText: '12 new fan-made pieces this week, top pick inside →',
  },
  {
    id: 'relationship_news',
    name: 'Relationship news',
    group: 'Community',
    description: 'Updates on Taylor\u2019s relationship.',
    previewText: 'Update: Taylor & Travis spotted at… →',
  },
  {
    id: 'public_appearance',
    name: 'Public appearances & interviews',
    group: 'Community',
    description: 'Public appearances, interviews, and TV moments.',
    previewText: 'Taylor confirmed for tonight\u2019s game →',
  },
  {
    id: 'easter_egg',
    name: 'Easter egg theories',
    group: 'Community',
    description: 'The best fan theories, curated weekly.',
    previewText: 'The Weekly Clown Report \ud83e\udd21 — top theories, Clownbot-curated',
  },
  {
    id: 'lyric_of_day',
    name: 'Song lyric of the day',
    group: 'Fun',
    description: 'A curated lyric, deep-linked to the song. No repeats within 12 months.',
    previewText: 'Today\u2019s lyric: \u201cAnd I don\u2019t want you like a best friend\u201d →',
  },
  {
    id: 'on_this_day',
    name: 'On this day',
    group: 'Fun',
    description: 'A moment from Taylor\u2019s history, on this date.',
    previewText: 'On this day in 2014, 1989 was released \ud83d\udd70️',
  },
  {
    id: 'swiftie_trivia',
    name: 'Swiftie trivia',
    group: 'Fun',
    description: 'A question in the push, tap to reveal the answer in-app.',
    previewText: 'Trivia: which era hit #1 in 21 countries? Tap to answer →',
  },
];

/** Device-level settings columns that already exist on `devices` (Phase 0
 * migration) — Phase 1's prefs API reads/writes these too (spec §8: master
 * switch, snooze, daily limit, quiet hours, digest time), so the batch
 * GET/PUT surface covers both `devices` columns and `notification_prefs`
 * rows in one call. */
export interface DeviceNotificationSettings {
  masterEnabled: boolean;
  snoozeUntil: string | null;
  dailyCap: number;
  quietStart: number;
  quietEnd: number;
  digestHour: number;
}

/** One `notification_prefs` row, portable shape (camelCase) — mirrors the
 * migration's `device_id, category, cadence` columns minus `device_id`
 * (implied by the API route's `:id` param) and `updated_at` (server-owned). */
export interface NotificationPref {
  category: AnyNotificationCategory;
  cadence: NotificationCadence;
}

/** `GET /api/devices/:id/prefs` response shape — device settings + every
 * category's current cadence (a fresh device gets `DEFAULT_CADENCE`
 * defaults synthesized in, not persisted rows, until it changes one). */
export interface DevicePrefsResponse {
  settings: DeviceNotificationSettings;
  prefs: NotificationPref[];
}

/** `PUT /api/devices/:id/prefs` request body — every field optional so a
 * single pill tap sends only what changed (spec §8: "changes apply
 * instantly", no save button to batch a whole form). */
export interface DevicePrefsUpdateInput {
  settings?: Partial<DeviceNotificationSettings>;
  prefs?: NotificationPref[];
}

// ---------------------------------------------------------------------------
// Phase 2 (NOTIFICATIONS_SPEC.md §7, NOTIFICATIONS_PLAN.md Phase 2) —
// onboarding presets. Portable so the pre-permission screen (mobile) and
// any future web equivalent read from exactly one definition.
// ---------------------------------------------------------------------------

export const ONBOARDING_PRESET_IDS = ['big_stuff', 'daily_swiftie', 'full_clown'] as const;
export type OnboardingPresetId = (typeof ONBOARDING_PRESET_IDS)[number];

export interface OnboardingPreset {
  id: OnboardingPresetId;
  /** Verbatim from spec §7. */
  title: string;
  description: string;
  prefs: readonly NotificationPref[];
}

const T1_CATEGORIES: readonly NotificationCategory[] = ['song_drop', 'album_news', 'tour_news'];
const T2_CATEGORIES: readonly NotificationCategory[] = [
  'official_youtube',
  'official_merch',
  'relationship_news',
  'public_appearance',
];
const T3_CATEGORIES: readonly NotificationCategory[] = ['award_news', 'fan_merch', 'easter_egg'];

function prefsFor(
  cadenceByCategory: Partial<Record<AnyNotificationCategory, NotificationCadence>>,
): NotificationPref[] {
  return ALL_NOTIFICATION_CATEGORIES.map((category) => ({
    category,
    cadence: cadenceByCategory[category] ?? 'off',
  }));
}

/** spec §7's three presets, verbatim titles:
 * "Just the big stuff" — T1 instant, everything else off
 * "Daily Swiftie" — T1 instant, T2 daily digest, weekly Clown Report
 * "Full Clown 🤡" — everything on at defaults + lyric of the day
 * plus "Customize" → full settings screen (handled by the caller, not a
 * preset row — see the onboarding screen component). */
export const ONBOARDING_PRESETS: readonly OnboardingPreset[] = [
  {
    id: 'big_stuff',
    title: 'Just the big stuff',
    description: 'New songs, albums, and tour news the instant they happen. Nothing else.',
    prefs: prefsFor(
      Object.fromEntries(T1_CATEGORIES.map((c) => [c, 'instant'])) as Record<
        AnyNotificationCategory,
        NotificationCadence
      >,
    ),
  },
  {
    id: 'daily_swiftie',
    title: 'Daily Swiftie',
    description:
      'T1 news instantly, everything else (merch, appearances, awards) once a day, plus the weekly Clown Report.',
    prefs: prefsFor({
      ...Object.fromEntries(T1_CATEGORIES.map((c) => [c, 'instant'])),
      ...Object.fromEntries(T2_CATEGORIES.map((c) => [c, 'daily'])),
      award_news: 'weekly',
      fan_merch: 'weekly',
      easter_egg: 'weekly',
    } as Record<AnyNotificationCategory, NotificationCadence>),
  },
  {
    id: 'full_clown',
    title: 'Full Clown \ud83e\udd21',
    description: 'Everything on at its default cadence, plus a lyric of the day.',
    prefs: prefsFor({
      ...Object.fromEntries(T1_CATEGORIES.map((c) => [c, DEFAULT_CADENCE[c]])),
      ...Object.fromEntries(T2_CATEGORIES.map((c) => [c, DEFAULT_CADENCE[c]])),
      ...Object.fromEntries(T3_CATEGORIES.map((c) => [c, DEFAULT_CADENCE[c]])),
      lyric_of_day: 'daily',
    } as Record<AnyNotificationCategory, NotificationCadence>),
  },
];

export function onboardingPresetById(id: OnboardingPresetId): OnboardingPreset {
  const preset = ONBOARDING_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`unknown onboarding preset: ${id}`);
  return preset;
}
