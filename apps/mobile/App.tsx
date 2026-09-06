// LongLive — native root.
//
// OS-039 (docs/specs/2026-09-05-one-source-three-surfaces.md, Phase 3):
// SiteShell is retired as the app's DEFAULT surface. Every native screen
// OS-032..OS-038 built now ships flag-on by default (routes.ts's
// DEFAULT_ROUTE_FLAGS) and the five native worlds (era stream, threads,
// clownbot, community, merch) are reachable from a persistent
// BottomTabBar, same as the web's own BottomNav.tsx. The WebView
// (components/SiteShell.tsx) still exists and is still mounted, but ONLY
// ever shows one of the three legal pages (`/privacy`, `/terms`,
// `/support`) — see `isLegalPageUrl` below — which have no native screen
// and never will (they're static legal text, not product surface). Any
// other URL that `resolve()`/`destinationFor` would have sent to the
// WebView (a bare site root, an off-site link, a stale `?current=`/`?song=`/
// `?guide=` notification-era param with no native equivalent yet) now lands
// on the native home (whichever BottomTabBar tab was last active) instead —
// see `openWebUrl` below. This preserves the pre-OS-039 decision (2026-09-05,
// docs/decisions.md) that a notification/link the app doesn't understand
// must never crash or dead-end, it now just degrades to the native home
// screen instead of a WebView load.
//
// SAFE AREA (2026-08-30). `SafeAreaView` from `react-native` is iOS-only — on
// Android it insets nothing, so chrome rendered under the status bar and
// swallowed taps. `react-native-safe-area-context` reads real window insets
// on both platforms; `initialWindowMetrics` seeds it synchronously so the
// first frame is already inset.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { ThreadsScreen } from './components/ThreadsScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { MerchScreen } from './components/MerchScreen';
import { TrackGuideScreen } from './components/TrackGuideScreen';
import { SongScreen } from './components/SongScreen';
import { MomentSheet } from './components/MomentSheet';
import { ClownChatScreen } from './components/ClownChatScreen';
import { BottomTabBar, type HomeTab } from './components/BottomTabBar';

/**
 * OS-039: the only three routes the WebView is still allowed to show —
 * static legal text with no native screen and no plan to ever get one.
 * Matched on pathname alone (query/hash ignored) against `SITE_URL`'s own
 * host, same host-matching posture `destinationFor` (@swift2/shared) uses,
 * so a non-longlivets.com URL is never mistaken for a legal page.
 */
const LEGAL_PATHS = new Set(['/privacy', '/terms', '/support']);

function isLegalPageUrl(rawUrl: string, siteUrl: string): boolean {
  try {
    const site = new URL(siteUrl);
    const siteHosts = new Set(
      site.hostname.startsWith('www.')
        ? [site.hostname, site.hostname.slice('www.'.length)]
        : [site.hostname, `www.${site.hostname}`],
    );
    const u = new URL(rawUrl);
    return siteHosts.has(u.hostname) && LEGAL_PATHS.has(u.pathname);
  } catch {
    return false;
  }
}

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
  // OS-039: the native home is now always one of the five BottomTabBar
  // worlds — this replaces the old "webUrl state that defaults to the site
  // root" posture. `legalUrl` is the ONLY thing that still drives a WebView
  // load; it is null whenever no legal page is showing (i.e. every other
  // screen state below takes priority in the render tree).
  const [activeTab, setActiveTab] = useState<HomeTab>('era');
  const [legalUrl, setLegalUrl] = useState<string | null>(null);
  // Notifications Phase 1 (spec §8): the bell is reachable from every screen
  // → Notification Settings. App.tsx renders one screen at a time, so the
  // native screens are full-bleed overlays toggled by local state.
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  // Phase 2 (spec §7): the pre-permission onboarding screen, shown at most
  // once per install, at the value moment of the first bell tap.
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // OS-035: the native track guide / song dossier, reached via
  // `?screen=track-guide` / `?screen=song` (both flag-on by default since
  // OS-039 — see routes.ts). See `TrackGuideRouteState`'s doc for why this
  // is a small union rather than another plain boolean.
  const [trackGuideRoute, setTrackGuideRoute] = useState<TrackGuideRouteState>(null);
  // Tracks for the era currently open in `trackGuideRoute` — loaded async
  // via `loadTrackGuide` (the published bundle, OS-035's data layer) and
  // kept alongside the route so both TrackGuideScreen and SongScreen (which
  // needs the full album list for Previous/Next) can read it without each
  // re-fetching. Cleared whenever the route's era changes so a stale list
  // never renders while the new era's fetch is in flight.
  const [trackGuideTracks, setTrackGuideTracks] = useState<TrackNote[]>([]);
  // OS-033: the native moment detail sheet, reached via `?item=<id>` (the
  // `moment` route flag is on by default since OS-039 — see routes.ts).
  // Holds the id rather than a boolean since the sheet needs it to load the
  // moment.
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
  // OS-039: `era-stream`/`threads`/`community`/`merch`/`clownbot` no longer
  // get their own boolean — they ARE the five BottomTabBar tabs, so
  // resolving one of them just switches `activeTab` (closing every other
  // overlay first, same as every other branch here always has).
  const openNativeScreen = useCallback((screen: ScreenId, params: NativeParams = {}) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setTrackGuideRoute(null);
    setMomentItemId(null);
    setLegalUrl(null);
    if (screen === 'settings') {
      setNotificationSettingsOpen(true);
    } else if (
      screen === 'era-stream' ||
      screen === 'threads' ||
      screen === 'community' ||
      screen === 'merch' ||
      screen === 'clownbot'
    ) {
      setActiveTab(screen === 'era-stream' ? 'era' : screen);
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

  // OS-039: a URL `resolve()` hands to `openWeb` is one of two things now —
  // a legal page (`/privacy`, `/terms`, `/support`), which the WebView still
  // renders, or anything else (a bare site root, an off-site URL, a stale
  // notification param with no native screen), which degrades to the
  // native home rather than ever loading the WebView on a non-legal route
  // (this card's own "done when": no route resolves to `web` except the
  // legal pages).
  const openWebUrl = useCallback((url: string) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setTrackGuideRoute(null);
    setMomentItemId(null);
    if (isLegalPageUrl(url, SITE_URL)) {
      setLegalUrl(url);
    } else {
      setLegalUrl(null);
      setActiveTab('era');
    }
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
          ) : legalUrl ? (
            // OS-039: the WebView's LAST remaining job — one of the three
            // legal pages. No native-capable-link interception here (a
            // legal page has no in-page links back into the app's own
            // native-capable routes worth intercepting); `navigate` still
            // handles the rare in-page link to another part of the site.
            <SiteShell
              url={legalUrl}
              onBridgeMessage={handleBridgeMessage}
              isNativeCapableUrl={isNativeCapableUrl}
              onNativeCapableLinkPress={navigate}
            />
          ) : (
            <View style={styles.fill}>
              <View style={styles.fill}>
                {activeTab === 'era' ? (
                  <EraStreamScreen onOpenItem={openMoment} />
                ) : activeTab === 'threads' ? (
                  <ThreadsScreen />
                ) : activeTab === 'clownbot' ? (
                  <ClownChatScreen onClose={() => setActiveTab('era')} />
                ) : activeTab === 'community' ? (
                  <CommunityScreen />
                ) : (
                  <MerchScreen />
                )}
              </View>
              <BottomTabBar active={activeTab} onChange={setActiveTab} />
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
});
