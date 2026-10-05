import type { HostNotifications, HostWebPush, NotificationPrefsUpdate } from '../../../host/types';

export type DriverPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export type DriverSubscribeResult =
  | { status: 'subscribed' }
  | { status: 'permission_denied' }
  | { status: 'unsupported' }
  | { status: 'vapid_not_configured' }
  | { status: 'error'; error: string };

/** What the settings page needs from a host. No device id or push token ever passes through it. */
export type SettingsDriver = {
  /** Which host backs this driver: the app's native notifications or the browser's web push. */
  kind: 'native' | 'web';
  permission(): Promise<DriverPermission>;
  subscribe(): Promise<DriverSubscribeResult>;
  unsubscribe(): Promise<{ ok: true } | { ok: false; error: string }>;
  loadPrefs(): Promise<unknown>;
  savePrefs(body: { settings?: object; prefs?: object[] }): Promise<unknown>;
  /** Shown instead of the web "blocked in your browser" copy; the web driver omits it. */
  deniedHint?: string;
  /** Re-read the permission when the page returns to the foreground (the app: the user may have changed it in phone Settings). */
  refreshOnForeground?: boolean;
};

/** Browser path: reads Notification.permission exactly as the page always did; the device id stays in this closure. */
export function fromWebPush(webPush: HostWebPush, vapidPublicKey: string | null): SettingsDriver {
  let deviceId: string | null = null;
  const id = () => (deviceId ??= webPush.getDeviceId());
  return {
    kind: 'web',
    permission: async () => {
      if (!webPush.isSupported()) return 'unsupported';
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return 'granted';
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return 'denied';
      return 'default';
    },
    subscribe: async () => {
      const result = await webPush.subscribe(vapidPublicKey);
      if (result.status === 'subscribed') deviceId = result.deviceId;
      return result.status === 'subscribed' || result.status === 'permission_denied'
        ? { status: result.status }
        : result;
    },
    unsubscribe: () => webPush.unsubscribe(),
    loadPrefs: () => webPush.loadPrefs(id()),
    savePrefs: (body) => webPush.savePrefs(id(), body),
  };
}

export const APP_DENIED_HINT =
  'Notifications are turned off for Long Live. Open your phone Settings, then Notifications, to allow them.';

/** App path: everything goes through host.notifications (the native side owns the device id and token). */
export function fromNotifications(n: HostNotifications): SettingsDriver {
  return {
    kind: 'native',
    permission: async () => {
      try {
        const s = await n.status();
        if (s === 'undetermined') return 'default';
        // OS permission is not registration: after an in-app turn-off it stays granted while the push token is cleared.
        if (s === 'granted' && !(await n.registered().catch(() => true))) return 'default';
        return s;
      } catch {
        return 'default';
      }
    },
    subscribe: async () => {
      try {
        const s = await n.request();
        if (s === 'denied') return { status: 'permission_denied' };
        if (s === 'unsupported') return { status: 'unsupported' };
        if (s !== 'granted') return { status: 'error', error: 'Notifications were not enabled.' };
        await n.register();
        return { status: 'subscribed' };
      } catch {
        return { status: 'error', error: 'Could not enable notifications. Try again.' };
      }
    },
    unsubscribe: async () => {
      try {
        await n.unregister();
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not turn off notifications.' };
      }
    },
    loadPrefs: async () => {
      try {
        return await n.loadPrefs();
      } catch {
        throw new Error('Could not load your settings.');
      }
    },
    savePrefs: async (body) => {
      try {
        return await n.savePrefs(body as NotificationPrefsUpdate);
      } catch {
        throw new Error('Could not save your settings.');
      }
    },
    deniedHint: APP_DENIED_HINT,
    refreshOnForeground: true,
  };
}

/** webPush ?? notifications ?? unsupported (null). */
export function selectDriver(
  host: { webPush?: HostWebPush; notifications?: HostNotifications },
  vapidPublicKey: string | null,
): SettingsDriver | null {
  if (host.webPush) return fromWebPush(host.webPush, vapidPublicKey);
  if (host.notifications) return fromNotifications(host.notifications);
  return null;
}
