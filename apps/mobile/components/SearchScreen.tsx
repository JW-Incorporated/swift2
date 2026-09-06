// OS-038 — native search screen: a full-screen results list over the
// same in-memory index the web's SearchOverlay queries, built from the
// same ranking engine (`@swift2/experience`'s `search-index.ts`, OS-025)
// via `lib/search-data.ts`'s `getSearchIndex()`. Native equivalent of
// `apps/web/components/longlive/SearchOverlay.tsx` — scoped to the doc
// types the native app actually renders (era + moment; see
// `search-data.ts`'s header doc) and to a plain full-screen list rather
// than the web's command-palette-over-content treatment, since there is no
// "content underneath" to float over in the current native shell.
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { flattenGroups, getEra, searchDocs, type SearchDoc, type SearchResult } from '@swift2/experience';
import { getSearchIndex } from '../lib/search-data';
import { eraColors } from '../lib/theme';

const DEBOUNCE_MS = 120;

export function SearchScreen({
  onClose,
  onOpenMoment,
  onOpenEra,
}: {
  onClose: () => void;
  /** OS-033 (native moment detail) owns opening a moment's full sheet — see EraStreamScreen.tsx's same documented-no-op pattern. */
  onOpenMoment: (itemId: string) => void;
  onOpenEra: (eraId: string) => void;
}) {
  const [index, setIndex] = useState<SearchDoc[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSearchIndex()
      .then((docs) => {
        if (!cancelled) setIndex(docs);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const results: SearchResult[] = useMemo(() => {
    if (!index || !debounced.trim()) return [];
    return flattenGroups(searchDocs(index, debounced));
  }, [index, debounced]);

  function select(doc: SearchDoc) {
    if (doc.target.kind === 'moment') onOpenMoment(doc.target.itemId);
    else if (doc.target.kind === 'era') onOpenEra(doc.target.eraId);
    // Other target kinds (track/theory-guide/trail/thread/video) have no
    // native home yet — see search-data.ts's header doc; unreachable today
    // since buildSearchIndex only emits era/moment docs.
  }

  return (
    <View style={styles.fill}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the archive…"
          placeholderTextColor={eraColors.inkSoft}
          autoCorrect={false}
          autoFocus
          style={styles.input}
        />
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close search" style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      {!index && !loadError && (
        <View style={styles.centered}>
          <ActivityIndicator color={eraColors.accent} />
        </View>
      )}
      {loadError && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn&apos;t load search: {loadError}</Text>
        </View>
      )}
      {index && debounced.trim() === '' && (
        <View style={styles.centered}>
          <Text style={styles.hintText}>Moments and eras — the archive so far.</Text>
        </View>
      )}
      {index && debounced.trim() !== '' && results.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.hintText}>No matches for &quot;{debounced.trim()}&quot;.</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(r) => r.doc.key}
        renderItem={({ item }) => (
          <Pressable onPress={() => select(item.doc)} style={styles.row}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.doc.title}
            </Text>
            <Text style={styles.rowSnippet} numberOfLines={2}>
              {item.doc.snippet}
            </Text>
            {item.doc.eraId && (
              <Text style={styles.rowEra}>{getEra(item.doc.eraId).shortName}</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: eraColors.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: eraColors.line,
  },
  input: {
    flex: 1,
    color: eraColors.ink,
    fontSize: 16,
    paddingVertical: 6,
  },
  closeBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  closeText: { color: eraColors.accent, fontSize: 14, fontWeight: '600' },
  centered: { paddingVertical: 32, alignItems: 'center', paddingHorizontal: 24 },
  hintText: { color: eraColors.inkSoft, fontSize: 13, textAlign: 'center' },
  errorText: { color: eraColors.inkSoft, fontSize: 13, textAlign: 'center' },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: eraColors.line,
    gap: 2,
  },
  rowTitle: { color: eraColors.ink, fontSize: 15, fontWeight: '600' },
  rowSnippet: { color: eraColors.inkSoft, fontSize: 13 },
  rowEra: { color: eraColors.accent2, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
});
