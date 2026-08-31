// Notifications Phase 1 (NOTIFICATIONS_SPEC.md §8, NOTIFICATIONS_PLAN.md
// Phase 1) — the full notification settings screen. Layout top to bottom
// per spec §8: master switch → snooze buttons → daily limit → quiet hours +
// digest time → category list (grouped News/Merch/Community/Fun), each row
// name + one-line description + preview text + cadence pills.
//
// Every control writes through `prefs-client.ts` on change and applies the
// server's round-tripped response — no save button, no local-only staged
// state (spec §8: "changes apply instantly"). A control's optimistic value
// is what's rendered immediately; the round-trip reconciles it if the
// server disagrees (e.g. a concurrent write from another open settings
// screen instance, which anonymous single-device usage makes rare but not
// impossible).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  NOTIFICATION_GROUPS,
  SETTINGS_CATEGORY_DEFS,
  cadenceVariantFor,
  type AnyNotificationCategory,
  type DevicePrefsResponse,
  type NotificationCadence,
  type NotificationGroup,
} from '@swift2/shared';
import { fetchDevicePrefs, setCategoryCadence, setDeviceSetting } from '../lib/prefs-client';
import { CadencePills } from './CadencePills';

const SNOOZE_24H_MS = 24 * 60 * 60 * 1000;
const SNOOZE_1WK_MS = 7 * 24 * 60 * 60 * 1000;

