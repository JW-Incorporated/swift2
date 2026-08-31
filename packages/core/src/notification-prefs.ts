// Notifications Phase 1 — prefs data access (NOTIFICATIONS_SPEC.md §8/§9,
// NOTIFICATIONS_PLAN.md Phase 1). Server-only: every caller here is
// `GET/PUT /api/devices/:id/prefs`, running with the Supabase SERVICE ROLE
// key — `devices` and `notification_prefs` both ship RLS enabled with no
// anon/authenticated policies (service_role bypasses RLS by role
// attribute). Same convention as `devices.ts`: takes a `SupabaseClient`
// directly so it's unit-testable against a fake client.
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_CADENCE,
  SETTINGS_CATEGORY_DEFS,
  type AnyNotificationCategory,
  type DeviceNotificationSettings,
  type DevicePrefsResponse,
  type NotificationCadence,
  type NotificationPref,
  type SettingsCategoryDef,
} from '@swift2/shared';

export interface DeviceSettingsRow {
  id: string;
  master_enabled: boolean;
  snooze_until: string | null;
  daily_cap: number;
  quiet_start: number;
  quiet_end: number;
  digest_hour: number;
}

export interface NotificationPrefRow {
  device_id: string;
  category: string;
  cadence: string;
}

const SETTINGS_SELECT =
  'id,master_enabled,snooze_until,daily_cap,quiet_start,quiet_end,digest_hour';

function toDeviceSettings(row: DeviceSettingsRow): DeviceNotificationSettings {
  return {
    masterEnabled: row.master_enabled,
    snoozeUntil: row.snooze_until,
    dailyCap: row.daily_cap,
    quietStart: row.quiet_start,
    quietEnd: row.quiet_end,
    digestHour: row.digest_hour,
  };
}

/**
 * Batch read (spec's "GET ... batch read"): the device's settings columns
 * (from `devices`, Phase 0) plus every category's cadence. A category with
 * no persisted `notification_prefs` row yet (fresh device, or one that never
 * touched that particular pill) synthesizes in from `DEFAULT_CADENCE` rather
 * than being omitted — the settings screen always has a value to show every
 * row, and "hasn't been touched" is indistinguishable from "explicitly set
 * to the default" until the user changes it (matches spec §4's footnote:
 * defaults only *apply* after opt-in, but the UI still needs something to
 * render before that opt-in event exists as a persisted row).
 *
 * Returns `null` if the device doesn't exist — the route maps that to 404.
 */
export async function getDevicePrefs(
  db: SupabaseClient,
  deviceId: string,
): Promise<DevicePrefsResponse | null> {
  const { data: deviceRow, error: deviceErr } = await db
    .from('devices')
    .select(SETTINGS_SELECT)
    .eq('id', deviceId)
    .maybeSingle();

  if (deviceErr) throw new Error(`getDevicePrefs: ${deviceErr.message}`);
  if (!deviceRow) return null;

  const { data: prefRows, error: prefsErr } = await db
    .from('notification_prefs')
    .select('device_id,category,cadence')
    .eq('device_id', deviceId);

  if (prefsErr) throw new Error(`getDevicePrefs: ${prefsErr.message}`);

  const persisted = new Map<string, NotificationCadence>(
    (prefRows ?? []).map((r: NotificationPrefRow) => [
      r.category,
      r.cadence as NotificationCadence,
    ]),
  );

  const prefs: NotificationPref[] = SETTINGS_CATEGORY_DEFS.map((def: SettingsCategoryDef) => ({
    category: def.id,
    cadence: persisted.get(def.id) ?? DEFAULT_CADENCE[def.id],
  }));

  return {
    settings: toDeviceSettings(deviceRow as DeviceSettingsRow),
    prefs,
  };
}

/**
 * Batch write (spec's "GET/PUT ... batch write"). Applies whichever of
 * `settings`/`prefs` the caller sent — a single pill tap sends one prefs
 * entry and no settings patch; the master switch sends one settings field
 * and no prefs. Both writes are instant-apply, no partial/staged state
 * (spec §8: "changes apply instantly — no save button").
 *
 * Settings columns update `devices` directly (same table Phase 0's
 * `upsertDevice` writes, different columns — the register route never
 * touches these, so there's no write-order hazard between the two APIs).
 * Prefs upsert by `(device_id, category)`, the migration's primary key.
 *
 * Returns the same shape as `getDevicePrefs` so a PUT response can drive an
 * instant re-render without a follow-up GET.
 */
export async function updateDevicePrefs(
  db: SupabaseClient,
  deviceId: string,
  input: { settings?: Partial<DeviceNotificationSettings>; prefs?: NotificationPref[] },
): Promise<DevicePrefsResponse | null> {
  if (input.settings && Object.keys(input.settings).length > 0) {
    const patch: Record<string, unknown> = {};
    if (input.settings.masterEnabled !== undefined)
      patch.master_enabled = input.settings.masterEnabled;
    if (input.settings.snoozeUntil !== undefined) patch.snooze_until = input.settings.snoozeUntil;
    if (input.settings.dailyCap !== undefined) patch.daily_cap = input.settings.dailyCap;
    if (input.settings.quietStart !== undefined) patch.quiet_start = input.settings.quietStart;
    if (input.settings.quietEnd !== undefined) patch.quiet_end = input.settings.quietEnd;
    if (input.settings.digestHour !== undefined) patch.digest_hour = input.settings.digestHour;

    const { error } = await db.from('devices').update(patch).eq('id', deviceId);
    if (error) throw new Error(`updateDevicePrefs: ${error.message}`);
  }

  if (input.prefs && input.prefs.length > 0) {
    const rows = input.prefs.map((p) => ({
      device_id: deviceId,
      category: p.category,
      cadence: p.cadence,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await db
      .from('notification_prefs')
      .upsert(rows, { onConflict: 'device_id,category' });
    if (error) throw new Error(`updateDevicePrefs: ${error.message}`);
  }

  return getDevicePrefs(db, deviceId);
}

export type { AnyNotificationCategory };
