// WP2.3-E2 (H3): the real `NotificationHost` deps for bridge-handlers-notifications,
// over injectable ports (the expo-backed ports live in notification-host-ports.ts).
// The bridge speaks booleans per category; the prefs API speaks cadences:
// false -> 'off'; true -> the category's spec default, or its first "on" cadence
// for categories whose default is off. Errors propagate: the handler maps every
// failure to a fixed message, so nothing (token, server text) crosses the bridge.
import {
  DEFAULT_CADENCE,
  FUN_CADENCES,
  cadenceVariantFor,
  isAnyNotificationCategory,
} from '@swift2/shared';
import type { DevicePrefsResponse, NotificationCadence, NotificationPref } from '@swift2/shared';
import type { PayloadOf } from '@swift2/ui';
import type { NotificationHandlerDeps } from './bridge-handlers-notifications';

export type Permission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export interface NotificationPorts {
  getPermission(): Promise<Permission>;
  /** Shows the OS prompt when undecided; resolves the resulting permission. */
  requestPermission(): Promise<Permission>;
  /** Registers/refreshes the device (push-registration); throws on failure. */
  registerDevice(): Promise<void>;
  savePrefs(prefs: NotificationPref[]): Promise<void>;
  /** Full prefs read; the device id is resolved natively and never returned. */
  fetchPrefs(signal?: AbortSignal): Promise<DevicePrefsResponse>;
  writePrefs(body: PayloadOf<'notifications.savePrefs'>, signal?: AbortSignal): Promise<DevicePrefsResponse>;
  /** Re-registers the device with a null push token (OS permission untouched). */
  clearPushToken(): Promise<void>;
  /** Persisted, token-free registration flag. */
  isRegistered(): Promise<boolean>;
}

export function cadenceFor(category: NotificationPref['category'], on: boolean): NotificationCadence {
  if (!on) return 'off';
  const def = DEFAULT_CADENCE[category];
  if (def !== 'off') return def;
  return cadenceVariantFor(category) === 'event' ? 'on' : (FUN_CADENCES.find((c) => c !== 'off') ?? 'daily');
}

export function createNotificationHostDeps(ports: NotificationPorts): NotificationHandlerDeps {
  return {
    status: () => ports.getPermission(),
    request: async () => {
      const current = await ports.getPermission();
      return current === 'undetermined' ? ports.requestPermission() : current;
    },
    register: () => ports.registerDevice(),
    getPrefs: (signal) => ports.fetchPrefs(signal),
    savePrefs: (body, signal) => ports.writePrefs(body, signal),
    registered: () => ports.isRegistered(),
    unregister: () => ports.clearPushToken(),
    updatePrefs: async (prefs) => {
      const list: NotificationPref[] = [];
      for (const [category, on] of Object.entries(prefs)) {
        if (!isAnyNotificationCategory(category)) throw new Error('unknown category');
        list.push({ category, cadence: cadenceFor(category, on) });
      }
      if (list.length > 0) await ports.savePrefs(list);
    },
  };
}
