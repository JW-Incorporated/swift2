// Native screen shown while the very first launch downloads the content bundle (no last-good cache on disk yet).
// Lives in the native layer on purpose: the watchdog gate holds the DOM host back until the cache exists.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { contentFailureKind, createRetryScheduler, type ContentFailureKind } from '../lib/watchdog-await-content';

export const FAILURE_COPY: Record<ContentFailureKind, string> = {
  offline: "You're offline — connect to load Long Live",
  timeout: "Long Live is taking too long to load — we'll keep trying",
  server: "Couldn't load Long Live right now — we'll keep trying",
};

export function FirstLaunchScreen({
  failed,
  onRetry,
  kind,
}: {
  failed: boolean;
  onRetry: () => void;
  kind?: ContentFailureKind;
}) {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;
  const schedulerRef = useRef<ReturnType<typeof createRetryScheduler> | null>(null);
  schedulerRef.current ??= createRetryScheduler(() => retryRef.current());
  // Armed only while parked on a failure and foregrounded: a retry flips failed off, which cancels any stray timer.
  useEffect(() => {
    if (!failed || !active) return;
    const sched = schedulerRef.current!;
    sched.arm();
    return () => sched.disarm();
  }, [failed, active]);
  return (
    <View style={styles.fill} testID="first-launch-screen">
      {failed ? (
        <>
          <Text style={styles.message} accessibilityRole="alert">{FAILURE_COPY[kind ?? contentFailureKind()]}</Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={styles.button}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color="#f2c744" size="large" />
          <Text style={[styles.message, styles.loading]} accessibilityLiveRegion="polite">Downloading Long Live…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignItems: 'center',
    backgroundColor: '#0b0b0f',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: { color: '#ffffff', fontSize: 18, marginBottom: 24, textAlign: 'center' },
  loading: { marginBottom: 0, marginTop: 16 },
  button: {
    backgroundColor: '#f2c744',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: { color: '#0b0b0f', fontSize: 15, fontWeight: '700' },
});
