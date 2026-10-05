// WP2.3-E2 (H3): the expo-bound half of notification taps (App.tsx calls one hook).
// The process-wide gate is exported so the DOM host can `bindHost` it (returns the lease cleanup).
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SITE_URL } from '../components/SiteShell';
import { createTapGate, type RawResponse } from './notification-tap-gate';
import { startTapIngest } from './notification-tap-ingest';

export const notificationTapGate = createTapGate({ siteUrl: SITE_URL });

/**
 * Feeds cold-start and live notification taps into the gate (serialized, see
 * notification-tap-ingest.ts). `native` is true only while the legacy native router is the
 * visible surface; then taps open its screens via `navigate`. Otherwise (pending, Recovery) the
 * queue is detached: Recovery holds taps like pending (detached queue) for the DOM host.
 * Returning to the foreground retries held taps (an ack wait can time out while backgrounded).
 */
export function useNotificationTaps(navigate: (url: string) => void, native: boolean): void {
  useEffect(() => {
    notificationTapGate.setNativeNavigator(native ? navigate : null);
    return () => notificationTapGate.setNativeNavigator(null);
  }, [navigate, native]);

  useEffect(() => {
    const stop = startTapIngest(notificationTapGate, {
      getLast: async () => (await Notifications.getLastNotificationResponseAsync()) as RawResponse | null,
      clearLast: () => Notifications.clearLastNotificationResponseAsync(),
      listen: (cb) => {
        const sub = Notifications.addNotificationResponseReceivedListener((r) => cb(r as unknown as RawResponse));
        return () => sub.remove();
      },
    });
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') notificationTapGate.resume();
    });
    return () => {
      stop();
      app.remove();
    };
  }, []);
}
