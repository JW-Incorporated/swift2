// OS-037 — native merch directory screen. Native equivalent of the web's
// `MerchSection.tsx` (three sections: Official Shop, Fan Made, Her Style/
// shop-the-look), reading the same published bundle's `MerchCatalogue` via
// `lib/merch-data.ts`'s `loadMerchCatalogue()` — the bundle-backed mirror
// of `MERCH_CATALOGUE` the web imports from `@swift2/content-enrichment`.
//
// Scope for this card: the three catalogue sections as a flat, readable
// list — no era-filter/style-section machinery (`MerchStyleSection.tsx`,
// `merch-filters.ts`) and no marquee hero (`MerchMarquee.tsx`); those are
// documented web-only refinements layered on top of the same three-bucket
// data this screen already surfaces completely. Reachable via
// `?mode=merch` (routes.ts's `merch` flag, off by default per D3).
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MerchCatalogue, MerchItem } from '@swift2/content';
import { loadMerchCatalogue } from '../lib/merch-data';
import { buildShopUrl } from '../lib/shop';
import { eraColors } from '../lib/theme';

interface Row {
  key: string;
  kind: 'header' | 'item' | 'empty';
  label?: string;
  count?: number;
  item?: MerchItem;
  emptyMessage?: string;
}

const SECTIONS: readonly { key: keyof MerchCatalogue; label: string; emptyMessage: string }[] = [
  { key: 'officialStore', label: 'Official Shop', emptyMessage: 'Nothing in the official shop yet.' },
  { key: 'fanMade', label: 'Fan Made', emptyMessage: 'No fan-made finds yet.' },
  { key: 'shopTheLook', label: 'Her Style', emptyMessage: 'No shop-the-look items yet.' },
];

function buildRows(catalogue: MerchCatalogue): Row[] {
  const rows: Row[] = [];
  for (const section of SECTIONS) {
    const items = catalogue[section.key];
    rows.push({ key: `header-${section.key}`, kind: 'header', label: section.label, count: items.length });
    if (items.length === 0) {
      rows.push({ key: `empty-${section.key}`, kind: 'empty', emptyMessage: section.emptyMessage });
      continue;
    }
    items.forEach((item, index) => {
      rows.push({ key: `${section.key}-${index}-${item.item}`, kind: 'item', item });
    });
  }
  return rows;
}

function MerchRow({ item }: { item: MerchItem }) {
  return (
    <Pressable style={styles.card} onPress={() => Linking.openURL(buildShopUrl(item)).catch(() => {})}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardBrand} numberOfLines={1}>
          {item.brand}
        </Text>
        <Text style={styles.cardItem} numberOfLines={2}>
          {item.item}
        </Text>
        <View style={styles.cardMetaRow}>
          {item.price && <Text style={styles.cardPrice}>{item.price}</Text>}
          {item.inStock === false && <Text style={styles.cardOutOfStock}>Sold out</Text>}
          {item.isAlternative === true && <Text style={styles.cardSimilar}>Similar style</Text>}
        </View>
      </View>
    </Pressable>
  );
}

export function MerchScreen() {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; catalogue: MerchCatalogue }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadMerchCatalogue()
      .then((catalogue) => {
        if (!cancelled) setState({ status: 'ready', catalogue });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.fill}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Merch</Text>
        <Text style={styles.topBarSubtitle}>Shop the look, the official store, and fan finds</Text>
      </View>
      {state.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator color={eraColors.accent} />
        </View>
      )}
      {state.status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn&apos;t load merch: {state.message}</Text>
        </View>
      )}
      {state.status === 'ready' && (
        <FlatList
          data={buildRows(state.catalogue)}
          keyExtractor={(row) => row.key}
          contentContainerStyle={styles.content}
          renderItem={({ item: row }) => {
            if (row.kind === 'header') {
              return (
                <Text style={styles.sectionHeader}>
                  {row.label} · {row.count}
                </Text>
              );
            }
            if (row.kind === 'empty') {
              return <Text style={styles.emptyText}>{row.emptyMessage}</Text>;
            }
            return <MerchRow item={row.item!} />;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: eraColors.bg },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: eraColors.line,
  },
  topBarTitle: { color: eraColors.ink, fontSize: 22, fontWeight: '700' },
  topBarSubtitle: { color: eraColors.inkSoft, fontSize: 13, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: eraColors.inkSoft, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  sectionHeader: {
    color: eraColors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: { color: eraColors.inkSoft, fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: eraColors.surface,
    borderColor: eraColors.line,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardImage: { width: 88, height: 88 },
  cardImagePlaceholder: { backgroundColor: eraColors.surface2 },
  cardBody: { flex: 1, padding: 10, justifyContent: 'center', gap: 2 },
  cardBrand: { color: eraColors.inkSoft, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  cardItem: { color: eraColors.ink, fontSize: 14, fontWeight: '600' },
  cardMetaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cardPrice: { color: eraColors.accent, fontSize: 13, fontWeight: '600' },
  cardOutOfStock: { color: eraColors.inkSoft, fontSize: 12 },
  cardSimilar: { color: eraColors.accent2, fontSize: 12 },
});
