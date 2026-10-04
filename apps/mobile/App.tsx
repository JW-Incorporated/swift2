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
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNotificationTaps } from './lib/use-notification-taps';
import { loadAppConfig, loadLaunchFlags } from './lib/app-config';
import { diagCollector, installDiagnostics } from './lib/diagnostics';
import { installSpeedTest } from './lib/speed-test-runtime';
import { currentNativeBuild, isUpdateRequired } from './lib/update-required';
import { registerDevice } from './lib/push-registration';
import { registerNotificationActions } from './lib/notification-actions';
import { SITE_URL } from './lib/site-url';
import { RecoveryScreen } from './components/RecoveryScreen';
import { UpdateRequiredScreen } from './components/UpdateRequiredScreen';
import { DiagHotCorner } from './components/DiagHotCorner';
import { DomHostMount } from './components/DomHostMount';
import { shouldMountHotCorner } from './lib/diag-hot-corner';
import { lockPhonesToPortrait } from './lib/orientation-lock';
import { eraColors } from './lib/theme';
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
    registerDevice().catch((e) => {
      console.warn('device registration failed', e instanceof Error ? e.message : e);
    });
    registerNotificationActions().catch((e) => {
      console.warn('notification action registration failed', e instanceof Error ? e.message : e);
    });
  }, []);

  // A tapped notification's `deepLink` goes through the tap queue (lib/notification-tap-gate.ts): held until the DOM host binds and acks.
  useNotificationTaps();

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        {/* #4953: ONE inset owner. The DOM mount is edge-to-edge (edges={[]}) and the DOM owns the
            insets via --safe-top/--safe-bottom; native screens and the fallback keep all four edges. */}
        <SafeAreaView style={styles.fill} edges={domRendered ? [] : undefined}>
          <StatusBar style="light" />
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
          ) : domMount.mount === 'pending' ? (
            <View style={{ flex: 1, backgroundColor: eraColors.bg }} testID="launch-pending" />
          ) : (
            <RecoveryScreen slow={domMount.nativeReason === 'pending-expired'} />
          )}
        </SafeAreaView>
        {!updateRequired && shouldMountHotCorner(domMount.mount) && <DiagHotCorner />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
});
