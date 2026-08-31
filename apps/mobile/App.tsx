// Swift2 Vault — native reader root.
// Loads the Tier 0 skeleton through @swift2/core (the SAME data layer the web
// app uses) and hands it to the era navigator. View code only lives here; all
// domain logic is in @swift2/shared (architecture.md hard boundary).
//
// SAFE AREA (2026-08-30). This file used to import `SafeAreaView` from
// `react-native`. That component is iOS-only — on Android it renders as a plain
// View and insets NOTHING. Since SDK 54 Expo draws Android edge-to-edge, so the
// app's first row of chrome (the EraTimeline scrubber strip) rendered UNDER the
// status bar: its era segments sat at y=71–97 while the status-bar window
// swallowed every touch down to y=128, making tap-to-jump completely dead on
// Android. Dragging still worked, so screenshots looked fine.
//
// The fix is the standard Expo one: `react-native-safe-area-context`, whose
// SafeAreaView reads the real window insets on both platforms. The provider
// must wrap everything that consumes insets; `initialWindowMetrics` seeds it
// synchronously so the first frame is already inset (no visible reflow).
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { VaultSkeleton } from '@swift2/core';
import { loadSkeleton } from './lib/vault';
import { registerDevice } from './lib/push-registration';
import { registerNotificationActions } from './lib/notification-actions';
import { hasOnboardingBeenOffered, markOnboardingOffered } from './lib/onboarding-state';
import { VaultNavigator } from './components/VaultNavigator';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { OnboardingScreen } from './components/OnboardingScreen';

export default function App() {
  const [skeleton, setSkeleton] = useState<VaultSkeleton | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Notifications Phase 1 (spec §8: "persistent bell icon in the app header
  // on every screen → Notification Settings"). No navigation library is
  // wired up in this app yet (App.tsx renders one screen at a time), so the
  // settings screen is a full-bleed overlay toggled by local state rather
  // than a route — same reachability guarantee (≤1 tap from anywhere), no
  // new dependency.
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  // Notifications Phase 2 (spec §7): the pre-permission onboarding screen,
  // shown at the VALUE MOMENT of the user first tapping the bell — that tap
  // already signals "I care about notifications", and it's the same
  // reachability point Phase 1 built, so no new UI surface is needed to
  // find the trigger. Shown at most once per install (onboarding-state.ts).
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSkeleton()
      .then((s) => alive && setSkeleton(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    // Notifications Phase 0: register (or refresh) this device's row on
    // every cold start — WITHOUT ever asking for notification permission
    // here (spec §7: never fire the OS dialog cold on first launch; that ask
    // is Phase 2's pre-permission onboarding screen, gated on a value
    // moment). Failures here are non-fatal to the app — logged, never
    // surfaced as a blocking error.
    registerDevice().catch((e) => {
      console.warn('device registration failed', e instanceof Error ? e.message : e);
    });
    // Notifications Phase 2 (spec §8): "Mute this type" + "Settings" on
    // every notification. Registering the action set is independent of
    // permission state (Expo lets you define categories before permission
    // is granted) and idempotent, so it's safe alongside the cold-start
    // device registration above.
    registerNotificationActions().catch((e) => {
      console.warn('notification action registration failed', e instanceof Error ? e.message : e);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        {/* The one and only inset boundary. The status/loading states below are
            plain Views on purpose: a nested SafeAreaView would apply the same
            padding a second time. */}
        <SafeAreaView style={styles.fill}>
          <StatusBar style="light" />
          {notificationSettingsOpen ? (
            <NotificationSettingsScreen onClose={() => setNotificationSettingsOpen(false)} />
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
          ) : error ? (
            <View style={[styles.fill, styles.center]}>
              <Text style={styles.errTitle}>Couldn’t load the Vault</Text>
              <Text style={styles.errBody}>{error}</Text>
            </View>
          ) : !skeleton ? (
            <View style={[styles.fill, styles.center]}>
              <ActivityIndicator />
              <Text style={styles.loading}>Loading the Vault…</Text>
            </View>
          ) : (
            <>
              <VaultNavigator skeleton={skeleton} />
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
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { color: '#aaa', marginTop: 10 },
  errTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errBody: { color: '#f88', textAlign: 'center' },
  bellButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,15,0.85)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 44,
  },
  bellIcon: { fontSize: 20 },
});
