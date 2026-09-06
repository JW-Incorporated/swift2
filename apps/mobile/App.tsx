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
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { createNavigate, resolve as resolveRoute, type ScreenId } from './lib/routes';
import { registerDevice } from './lib/push-registration';
import { registerNotificationActions } from './lib/notification-actions';
import { hasOnboardingBeenOffered, markOnboardingOffered } from './lib/onboarding-state';
import { SITE_URL, SiteShell, type NativeBridgeMessage } from './components/SiteShell';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { NotificationInboxScreen } from './components/NotificationInboxScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { EraStreamScreen } from './components/EraStreamScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { MerchScreen } from './components/MerchScreen';

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
  // OS-032: the native era stream, reached via `?screen=era-stream` once the
  // `eraStream` route flag is on (off by default — see routes.ts).
  const [eraStreamOpen, setEraStreamOpen] = useState(false);
  // OS-037: native community/merch directories, reached via `?mode=community`
  // / `?mode=merch` once their respective route flags are on (both off by
  // default — see routes.ts).
  const [communityOpen, setCommunityOpen] = useState(false);
  const [merchOpen, setMerchOpen] = useState(false);

  // OS-030: the single navigate(url) every entry point below funnels
  // through — deep links, inbox rows, the web→native bridge, and (via
  // SiteShell's onShouldStart) in-WebView link clicks to native-capable
  // routes. `resolve()` already applies the per-screen feature flags, so
  // toggling one takes effect on the very next navigation with no rebuild.
  const openNativeScreen = useCallback((screen: ScreenId) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setEraStreamOpen(false);
    setCommunityOpen(false);
    setMerchOpen(false);
    if (screen === 'settings') setNotificationSettingsOpen(true);
    else if (screen === 'era-stream') setEraStreamOpen(true);
    else if (screen === 'community') setCommunityOpen(true);
    else if (screen === 'merch') setMerchOpen(true);
    else setInboxOpen(true);
  }, []);

  const openWebUrl = useCallback((url: string) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setEraStreamOpen(false);
    setCommunityOpen(false);
    setMerchOpen(false);
    setWebUrl(url);
  }, []);

  const navigate = useCallback(
    (rawUrl: string | null | undefined) => {
      createNavigate({ openNative: openNativeScreen, openWeb: openWebUrl }, SITE_URL)(rawUrl);
    },
    [openNativeScreen, openWebUrl],
  );

  // SiteShell intercepts in-WebView link clicks that target a native-capable
  // route (per the OS-030 card) so a link to Settings/Inbox opens the native
  // screen instead of the WebView rendering the site's own version of it.
  const isNativeCapableUrl = useCallback(
    (url: string) => 'native' in resolveRoute(url, SITE_URL),
    [],
  );

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
      navigate(link);
    };
    Notifications.getLastNotificationResponseAsync()
      .then(read)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(read);
    return () => sub.remove();
  }, [navigate]);

  // OS-002/OS-030: the in-page bell (site's own top bar, shown only when
  // `isInApp()`) posts one of these instead of the app rendering its own
  // floating bell overlay. Mirrors the onboarding-gate logic the removed
  // overlay used to run on press. Routes through openNativeScreen (the same
  // native-screen opener navigate() uses) rather than raw setState so this
  // stays the single place screen-opening logic lives.
  const handleBridgeMessage = useCallback(
    (message: NativeBridgeMessage) => {
      if (message.type === 'openInbox') {
        openNativeScreen('inbox');
        return;
      }
      // openNotificationSettings
      hasOnboardingBeenOffered()
        .then((offered) => {
          if (offered) openNativeScreen('settings');
          else setOnboardingOpen(true);
        })
        .catch(() => openNativeScreen('settings'));
    },
    [openNativeScreen],
  );

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
              onOpenItem={(event) => navigate(event.deepLink)}
            />
          ) : eraStreamOpen ? (
            <EraStreamScreen />
          ) : communityOpen ? (
            <CommunityScreen />
          ) : merchOpen ? (
            <MerchScreen />
          ) : onboardingOpen ? (
            <OnboardingScreen
              onDone={(outcome) => {
                setOnboardingOpen(false);
                markOnboardingOffered().catch(() => {
                  /* best-effort — a re-offer on the next bell tap is harmless */
                });
                if (outcome.kind === 'customize') openNativeScreen('settings');
              }}
            />
          ) : (
            <SiteShell
              url={webUrl}
              onBridgeMessage={handleBridgeMessage}
              isNativeCapableUrl={isNativeCapableUrl}
              onNativeCapableLinkPress={navigate}
            />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
});
