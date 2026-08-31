// Notifications Phase 2 (NOTIFICATIONS_SPEC.md §7, NOTIFICATIONS_PLAN.md
// Phase 2) — the pre-permission onboarding screen.
//
// "Never fire the OS permission dialog cold on first launch — a denial
// there is nearly unrecoverable on iOS." This screen is shown at a VALUE
// MOMENT (App.tsx triggers it after the user has actually browsed —
// specifically, on first opening the notification bell, which already
// implies interest — never on cold start). It shows three presets, and
// only after the user picks one (or Customize) does the real OS permission
// dialog fire, via `requestPushRegistration()` (Phase 0's push-registration
// module — this screen is the caller Phase 0's own comment names as
// "a future caller... at the right moment").
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ONBOARDING_PRESETS, type OnboardingPresetId } from '@swift2/shared';
import { requestPushRegistration } from '../lib/push-registration';
import { saveDevicePrefs } from '../lib/prefs-client';

export interface OnboardingScreenProps {
  /** Called once the flow completes — either a preset applied (with the OS
   * dialog already resolved, granted or not) or the user chose Customize
   * (caller should open the full settings screen instead). */
  onDone: (
    outcome: { kind: 'preset'; presetId: OnboardingPresetId } | { kind: 'customize' },
  ) => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [busyPresetId, setBusyPresetId] = useState<OnboardingPresetId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choosePreset(presetId: OnboardingPresetId) {
    setError(null);
    setBusyPresetId(presetId);
    try {
      const preset = ONBOARDING_PRESETS.find((p) => p.id === presetId);
      if (!preset) throw new Error(`unknown preset: ${presetId}`);
      // Apply prefs FIRST, then fire the real OS permission dialog (spec
      // §7 step 3: "Only after a preset/custom choice, fire the real OS
      // dialog") — this ordering means a device that ends up denying
      // permission still has its chosen prefs on file for if/when it's
      // granted later from Settings.
      await saveDevicePrefs({ prefs: [...preset.prefs] });
      await requestPushRegistration();
      onDone({ kind: 'preset', presetId });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyPresetId(null);
    }
  }

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Stay in the loop</Text>
        <Text style={styles.subtitle}>
          Pick how much you want to hear from Long Live \u2014 you can change this any time.
        </Text>

        {error && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errText}>{error}</Text>
          </View>
        )}

        {ONBOARDING_PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            onPress={() => choosePreset(preset.id)}
            disabled={busyPresetId !== null}
            accessibilityRole="button"
            accessibilityLabel={preset.title}
            style={[styles.card, busyPresetId !== null && styles.cardDisabled]}
          >
            <Text style={styles.cardTitle}>{preset.title}</Text>
            <Text style={styles.cardDescription}>{preset.description}</Text>
            {busyPresetId === preset.id && <ActivityIndicator style={styles.cardSpinner} />}
          </Pressable>
        ))}

        <Pressable
          onPress={() => onDone({ kind: 'customize' })}
          disabled={busyPresetId !== null}
          accessibilityRole="button"
          accessibilityLabel="Customize"
          style={styles.customizeButton}
        >
          <Text style={styles.customizeText}>Customize \u2192</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  scroll: { padding: 20, paddingTop: 64, gap: 14 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#999', fontSize: 14, marginBottom: 10 },
  errorBanner: { backgroundColor: '#2a1010', borderRadius: 8, padding: 12 },
  errText: { color: '#f88', fontSize: 13 },
  card: {
    backgroundColor: '#16161c',
    borderRadius: 14,
    borderColor: '#2a2a33',
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  cardDisabled: { opacity: 0.6 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cardDescription: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  cardSpinner: { marginTop: 6 },
  customizeButton: { alignItems: 'center', paddingVertical: 14 },
  customizeText: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
});
