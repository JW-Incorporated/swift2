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
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { notificationTapGate, useNotificationTaps } from './lib/use-notification-taps';
import { useDeepLinks } from './lib/use-deep-links';
import { DiagLinkHost } from './components/DiagLinkHost';
import {
  DEFAULT_ROUTE_FLAGS,
  createNavigate,
  resolve as resolveRoute,
  type RouteFlags,
} from './lib/routes';
import { loadAppConfig, loadLaunchFlags, routeFlagsFrom } from './lib/app-config';
import { diagCollector, installDiagnostics } from './lib/diagnostics';
import { runAfterFirstPaint } from './lib/launch-defer';
import { installSpeedTest } from './lib/speed-test-runtime';
import { currentNativeBuild, isUpdateRequired } from './lib/update-required';
import { ensureDeviceRegistered } from './lib/ensure-device-registered';
import { registerNotificationActions } from './lib/notification-actions';
import { hasOnboardingBeenOffered, isPushPermissionUndetermined } from './lib/onboarding-state';
import { openSettingsEntry } from './lib/settings-entry';
import { useNativeScreenState } from './lib/use-native-screen-state';
import { SITE_URL, type NativeBridgeMessage } from './components/SiteShell';
import { NativeScreenRouter } from './components/NativeScreenRouter';
import { UpdateRequiredScreen } from './components/UpdateRequiredScreen';
import { DiagHotCorner } from './components/DiagHotCorner';
import { DomHostMount } from './components/DomHostMount';
import { shouldMountHotCorner } from './lib/diag-hot-corner';
import { lockPhonesToPortrait } from './lib/orientation-lock';
import { getForceSharedUi } from './lib/diagnostics-override';
import { eraColors } from './lib/theme';
import { effectiveNativeTheme, getNativeTheme, resetNativeTheme, subscribeNativeTheme } from './lib/native-theme-store';
import { useDomMount, type LaunchInputs } from './lib/watchdog-gate';
import { domSurfaceRendered } from './lib/dom-host-handlers';
import { useNativeOverlay } from './lib/use-native-overlay';

installDiagnostics();
installSpeedTest();

