// Exact, bounded native-side projection of a prefs response (DevicePrefsResponse) before it crosses the bridge:
// only the documented keys survive, so an extra field (a future or compromised server adding `deviceId`,
// `pushToken`, ...) never reaches the DOM. Throws on a malformed shape; the handler maps that to its fixed failure.
import { isAnyNotificationCategory, isNotificationCadence } from '@swift2/shared';
import type { NotificationPrefsState } from '@swift2/ui';

const MAX_PREF_ROWS = 128;
const rec = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): number => {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('bad number');
  return x;
};

export function projectPrefs(value: unknown): NotificationPrefsState {
  if (!rec(value) || !rec(value.settings) || !Array.isArray(value.prefs) || value.prefs.length > MAX_PREF_ROWS) throw new Error('bad prefs');
  const s = value.settings;
  if (typeof s.masterEnabled !== 'boolean') throw new Error('bad settings');
  if (s.snoozeUntil !== null && (typeof s.snoozeUntil !== 'string' || s.snoozeUntil.length > 64)) throw new Error('bad settings');
  return {
    settings: {
      masterEnabled: s.masterEnabled,
      snoozeUntil: s.snoozeUntil,
      dailyCap: num(s.dailyCap),
      quietStart: num(s.quietStart),
      quietEnd: num(s.quietEnd),
      digestHour: num(s.digestHour),
    },
    prefs: value.prefs.map((p) => {
      if (!rec(p) || typeof p.category !== 'string' || !isAnyNotificationCategory(p.category) || typeof p.cadence !== 'string' || !isNotificationCadence(p.cadence)) {
        throw new Error('bad pref row');
      }
      return { category: p.category, cadence: p.cadence };
    }),
  };
}
