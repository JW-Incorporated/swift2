// WP2.3-E2 (H3): the expo-bound half of notification taps (App.tsx calls one hook).
// The process-wide gate is exported so the DOM host can `bindHost`/`unbindHost` it.
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { SITE_URL } from '../components/SiteShell';
import { createTapGate, tapFromResponse, type RawResponse } from './notification-tap-gate';

export const notificationTapGate = createTapGate({ siteUrl: SITE_URL });

/**
 * Feeds cold-start and live notification taps into the gate. `native` is true
 * whenever the DOM host is not mounted; then taps open the native screens via
 * `navigate`. Each response is cleared after it is enqueued so a remount or a
 * second cold read cannot replay it.
 */
export function useNotificationTaps(navigate: (url: string) => void, native: boolean): void {
  useEffect(() => {
    notificationTapGate.setNativeNavigator(native ? navigate : null);
    return () => notificationTapGate.setNativeNavigator(null);
  }, [navigate, native]);

  useEffect(() => {
    const read = (resp: Notifications.NotificationResponse | null) => {
      const tap = tapFromResponse(resp as RawResponse | null);
      if (!tap) return;
      notificationTapGate.enqueue(tap);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    Notifications.getLastNotificationResponseAsync()
      .then(read)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(read);
    return () => sub.remove();
  }, []);
}
