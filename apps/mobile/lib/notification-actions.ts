// Notifications Phase 2 (NOTIFICATIONS_SPEC.md §8, NOTIFICATIONS_PLAN.md
// Phase 2) — "Mute this type" + "Settings" notification actions. Spec §8:
// "every notification carries an action (long-press on iOS / expanded on
// Android): 'Mute this type' (one tap → sets category Off, shows undo
// toast) and 'Settings'." Expo Notifications' category/actions API is the
// standard mechanism for this on both platforms.
import * as Notifications from 'expo-notifications';
import {
  ALL_NOTIFICATION_CATEGORIES,
  type AnyNotificationCategory,
  type NotificationCadence,
} from '@swift2/shared';
import { fetchDevicePrefs, setCategoryCadence } from './prefs-client';

const MUTE_ACTION_ID = 'mute-this-type';
const SETTINGS_ACTION_ID = 'open-settings';

/** One Expo notification "category" (their term for a named action-set,
 * distinct from our `NotificationCategory` domain concept) per app
 * category — Expo scopes actions per category id, and the app category id
 * doubles perfectly as that scoping key. Idempotent (upsert semantics),
 * safe to call on every app start alongside registerNotificationChannels()
 * (notification-channels.ts's sibling for Android channels). */
export async function registerNotificationActions(): Promise<void> {
  await Promise.all(
    ALL_NOTIFICATION_CATEGORIES.map((category) =>
      Notifications.setNotificationCategoryAsync(category, [
        {
          identifier: MUTE_ACTION_ID,
          buttonTitle: 'Mute this type',
          options: { opensAppToForeground: false },
        },
        {
          identifier: SETTINGS_ACTION_ID,
          buttonTitle: 'Settings',
          options: { opensAppToForeground: true },
        },
      ]),
    ),
  );
}

export interface MuteResult {
  category: AnyNotificationCategory;
  /** The cadence the category had BEFORE this mute — undo restores exactly
   * this value, never a hardcoded default (a device that had 'daily' before
   * muting must return to 'daily', not spec §4's 'instant' default). */
  previousCadence: NotificationCadence;
}

/** "Mute this type": one tap sets the category to Off. Returns the prior
 * cadence so the caller can render an undo toast (spec §8: "shows undo
 * toast") — see `undoMute()` below. */
export async function muteCategory(category: AnyNotificationCategory): Promise<MuteResult> {
  const current = await fetchDevicePrefs();
  const previousCadence = current.prefs.find((p) => p.category === category)?.cadence ?? 'off';
  await setCategoryCadence({ category, cadence: 'off' });
  return { category, previousCadence };
}

/** Undo: restores the category to whatever it was before `muteCategory()`
 * ran. A no-op restore (previousCadence was already 'off') is harmless —
 * still just one instant-apply write, same as any other pill tap. */
export async function undoMute(result: MuteResult): Promise<void> {
  await setCategoryCadence({ category: result.category, cadence: result.previousCadence });
}

/** Routes a tapped notification-action identifier to the right handler.
 * `null` return means "not one of our actions" (a plain tap on the
 * notification body, which the caller handles via deep-links.ts instead). */
export type NotificationActionOutcome =
  | { kind: 'muted'; result: MuteResult }
  | { kind: 'open-settings'; category: AnyNotificationCategory }
  | null;

export async function handleNotificationAction(
  actionIdentifier: string,
  category: AnyNotificationCategory,
): Promise<NotificationActionOutcome> {
  if (actionIdentifier === MUTE_ACTION_ID) {
    const result = await muteCategory(category);
    return { kind: 'muted', result };
  }
  if (actionIdentifier === SETTINGS_ACTION_ID) {
    return { kind: 'open-settings', category };
  }
  return null;
}
