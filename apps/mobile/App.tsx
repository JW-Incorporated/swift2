// Swift2 Vault — native reader root.
// Loads the Tier 0 skeleton through @swift2/core (the SAME data layer the web
// app uses) and hands it to the era navigator. View code only lives here; all
// domain logic is in @swift2/shared (architecture.md hard boundary).
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import type { VaultSkeleton } from '@swift2/core';
import { loadSkeleton } from './lib/vault';
import { VaultNavigator } from './components/VaultNavigator';

export default function App() {
  const [skeleton, setSkeleton] = useState<VaultSkeleton | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadSkeleton()
      .then((s) => alive && setSkeleton(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <StatusBar style="light" />
        {error ? (
          <SafeAreaView style={[styles.fill, styles.center]}>
            <Text style={styles.errTitle}>Couldn’t load the Vault</Text>
            <Text style={styles.errBody}>{error}</Text>
          </SafeAreaView>
        ) : !skeleton ? (
          <SafeAreaView style={[styles.fill, styles.center]}>
            <ActivityIndicator />
            <Text style={styles.loading}>Loading the Vault…</Text>
          </SafeAreaView>
        ) : (
          <VaultNavigator skeleton={skeleton} />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { color: '#aaa', marginTop: 10 },
  errTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errBody: { color: '#f88', textAlign: 'center' },
});
