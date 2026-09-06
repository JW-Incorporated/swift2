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
import type { EraId, TrackNote } from '@swift2/experience';
import { resolveTrackKey } from '@swift2/experience';
import {
  createNavigate,
  resolve as resolveRoute,
  type NativeParams,
  type ScreenId,
} from './lib/routes';
import { registerDevice } from './lib/push-registration';
import { registerNotificationActions } from './lib/notification-actions';
import { hasOnboardingBeenOffered, markOnboardingOffered } from './lib/onboarding-state';
import { ensureTrackGuideWired, loadTrackGuide } from './lib/track-guide-data';
import { SITE_URL, SiteShell, type NativeBridgeMessage } from './components/SiteShell';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { NotificationInboxScreen } from './components/NotificationInboxScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { EraStreamScreen } from './components/EraStreamScreen';
import { TrackGuideScreen } from './components/TrackGuideScreen';
import { SongScreen } from './components/SongScreen';
import { MomentSheet } from './components/MomentSheet';

/**
 * OS-035's two param-carrying screens don't fit the existing plain-boolean
 * `xOpen` state slots the other screens use (they need an eraId, and `song`
 * additionally needs which track) — this union is the minimal extension of
 * that pattern rather than a bigger routing refactor. `null` = neither is
 * showing (i.e. some other screen or the WebView owns the view).
 */
type TrackGuideRouteState =
  | { screen: 'track-guide'; eraId: EraId }
  | { screen: 'song'; eraId: EraId; track: TrackNote }
  | null;

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
  // OS-035: the native track guide / song dossier, reached via
  // `?screen=track-guide` / `?screen=song` once their respective route
  // flags are on (off by default — see routes.ts). See
  // `TrackGuideRouteState`'s doc for why this is a small union rather than
  // another plain boolean.
  const [trackGuideRoute, setTrackGuideRoute] = useState<TrackGuideRouteState>(null);
  // Tracks for the era currently open in `trackGuideRoute` — loaded async
  // via `loadTrackGuide` (the published bundle, OS-035's data layer) and
  // kept alongside the route so both TrackGuideScreen and SongScreen (which
  // needs the full album list for Previous/Next) can read it without each
  // re-fetching. Cleared whenever the route's era changes so a stale list
  // never renders while the new era's fetch is in flight.
  const [trackGuideTracks, setTrackGuideTracks] = useState<TrackNote[]>([]);
  // OS-033: the native moment detail sheet, reached via `?item=<id>` once the
  // `moment` route flag is on (off by default — see routes.ts). Holds the id
  // rather than a boolean since the sheet needs it to load the moment.
  const [momentItemId, setMomentItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!trackGuideRoute) return;
    let cancelled = false;
    setTrackGuideTracks([]);
    loadTrackGuide(trackGuideRoute.eraId)
      .then((tracks) => {
        if (!cancelled) setTrackGuideTracks(tracks);
      })
      .catch((e) => {
        console.warn('loadTrackGuide failed', e instanceof Error ? e.message : e);
      });
    return () => {
      cancelled = true;
    };
  }, [trackGuideRoute?.eraId]);

  // OS-030: the single navigate(url) every entry point below funnels
  // through — deep links, inbox rows, the web→native bridge, and (via
  // SiteShell's onShouldStart) in-WebView link clicks to native-capable
  // routes. `resolve()` already applies the per-screen feature flags, so
  // toggling one takes effect on the very next navigation with no rebuild.
  const openNativeScreen = useCallback((screen: ScreenId, params: NativeParams = {}) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setEraStreamOpen(false);
    setTrackGuideRoute(null);
    setMomentItemId(null);
    if (screen === 'settings') {
      setNotificationSettingsOpen(true);
    } else if (screen === 'era-stream') {
      setEraStreamOpen(true);
    } else if (screen === 'track-guide') {
      // routes.ts only resolves this screen when `params.eraId` is present
      // (see `paramsForDestination`/`destinationFor`'s track-guide arm) —
      // the fallback below is unreachable in practice, kept only so this
      // function never silently no-ops on a malformed call.
      if (params.eraId) setTrackGuideRoute({ screen: 'track-guide', eraId: params.eraId as EraId });
    } else if (screen === 'song') {
      const key = params.trackKey;
      if (!key) return;
      // The song screen also needs the resolved TrackNote (not just its
      // key) — `resolveTrackKey` needs the tracks provider wired first, so
      // this ensures the bundle is loaded before resolving. `loadTrackGuide`
      // (below, via the route-state effect) redundantly re-wires the same
      // provider for the era once `trackGuideRoute` is set, which is a
      // no-op past the first call (see track-guide-data.ts's `tracksWired`
      // guard) — cheap, and keeps this branch simple rather than needing
      // its own loading state.
      ensureTrackGuideWired()
        .then(() => {
          const resolved = resolveTrackKey(key);
          if (resolved) {
            setTrackGuideRoute({ screen: 'song', eraId: resolved.eraId, track: resolved.track });
          } else {
            console.warn('resolveTrackKey: unknown or stale song key', key);
          }
        })
        .catch((e) => {
          console.warn('ensureTrackGuideWired failed', e instanceof Error ? e.message : e);
        });
    } else if (screen === 'moment' && params.itemId) {
      setMomentItemId(params.itemId);
    } else {
      setInboxOpen(true);
    }
  }, []);

  const openWebUrl = useCallback((url: string) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setEraStreamOpen(false);
    setTrackGuideRoute(null);
    setMomentItemId(null);
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

  // OS-033: a moment id from anywhere in the native tree (era-stream cards,
  // a song dossier's "Keep exploring" connection) funnels through the same
  // navigate() every other entry point uses, so the moment/eraStream/
  // trackGuide route flags all apply consistently regardless of which
  // screen the tap originated from.
  const openMoment = useCallback(
    (id: string) => navigate(`${SITE_URL}?item=${encodeURIComponent(id)}`),
    [navigate],
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
            <EraStreamScreen onOpenItem={openMoment} />
          ) : trackGuideRoute?.screen === 'track-guide' ? (
            <TrackGuideScreen
              eraId={trackGuideRoute.eraId}
              tracks={trackGuideTracks}
              onOpenSong={(track) =>
                setTrackGuideRoute({ screen: 'song', eraId: trackGuideRoute.eraId, track })
              }
            />
          ) : trackGuideRoute?.screen === 'song' ? (
            <SongScreen
              eraId={trackGuideRoute.eraId}
              track={trackGuideRoute.track}
              onOpenSong={(eraId, track) => setTrackGuideRoute({ screen: 'song', eraId, track })}
              // OS-033 ships the native moment sheet: a "Keep exploring"
              // moment connection now opens it (through the same navigate()
              // every other entry point uses), replacing the documented
              // no-op OS-035 left here pending this card.
              onOpenMoment={openMoment}
            />
          ) : momentItemId ? (
            <MomentSheet itemId={momentItemId} onClose={() => setMomentItemId(null)} />
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
