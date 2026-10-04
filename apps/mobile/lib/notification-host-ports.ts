// WP2.3-E2 (H3): expo-backed ports for notification-host-deps.ts. Not imported by
// tests (they inject fake ports). SharedUiHost spreads createExpoNotificationHandlers() over the unwired map.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { fetchDevicePrefs, saveDevicePrefs } from './prefs-client';
import { registerDevice, requestPushRegistration } from './push-registration';
import { createHandlers } from './bridge-handlers-notifications';
import { createNotificationHostDeps, type NotificationPorts, type Permission } from './notification-host-deps';

// Token-free registration flag. Stored as the INVERSE ("explicitly unregistered") so devices that registered before
// this flag existed still read as registered until the user turns notifications off in-app.
const UNREGISTERED_KEY = 'longlive_push_unregistered';

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
    await SecureStore.deleteItemAsync(UNREGISTERED_KEY);
  },
  savePrefs: async (prefs) => void (await saveDevicePrefs({ prefs })),
  fetchPrefs: (signal) => fetchDevicePrefs(signal),
  writePrefs: (body, signal) => saveDevicePrefs(body, signal),
  clearPushToken: async () => {
    await registerDevice();
    await SecureStore.setItemAsync(UNREGISTERED_KEY, '1');
  },
  isRegistered: async () => (await SecureStore.getItemAsync(UNREGISTERED_KEY)) !== '1',
};

export const createExpoNotificationDeps = () => createNotificationHostDeps(expoNotificationPorts);
export const createExpoNotificationHandlers = () => createHandlers(createExpoNotificationDeps());
