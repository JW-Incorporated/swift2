// WP2.3-E2 (H3): the expo-bound half of notification taps (App.tsx calls one hook).
// The process-wide gate is exported so the DOM host can `bindHost` it (returns the lease cleanup).
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SITE_URL } from '../components/SiteShell';
import { createTapGate, type RawResponse } from './notification-tap-gate';
import { startTapIngest } from './notification-tap-ingest';
import { heldTaps } from './recovery-pending-taps';

export const notificationTapGate = createTapGate({ siteUrl: SITE_URL });

/**
 * Feeds cold-start and live notification taps into the gate (serialized, see
 * notification-tap-ingest.ts). `native` is true only while the legacy native router is the
 * visible surface; then taps open its screens via `navigate`. Taps are always noted in
 * `heldTaps` (so Retry on the Recovery screen can persist them across the reload) and are never
 * consumed by a native router there; `dom` clears the notes once the gate has drained.
 * Returning to the foreground retries held taps (an ack wait can time out while backgrounded).
 */
export function useNotificationTaps(navigate: (url: string) => void, native: boolean, dom = false): void {
  useEffect(() => {
    notificationTapGate.setNativeNavigator(native ? navigate : null);
    return () => notificationTapGate.setNativeNavigator(null);
  }, [navigate, native]);

  useEffect(() => {
    if (!dom) return;
    const h = setInterval(() => {
      if (notificationTapGate.size() === 0) heldTaps.clear();
    }, 1000);
    return () => clearInterval(h);
  }, [dom]);

  useEffect(() => {
    let stopped = false;
    void heldTaps.restore().then((taps) => {
      if (!stopped) taps.forEach((t) => notificationTapGate.enqueue(t));
    });
    const stop = startTapIngest(
      {
        enqueue: (raw) => {
          heldTaps.note(raw);
          return notificationTapGate.enqueue(raw);
        },
      },
      {
        getLast: async () => (await Notifications.getLastNotificationResponseAsync()) as RawResponse | null,
        clearLast: () => Notifications.clearLastNotificationResponseAsync(),
        listen: (cb) => {
          const sub = Notifications.addNotificationResponseReceivedListener((r) => cb(r as unknown as RawResponse));
          return () => sub.remove();
        },
      },
    );
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') notificationTapGate.resume();
    });
    return () => {
      stopped = true;
      stop();
      app.remove();
    };
  }, []);
}