export default function App() {
  const nav = useNativeScreenState();
  const { setOnboardingOpen, openNativeScreen, openWebUrl } = nav;

  // Remote kill switch: starts on the compiled defaults (startup never waits
  // on the network); the ref lets the stable callbacks below read the latest
  // flags without re-subscribing the notification listener.
  const [routeFlags, setRouteFlags] = useState<RouteFlags>(DEFAULT_ROUTE_FLAGS);
  const routeFlagsRef = useRef(routeFlags);
  routeFlagsRef.current = routeFlags;
  const [updateRequired, setUpdateRequired] = useState(false);
  // WP2.14 launch inputs, all local and read once: C4 override (Diagnostics, so a toggle applies on the
  // next launch) + the last-good CACHED flags. The network result below never changes this launch.
  const [launchInputs, setLaunchInputs] = useState<LaunchInputs | null>(null);
  const domMount = useDomMount(launchInputs);
  // D-7: native screens present in an RN Modal over the STILL-MOUNTED DOM host; the overlay resets
  // whenever the DOM surface is not rendered (watchdog fallback, update-required). See use-native-overlay.
  const domRendered = domSurfaceRendered(domMount.mount, updateRequired);
  const { setNativeMounted } = nav;
  const nativeMounted = !updateRequired && domMount.mount === 'native';
  useEffect(() => setNativeMounted(nativeMounted), [nativeMounted, setNativeMounted]);
  const { state: nativeRoute, presenter } = useNativeOverlay(domRendered);
  const theme = effectiveNativeTheme(domRendered, useSyncExternalStore(subscribeNativeTheme, getNativeTheme));
  useEffect(() => {
    if (!domRendered) resetNativeTheme();
  }, [domRendered]);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
  }, [theme.background]);
  useEffect(() => {
    void lockPhonesToPortrait();
    void Promise.all([getForceSharedUi(), loadLaunchFlags()]).then(([override, flags]) =>
      setLaunchInputs({ override, ...flags }),
    );
  }, []);
  useEffect(() => {
    let cancelled = false;
    const endConfig = diagCollector.start('config');
    diagCollector.mark('app-first-render');
    loadAppConfig().then((config) => {
      endConfig();
      if (cancelled) return;
      setRouteFlags(routeFlagsFrom(config));
      setUpdateRequired(
        isUpdateRequired({
          platform: Platform.OS,
          nativeBuild: currentNativeBuild(),
          minNativeBuild: config.minNativeBuild,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = useCallback(
    (rawUrl: string | null | undefined) => {
      createNavigate(
        { openNative: openNativeScreen, openWeb: openWebUrl },
        SITE_URL,
        () => routeFlagsRef.current,
      )(rawUrl);
    },
    [openNativeScreen, openWebUrl],
  );

  // SiteShell intercepts in-WebView link clicks that target a native-capable
  // route (per the OS-030 card) so a link to Settings/Inbox opens the native
  // screen instead of the WebView rendering the site's own version of it.
  const isNativeCapableUrl = useCallback(
    (url: string) => 'native' in resolveRoute(url, SITE_URL, routeFlagsRef.current),
    [],
  );

  useEffect(() => {
    // Phase 0: register (or refresh) this device's row on every cold start —
    // WITHOUT asking for notification permission here (spec §7); an already-granted, not-turned-off device refreshes its
    // push token, otherwise the row is upserted without one. Failures are
    // non-fatal: logged, never surfaced as a blocking error.
    // Deferred past first paint (its SecureStore ops would delay the mount gate); ensureDeviceRegistered() is memoized,
    // so an earlier on-demand caller (prefs client) triggers it once and this call joins it.
    const cancelRegistration = runAfterFirstPaint(() => {
      ensureDeviceRegistered().catch((e) => {
        console.warn('device registration failed', e instanceof Error ? e.message : e);
      });
    });
    registerNotificationActions().catch((e) => {
      console.warn('notification action registration failed', e instanceof Error ? e.message : e);
    });
    return cancelRegistration;
  }, []);

  // A tapped notification's `deepLink` goes through the tap queue (lib/notification-tap-gate.ts):
  // native screens when the DOM host is not mounted, the bridge `navigate` once it is ready.
  useNotificationTaps(navigate, domMount.mount === 'native');
  useDeepLinks(notificationTapGate);

  // The one "open settings" gate (lib/settings-entry.ts): onboarding the
  // first time so push permission is actually offered, settings after that.
  // Used by HomeTopBar's Settings button — the native home's only entry to
  // settings/inbox/onboarding since OS-039 retired the site's in-page bell —
  // and by the legacy web bridge below.
  const openSettings = useCallback(() => {
    void openSettingsEntry({
      hasOnboardingBeenOffered,
      isPushPermissionUndetermined,
      openSettings: () => openNativeScreen('settings'),
      openOnboarding: () => setOnboardingOpen(true),
    });
  }, [openNativeScreen]);

  // OS-002/OS-030: the in-page bell (site's own top bar, shown only when
  // `isInApp()`) posts one of these instead of the app rendering its own
  // floating bell overlay. Routes through openNativeScreen / openSettings so
  // screen-opening logic lives in one place.
  const handleBridgeMessage = useCallback(
    (message: NativeBridgeMessage) => {
      if (message.type === 'openInbox') openNativeScreen('inbox');
      else openSettings();
    },
    [openNativeScreen, openSettings],
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


  const getRouteFlags = useCallback(() => routeFlagsRef.current, []);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        {/* #4953: ONE inset owner. The DOM mount is edge-to-edge (edges={[]}) and the DOM owns the
            insets via --safe-top/--safe-bottom; native screens and the fallback keep all four edges. */}
        <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]} edges={domRendered ? [] : undefined}>
          <StatusBar style={theme.statusBarStyle} />
          {updateRequired ? (
            <UpdateRequiredScreen />
          ) : domMount.mount === 'dom' ? (
            <DomHostMount
              watch={domMount.watch}
              forceFailure={domMount.forceFailure}
              siteUrl={SITE_URL}
              getRouteFlags={getRouteFlags}
              state={nativeRoute}
              presenter={presenter}
            />
          ) : domMount.mount === 'pending' ? (
            <View style={{ flex: 1, backgroundColor: eraColors.bg }} testID="launch-pending" />
          ) : (
            <NativeScreenRouter
              nav={nav}
              navigate={navigate}
              openSettings={openSettings}
              openMoment={openMoment}
              handleBridgeMessage={handleBridgeMessage}
              isNativeCapableUrl={isNativeCapableUrl}
            />
          )}
        </SafeAreaView>
        {!updateRequired && shouldMountHotCorner(domMount.mount) && <DiagHotCorner />}
        <DiagLinkHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: eraColors.bg, flex: 1 },
});