function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? 'AM' : 'PM';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${period}`;
}

/** Categories grouped in spec §4 table order within each group, and groups
 * in spec §8's stated order (News / Merch / Community / Fun). */
function groupedCategories(): Record<NotificationGroup, (typeof SETTINGS_CATEGORY_DEFS)[number][]> {
  const groups: Record<NotificationGroup, (typeof SETTINGS_CATEGORY_DEFS)[number][]> = {
    News: [],
    Merch: [],
    Community: [],
    Fun: [],
  };
  for (const def of SETTINGS_CATEGORY_DEFS) {
    groups[def.group].push(def);
  }
  return groups;
}

export function NotificationSettingsScreen({
  onClose,
  onOpenInbox,
}: {
  onClose: () => void;
  /** Notifications Phase 3 (spec §8): the inbox is reachable from here too
   * — not just its own entry point — so "Off" categories are never a dead
   * end from the screen where a user just muted something. Optional so
   * this component still renders standalone (e.g. future tests) without a
   * wired-up inbox route. */
  onOpenInbox?: () => void;
}) {
  const [state, setState] = useState<DevicePrefsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchDevicePrefs()
      .then((res) => alive && setState(res))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    Notifications.getPermissionsAsync()
      .then((p) => alive && setPermissionDenied(p.status === 'denied'))
      .catch(() => {
        /* permission status unavailable (simulator) — banner just stays hidden */
      });
    return () => {
      alive = false;
    };
  }, []);

  const withPending = useCallback(async (key: string, run: () => Promise<DevicePrefsResponse>) => {
    setPendingKeys((prev) => new Set(prev).add(key));
    try {
      const result = await run();
      setState(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const groups = useMemo(groupedCategories, []);

  if (!state) {
    return (
      <View style={[styles.fill, styles.center]}>
        {error ? <Text style={styles.errText}>{error}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  const { settings, prefs } = state;
  const prefByCategory = new Map(prefs.map((p) => [p.category, p.cadence]));

  function onCadenceChange(category: AnyNotificationCategory, cadence: NotificationCadence) {
    withPending(`cadence:${category}`, () => setCategoryCadence({ category, cadence }));
  }

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          {onOpenInbox && (
            <Pressable onPress={onOpenInbox} accessibilityLabel="Open inbox" hitSlop={12}>
              <Text style={styles.inboxLink}>Inbox</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close notification settings"
            hitSlop={12}
          >
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>
      </View>

      {permissionDenied && (
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText}>
            Notifications are off in system settings. Turn them on to get pushes.
          </Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            accessibilityLabel="Open system notification settings"
          >
            <Text style={styles.bannerLink}>Open settings →</Text>
          </Pressable>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errText}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Master switch */}
        <Row
          label="Notifications"
          description="Turn all Long Live notifications on or off."
          disabled={pendingKeys.has('settings:masterEnabled')}
        >
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: settings.masterEnabled }}
            onPress={() =>
              withPending('settings:masterEnabled', () =>
                setDeviceSetting({ masterEnabled: !settings.masterEnabled }),
              )
            }
            style={[styles.toggle, settings.masterEnabled && styles.toggleOn]}
          >
            <View style={[styles.toggleKnob, settings.masterEnabled && styles.toggleKnobOn]} />
          </Pressable>
        </Row>

        {/* Snooze */}
        <Row label="Pause all" description="Snooze every notification for a while.">
          <View style={styles.snoozeRow}>
            <Pressable
              disabled={pendingKeys.has('settings:snooze24h')}
              onPress={() =>
                withPending('settings:snooze24h', () =>
                  setDeviceSetting({
                    snoozeUntil: new Date(Date.now() + SNOOZE_24H_MS).toISOString(),
                  }),
                )
              }
              style={styles.snoozeBtn}
            >
              <Text style={styles.snoozeBtnText}>24h</Text>
            </Pressable>
            <Pressable
              disabled={pendingKeys.has('settings:snooze1wk')}
              onPress={() =>
                withPending('settings:snooze1wk', () =>
                  setDeviceSetting({
                    snoozeUntil: new Date(Date.now() + SNOOZE_1WK_MS).toISOString(),
                  }),
                )
              }
              style={styles.snoozeBtn}
            >
              <Text style={styles.snoozeBtnText}>1 week</Text>
            </Pressable>
            {settings.snoozeUntil && (
              <Pressable
                disabled={pendingKeys.has('settings:snoozeClear')}
                onPress={() =>
                  withPending('settings:snoozeClear', () => setDeviceSetting({ snoozeUntil: null }))
                }
                style={styles.snoozeBtn}
              >
                <Text style={styles.snoozeBtnText}>Clear</Text>
              </Pressable>
            )}
          </View>
        </Row>

        {/* Daily limit */}
        <Row label="Daily limit" description="Max instant pushes per day (1–5).">
          <Stepper
            value={settings.dailyCap}
            min={1}
            max={5}
            disabled={pendingKeys.has('settings:dailyCap')}
            onChange={(v) =>
              withPending('settings:dailyCap', () => setDeviceSetting({ dailyCap: v }))
            }
          />
        </Row>

        {/* Quiet hours */}
        <Row
          label="Quiet hours"
          description={`${formatHour(settings.quietStart)} \u2013 ${formatHour(settings.quietEnd)}, device-local.`}
        >
          <View style={styles.hourRow}>
            <Stepper
              value={settings.quietStart}
              min={0}
              max={23}
              disabled={pendingKeys.has('settings:quietStart')}
              onChange={(v) =>
                withPending('settings:quietStart', () => setDeviceSetting({ quietStart: v }))
              }
            />
            <Stepper
              value={settings.quietEnd}
              min={0}
              max={23}
              disabled={pendingKeys.has('settings:quietEnd')}
              onChange={(v) =>
                withPending('settings:quietEnd', () => setDeviceSetting({ quietEnd: v }))
              }
            />
          </View>
        </Row>

        {/* Digest time */}
        <Row
          label="Digest time"
          description={`Daily/weekly digests arrive around ${formatHour(settings.digestHour)}.`}
        >
          <Stepper
            value={settings.digestHour}
            min={0}
            max={23}
            disabled={pendingKeys.has('settings:digestHour')}
            onChange={(v) =>
              withPending('settings:digestHour', () => setDeviceSetting({ digestHour: v }))
            }
          />
        </Row>

        {/* Category groups */}
        {NOTIFICATION_GROUPS.map((group) => (
          <View key={group} style={styles.group}>
            <Text style={styles.groupTitle}>{group}</Text>
            {groups[group].map((def) => {
              const cadence = prefByCategory.get(def.id) ?? 'off';
              return (
                <View key={def.id} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{def.name}</Text>
                  <Text style={styles.categoryDesc}>{def.description}</Text>
                  <Text style={styles.categoryPreview}>{def.previewText}</Text>
                  <CadencePills
                    variant={cadenceVariantFor(def.id)}
                    value={cadence}
                    disabled={pendingKeys.has(`cadence:${def.id}`)}
                    onChange={(c) => onCadenceChange(def.id, c)}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  description,
  children,
  disabled,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        disabled={disabled || value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepperBtn}
        accessibilityLabel="Decrease"
      >
        <Text style={styles.stepperBtnText}>–</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        disabled={disabled || value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.stepperBtn}
        accessibilityLabel="Increase"
      >
        <Text style={styles.stepperBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    alignItems: 'center',
    borderBottomColor: '#1c1c22',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 54, default: 24 }),
    paddingBottom: 12,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  close: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 16 },
  inboxLink: { color: '#999', fontSize: 15, fontWeight: '600' },
  banner: {
    backgroundColor: '#3a2a10',
    gap: 4,
    padding: 12,
  },
  bannerText: { color: '#f2c744', fontSize: 13 },
  bannerLink: { color: '#f2c744', fontSize: 13, fontWeight: '700' },
  errorBanner: { backgroundColor: '#2a1010', padding: 12 },
  errText: { color: '#f88', fontSize: 13 },
  scroll: { paddingBottom: 56 },
  row: {
    alignItems: 'center',
    borderBottomColor: '#1c1c22',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowDisabled: { opacity: 0.6 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowDesc: { color: '#999', fontSize: 12 },
  toggle: {
    backgroundColor: '#2a2a33',
    borderRadius: 16,
    height: 28,
    justifyContent: 'center',
    padding: 2,
    width: 48,
  },
  toggleOn: { backgroundColor: '#f2c744' },
  toggleKnob: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
  snoozeRow: { flexDirection: 'row', gap: 8 },
  snoozeBtn: {
    borderColor: '#2a2a33',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  snoozeBtnText: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  stepperBtn: {
    alignItems: 'center',
    backgroundColor: '#1c1c22',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepperBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepperValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  hourRow: { flexDirection: 'row', gap: 12 },
  group: { paddingTop: 20 },
  groupTitle: {
    color: '#f2c744',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  categoryRow: {
    borderBottomColor: '#1c1c22',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  categoryDesc: { color: '#999', fontSize: 12 },
  categoryPreview: { color: '#666', fontSize: 12, fontStyle: 'italic' },
});
