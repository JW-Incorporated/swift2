// Notifications Phase 0 (NOTIFICATIONS_SPEC.md §3/§4) — Android notification
// channels, 1:1 with the spec's category catalogue. iOS has no per-channel OS
// toggle (spec §3), so this is Android-only; iOS relies entirely on the
// in-app settings screen (Phase 1).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NOTIFICATION_CATEGORY_DEFS, type NotificationTier } from '@swift2/shared';

/** Android `importance` per spec §4 tier: T1 (rare + huge) gets the loudest
 * heads-up treatment; T2/T3 stay on-screen without interrupting. FUN
 * categories aren't in `NOTIFICATION_CATEGORY_DEFS` (Phase 4 scope) and so
 * get no channel here — matches the plan's Phase 0 boundary exactly. */
function importanceForTier(tier: NotificationTier): Notifications.AndroidImportance {
  switch (tier) {
    case 'T1':
      return Notifications.AndroidImportance.MAX;
    case 'T2':
      return Notifications.AndroidImportance.HIGH;
    case 'T3':
      return Notifications.AndroidImportance.DEFAULT;
  }
}

/**
 * Registers one Android notification channel per spec §4 category — mirrors
 * the in-app settings screen 1:1 so the OS-level channel list (Settings →
 * Apps → LongLive → Notifications) means the same thing the app's own
 * category rows will mean once Phase 1 ships them. No-ops on iOS (channels
 * are an Android-only concept) and safe to call on every app start —
 * `setNotificationChannelAsync` upserts by channel id.
 */
export async function registerNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    NOTIFICATION_CATEGORY_DEFS.map((def) =>
      Notifications.setNotificationChannelAsync(def.id, {
        name: def.name,
        importance: importanceForTier(def.tier),
        // Matches spec §4's cadence intent at the OS level: T1 vibrates, T2/T3
        // stay quieter. Per-channel sound left at Android's default tone;
        // custom sounds are a later polish, not Phase 0 scope.
        vibrationPattern: def.tier === 'T1' ? [0, 250, 250, 250] : undefined,
      }),
    ),
  );
}
