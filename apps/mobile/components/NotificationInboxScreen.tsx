// Notifications Phase 3 (NOTIFICATIONS_SPEC.md §8) — the in-app inbox
// screen. "A chronological feed of everything notification-worthy
// regardless of push settings. Makes 'Off' feel safe — you can always
// catch up." Read-only list, deep-links out via resolveDeepLink (same
// mapping the notification-tap handler uses) so tapping an inbox row and
// tapping the original push land in the same place.
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SETTINGS_CATEGORY_DEFS, type AnyNotificationCategory } from '@swift2/shared';
import { fetchInbox, type InboxEvent } from '../lib/inbox-client';

const CATEGORY_NAME: Partial<Record<AnyNotificationCategory, string>> = Object.fromEntries(
  SETTINGS_CATEGORY_DEFS.map((def) => [def.id, def.name]),
);

function categoryLabel(category: string): string {
  return CATEGORY_NAME[category as AnyNotificationCategory] ?? category.replace(/_/g, ' ');
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export interface NotificationInboxScreenProps {
  onClose: () => void;
  /** Optional — mirrors the notification-tap deep-link flow so tapping an
   * inbox row behaves the same as tapping the original push. Omit in
   * contexts where navigation isn't wired up yet; the row still renders. */
  onOpenItem?: (event: InboxEvent) => void;
}

export function NotificationInboxScreen({ onClose, onOpenItem }: NotificationInboxScreenProps) {
  const [events, setEvents] = useState<InboxEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchInbox();
      setEvents(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
          <Text style={styles.closeText}>Done</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errText}>{error}</Text>
        </View>
      )}

      {events === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : events && events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nothing here yet — check back soon.</Text>
        </View>
      ) : (
        <FlatList
          data={events ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOpenItem?.(item)}
              accessibilityRole="button"
              style={styles.row}
            >
              <Text style={styles.rowCategory}>{categoryLabel(item.category)}</Text>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowBody}>{item.body}</Text>
              <Text style={styles.rowTime}>{formatTimestamp(item.availableAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeText: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  errorBanner: { backgroundColor: '#2a1010', borderRadius: 8, margin: 16, padding: 12 },
  errText: { color: '#f88', fontSize: 13 },
  row: {
    borderBottomColor: '#1c1c22',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowCategory: {
    color: '#f2c744',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rowBody: { color: '#aaa', fontSize: 13 },
  rowTime: { color: '#666', fontSize: 11, marginTop: 2 },
});
