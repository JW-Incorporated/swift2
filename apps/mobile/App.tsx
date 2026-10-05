// LongLive — native root.
//
// One UI PR3: the legacy native UI (SiteShell, the BottomTabBar worlds, every native screen) is
// deleted. The app mounts the shared-UI DOM host; when the DOM host is not mounted (watchdog
// fallback, quarantine, pending expiry, sharedUi flag off) it shows the Recovery screen. The
// emergency lever is an OTA rollback, not a flag. UpdateRequired, the diagnostics hot corner, tap
// intake, device registration and the watchdog stay here.
//
// SAFE AREA (2026-08-30). `SafeAreaView` from `react-native` is iOS-only — on
// Android it insets nothing, so chrome rendered under the status bar and
// swallowed taps. `react-native-safe-area-context` reads real window insets
// on both platforms; `initialWindowMetrics` seeds it synchronously so the
// first frame is already inset.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
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
import { loadAppConfig, loadLaunchFlags } from './lib/app-config';
import { diagCollector, installDiagnostics } from './lib/diagnostics';
import { runAfterFirstPaint } from './lib/launch-defer';
import { installSpeedTest } from './lib/speed-test-runtime';
import { currentNativeBuild, isUpdateRequired } from './lib/update-required';
import { ensureDeviceRegistered } from './lib/ensure-device-registered';
import { flushPendingOptOut } from './lib/push-registration';
import { registerNotificationActions } from './lib/notification-actions';
import { SITE_URL } from './lib/site-url';
import { RecoveryScreen } from './components/RecoveryScreen';
import { UpdateRequiredScreen } from './components/UpdateRequiredScreen';
import { DiagHotCorner } from './components/DiagHotCorner';
import { DomHostMount } from './components/DomHostMount';
import { shouldMountHotCorner } from './lib/diag-hot-corner';
import { lockPhonesToPortrait } from './lib/orientation-lock';
import { eraColors } from './lib/theme';
import { effectiveNativeTheme, getNativeTheme, resetNativeTheme, subscribeNativeTheme } from './lib/native-theme-store';
import { FirstLaunchScreen } from './components/FirstLaunchScreen';
import { useDomMount, type LaunchInputs } from './lib/watchdog-gate';
import { domSurfaceRendered } from './lib/dom-host-handlers';
import { useNativeOverlay } from './lib/use-native-overlay';

installDiagnostics();
installSpeedTest();

export default function App() {
  const [updateRequired, setUpdateRequired] = useState(false);
  // WP2.14 launch inputs, read once: the last-good CACHED flags (the C4 Force-shared-UI override no longer feeds launch). The network result below never changes this launch.
  const [launchInputs, setLaunchInputs] = useState<LaunchInputs | null>(null);
  const domMount = useDomMount(launchInputs);
  // D-7: native overlays present in an RN Modal over the STILL-MOUNTED DOM host; the overlay resets
  // whenever the DOM surface is not rendered (watchdog fallback, update-required). See use-native-overlay.
  const domRendered = domSurfaceRendered(domMount.mount, updateRequired);
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
    void loadLaunchFlags().then((flags) => setLaunchInputs(flags));
  }, []);
  useEffect(() => {
    let cancelled = false;
    const endConfig = diagCollector.start('config');
    diagCollector.mark('app-first-render');
    loadAppConfig().then((config) => {
      endConfig();
      if (cancelled) return;
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

  useEffect(() => {
    // Phase 0: register (or refresh) this device's row on every cold start —
    // WITHOUT asking for notification permission here (spec §7); an already-granted, not-turned-off device refreshes its
    // push token, otherwise the row is upserted without one. Failures are
    // non-fatal: logged, never surfaced as a blocking error.
    // Deferred past first paint (its secure-storage ops would delay the mount gate); ensureDeviceRegistered() is memoized,
    // so an earlier on-demand caller (prefs client) triggers it once and this call joins it.
    const cancelRegistration = runAfterFirstPaint(() => {
      ensureDeviceRegistered().catch((e) => {
        console.warn('device registration failed', e instanceof Error ? e.message : e);
      });
    });
    registerNotificationActions().catch((e) => {
      console.warn('notification action registration failed', e instanceof Error ? e.message : e);
    });
    // A turn-off whose server write failed offline is finished the next time the app returns to the foreground.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void flushPendingOptOut());
    return () => {
      cancelRegistration();
      sub.remove();
    };
  }, []);

  // A tapped notification's `deepLink` goes through the tap queue (lib/notification-tap-gate.ts): held until the DOM host
  // binds and acks. The Recovery screen holds them like pending (#5102)
  useNotificationTaps();
  useDeepLinks(notificationTapGate);

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
              state={nativeRoute}
              presenter={presenter}
            />
          ) : domMount.mount === 'awaiting-content' ? (
            <FirstLaunchScreen failed={domMount.contentFailed} onRetry={domMount.retryContent} kind={domMount.contentKind} />
          ) : domMount.mount === 'pending' ? (
            <View style={{ flex: 1, backgroundColor: eraColors.bg }} testID="launch-pending" />
          ) : (
            <RecoveryScreen slow={domMount.nativeReason === 'pending-expired'} />
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
