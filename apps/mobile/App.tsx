// Swift2 Vault — mobile (Expo) proof of the shared reader stack.
// A read-only, scrollable era list that pulls the SAME Tier 0 skeleton and
// reuses the SAME @swift2/shared domain logic and era themes as the web app.
// The morph-on-grab gesture scrubber (Reanimated + Gesture Handler) is the
// next mobile milestone; this screen proves the data + domain layer is portable.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { orderedEras } from '@swift2/shared';
import type { Era, MonthItem } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { loadSkeleton } from './lib/vault';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(year: number, month: number): string {
  return `${MONTHS[month - 1] ?? '?'} ${year}`;
}

function rangeLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `${monthLabel(s.getUTCFullYear(), s.getUTCMonth() + 1)} – ${monthLabel(
    e.getUTCFullYear(),
    e.getUTCMonth() + 1,
  )}`;
}

export default function App() {
  const [skeleton, setSkeleton] = useState<VaultSkeleton | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadSkeleton()
      .then((s) => alive && setSkeleton(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={[styles.fill, styles.center]}>
        <Text style={styles.errTitle}>Couldn’t load the Vault</Text>
        <Text style={styles.errBody}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!skeleton) {
    return (
      <SafeAreaView style={[styles.fill, styles.center]}>
        <ActivityIndicator />
        <Text style={styles.loading}>Loading the Vault…</Text>
      </SafeAreaView>
    );
  }

  const eras = orderedEras(skeleton.eras);

  return (
    <SafeAreaView style={styles.fill}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>The Vault</Text>
        {eras.map((era) => (
          <EraCard
            key={era.slug}
            era={era}
            items={skeleton.monthItems.filter((it) => it.eraSlug === era.slug)}
            open={openSlug === era.slug}
            onToggle={() => setOpenSlug((cur) => (cur === era.slug ? null : era.slug))}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function EraCard({
  era,
  items,
  open,
  onToggle,
}: {
  era: Era;
  items: MonthItem[];
  open: boolean;
  onToggle: () => void;
}) {
  const t = era.theme;
  const sorted = [...items].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}>
      <Pressable onPress={onToggle} style={[styles.header, { backgroundColor: t.accent }]}>
        <Text style={styles.eyebrow}>{t.eyebrow}</Text>
        <Text style={styles.album}>{era.album}</Text>
        <Text style={styles.range}>
          {rangeLabel(era.startDate, era.endDate)} · {items.length} moment{items.length === 1 ? '' : 's'}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {sorted.length === 0 ? (
            <Text style={[styles.itemSnippet, { color: t.inkSoft }]}>No moments yet.</Text>
          ) : (
            sorted.map((it) => (
              <View key={it.id} style={[styles.item, { borderColor: t.line }]}>
                <Text style={[styles.itemMeta, { color: t.inkSoft }]}>
                  {monthLabel(it.year, it.month)} · {it.category}
                </Text>
                <Text style={[styles.itemTitle, { color: t.ink }]}>{it.title}</Text>
                {it.snippet ? (
                  <Text style={[styles.itemSnippet, { color: t.inkSoft }]}>{it.snippet}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0b0b0f' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 48 },
  h1: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 16, marginTop: 8 },
  loading: { color: '#aaa', marginTop: 10 },
  errTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errBody: { color: '#f88', textAlign: 'center' },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  header: { padding: 16 },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  album: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  range: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  body: { padding: 12 },
  item: { borderTopWidth: 1, paddingVertical: 10 },
  itemMeta: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  itemSnippet: { fontSize: 13, marginTop: 3, lineHeight: 18 },
});
