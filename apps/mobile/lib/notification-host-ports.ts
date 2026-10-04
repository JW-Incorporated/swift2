// WP2.3-E2 (H3): expo-backed ports for notification-host-deps.ts. Not imported by
// tests (they inject fake ports). SharedUiHost spreads createExpoNotificationHandlers() over the unwired map.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { saveDevicePrefs } from './prefs-client';
import { requestPushRegistration } from './push-registration';
import { createHandlers } from './bridge-handlers-notifications';
import { createNotificationHostDeps, type NotificationPorts, type Permission } from './notification-host-deps';

const permission = async (): Promise<Permission> => {
  if (!Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
};

export const expoNotificationPorts: NotificationPorts = {
  getPermission: permission,
  requestPermission: async () => {
    if (!Device.isDevice) return 'unsupported';
    await Notifications.requestPermissionsAsync();
    return permission();
  },
  registerDevice: async () => {
    const r = await requestPushRegistration();
    if (r.status === 'error') throw new Error('registration failed');
  },
  savePrefs: async (prefs) => void (await saveDevicePrefs({ prefs })),
};

export const createExpoNotificationDeps = () => createNotificationHostDeps(expoNotificationPorts);
export const createExpoNotificationHandlers = () => createHandlers(createExpoNotificationDeps());
