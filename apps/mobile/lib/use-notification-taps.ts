// WP2.3-E2 (H3): the expo-bound half of notification taps (App.tsx calls one hook).
// The process-wide gate is exported so the DOM host can `bindHost` it (returns the lease cleanup).
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SITE_URL } from './site-url';
import { createTapGate, type RawResponse } from './notification-tap-gate';
import { startTapIngest } from './notification-tap-ingest';
import { recoveryTapDiscard } from './recovery-taps';

export const notificationTapGate = createTapGate({ siteUrl: SITE_URL });

/**
 * Feeds cold-start and live notification taps into the gate (serialized, see
 * notification-tap-ingest.ts). `recovery` is true while the Recovery screen is mounted: taps and deep
 * links are consumed and dropped (diag mark), never queued or navigated. Otherwise (pending) they stay
 * held for the DOM host. Returning to the foreground retries held taps (an ack wait can time out
 * while backgrounded).
 */
export function useNotificationTaps(recovery = false): void {
  useEffect(() => {
    notificationTapGate.setNativeNavigator(recovery ? recoveryTapDiscard() : null);
    return () => notificationTapGate.setNativeNavigator(null);
  }, [recovery]);

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
