// LongLive — native root.
//
// Decision 2026-09-05 (docs/decisions.md): the app shows the shipped website
// (www.longlivets.com) inside a WebView — see components/SiteShell.tsx — and
// keeps the natively-built notification surface around it. The native Vault
// navigator (components/VaultNavigator.tsx, fed by lib/vault.ts) is no longer
// mounted; it remains in the tree as the long-term native port target.
//
// SAFE AREA (2026-08-30). `SafeAreaView` from `react-native` is iOS-only — on
// Android it insets nothing, so chrome rendered under the status bar and
// swallowed taps. `react-native-safe-area-context` reads real window insets
// on both platforms; `initialWindowMetrics` seeds it synchronously so the
// first frame is already inset.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { destinationFor as destinationForUrl, type ShellDestination } from '@swift2/shared';
import { registerDevice } from './lib/push-registration';
import { registerNotificationActions } from './lib/notification-actions';
import { hasOnboardingBeenOffered, markOnboardingOffered } from './lib/onboarding-state';
import { SITE_URL, SiteShell } from './components/SiteShell';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { NotificationInboxScreen } from './components/NotificationInboxScreen';
import { OnboardingScreen } from './components/OnboardingScreen';

/**
 * Where a notification (tap or inbox row) should take the user. The backend
 * emits full www.longlivets.com URLs as deep links (packages/core
 * notification-*.ts), so the site does the routing; the two special cases
 * are the native screens. Anything else lands on the site's front door.
 *
 * The routing logic itself lives in @swift2/shared (OS-003) so the root
 * vitest suite's deep-link contract test covers it directly; this wrapper
 * just binds it to this app's configured SITE_URL.
 */
export function destinationFor(rawUrl: string | null | undefined): ShellDestination {
  return destinationForUrl(rawUrl, SITE_URL);
}

export default function App() {
  // The page the shell shows. Deep links replace it; the WebView keeps its
  // own back history for in-site navigation.
  const [webUrl, setWebUrl] = useState(SITE_URL);
  // Notifications Phase 1 (spec §8): the bell is reachable from every screen
  // → Notification Settings. App.tsx renders one screen at a time, so the
  // native screens are full-bleed overlays toggled by local state.
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  // Phase 2 (spec §7): the pre-permission onboarding screen, shown at most
  // once per install, at the value moment of the first bell tap.
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const go = useCallback((dest: ShellDestination) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    if (dest.kind === 'settings') setNotificationSettingsOpen(true);
    else if (dest.kind === 'inbox') setInboxOpen(true);
    else setWebUrl(dest.url);
  }, []);

  useEffect(() => {
    // Phase 0: register (or refresh) this device's row on every cold start —
    // WITHOUT asking for notification permission here (spec §7). Failures are
    // non-fatal: logged, never surfaced as a blocking error.
    registerDevice().catch((e) => {
      console.warn('device registration failed', e instanceof Error ? e.message : e);
    });
    registerNotificationActions().catch((e) => {
      console.warn('notification action registration failed', e instanceof Error ? e.message : e);
    });
  }, []);

  useEffect(() => {
    // A tapped notification carries the same deep link the inbox shows; the
    // payload key mirrors packages/core notification-events.ts (`deepLink`).
    const read = (resp: Notifications.NotificationResponse | null) => {
      if (!resp) return;
      const data = resp.notification.request.content.data as Record<string, unknown> | undefined;
      const link = data && typeof data.deepLink === 'string' ? data.deepLink : null;
      go(destinationFor(link));
    };
    Notifications.getLastNotificationResponseAsync()
      .then(read)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(read);
    return () => sub.remove();
  }, [go]);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.fill}>
          <StatusBar style="light" />
          {notificationSettingsOpen ? (
            <NotificationSettingsScreen
              onClose={() => setNotificationSettingsOpen(false)}
              onOpenInbox={() => setInboxOpen(true)}
            />
          ) : inboxOpen ? (
            <NotificationInboxScreen
              onClose={() => setInboxOpen(false)}
              onOpenItem={(event) => go(destinationFor(event.deepLink))}
            />
          ) : onboardingOpen ? (
            <OnboardingScreen
              onDone={(outcome) => {
                setOnboardingOpen(false);
                markOnboardingOffered().catch(() => {
                  /* best-effort — a re-offer on the next bell tap is harmless */
                });
                if (outcome.kind === 'customize') setNotificationSettingsOpen(true);
              }}
            />
          ) : (
            <>
              <SiteShell url={webUrl} />
              <Pressable
                onPress={() => {
                  hasOnboardingBeenOffered()
                    .then((offered) => {
                      if (offered) setNotificationSettingsOpen(true);
                      else setOnboardingOpen(true);
                    })
                    .catch(() => setNotificationSettingsOpen(true));
                }}
                accessibilityLabel="Notification settings"
                accessibilityRole="button"
                style={styles.bellButton}
                hitSlop={10}
              >
                <Text style={styles.bellIcon}>🔔</Text>
              </Pressable>
            </>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  // Bottom-right, above the site's bottom nav, so it never covers the
  // site's own top bar / wordmark.
  bellButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,15,0.85)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 84,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    width: 44,
  },
  bellIcon: { fontSize: 20 },
});
