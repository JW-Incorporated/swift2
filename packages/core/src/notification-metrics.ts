// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §11) —
// open-tracking write path + the internal metrics dashboard's query/compute
// layer.
//
// Same split as every prior phase: PURE compute functions (this module's
// `computeMetrics`/`isMuteRateFlagged` etc., zero I/O, directly
// unit-testable with hand-built fixtures) vs. DB-touching orchestration
// (`loadMetrics`, `markDeliveryOpened`).
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Open tracking: notification-open callback -> deliveries.opened_at
// ---------------------------------------------------------------------------

export type MarkOpenedResult =
  | { ok: true; alreadyOpened: boolean }
  | { ok: false; error: 'not_found' | 'db_error'; message?: string };

/**
 * Records a notification open by its opaque `delivery_token` (embedded in
 * every push payload at send time — see notification-sender.ts /
 * notification-web-push.ts). Idempotent: a delivery already marked opened
 * is reported back as `alreadyOpened: true` without a second write — the
 * mobile deep-link handler and the web service worker's
 * `notificationclick` listener can both fire this on the same tap without
 * double-processing, and the FIRST open timestamp is preserved rather than
 * overwritten by a later duplicate call.
 */
export async function markDeliveryOpened(
  db: SupabaseClient,
  deliveryToken: string,
  now: Date = new Date(),
): Promise<MarkOpenedResult> {
  const { data: existing, error: lookupError } = await db
    .from('deliveries')
    .select('id,opened_at')
    .eq('delivery_token', deliveryToken)
    .maybeSingle();
  if (lookupError) {
    return { ok: false, error: 'db_error', message: lookupError.message };
  }
  if (!existing) {
    return { ok: false, error: 'not_found' };
  }
  if (existing.opened_at) {
    return { ok: true, alreadyOpened: true };
  }

  const { error: updateError } = await db
    .from('deliveries')
    .update({ opened_at: now.toISOString() })
    .eq('delivery_token', deliveryToken)
    .is('opened_at', null); // guards a race between two simultaneous calls
  if (updateError) {
    return { ok: false, error: 'db_error', message: updateError.message };
  }
  return { ok: true, alreadyOpened: false };
}

// ---------------------------------------------------------------------------
// Metrics dashboard — spec §11: "permission opt-in rate... notification
// open rate by category... category mute rate within 1h of a push,
// master-switch-off rate."
// ---------------------------------------------------------------------------

/** spec §11's guardrail: "Any push type whose mute rate exceeds ~2% gets
 * reviewed." Not user-adjustable — a fixed review threshold, same posture
 * as the governor's HARD_CEILING_PER_DAY. */
export const MUTE_RATE_FLAG_THRESHOLD = 0.02;

export interface DeviceMetricsRow {
  id: string;
  masterEnabled: boolean;
  pushToken: string | null;
}

export interface DeliveryMetricsRow {
  deviceId: string;
  category: string | null;
  sentAt: string;
  openedAt: string | null;
}

export interface PrefUpdateRow {
  deviceId: string;
  category: string;
  cadence: string;
  updatedAt: string;
}

export interface CategoryOpenRate {
  category: string;
  sent: number;
  opened: number;
  /** null when `sent` is 0 — never fabricate a 0% rate for a category with
   * no delivery history yet. */
  openRate: number | null;
}

export interface CategoryMuteRate {
  category: string;
  sent: number;
  mutedWithin1h: number;
  muteRate: number | null;
  /** spec §11: "Any push type whose mute rate exceeds ~2% gets reviewed." */
  flagged: boolean;
}

export interface NotificationMetrics {
  /** Devices that have ever registered a push token, over every registered
   * device. NOTE (documented, not hidden): this is a PROXY for spec §11's
   * true opt-in metric ("permission opt-in rate... of pre-permission
   * screen viewers") — this app has no event for "viewed the pre-permission
   * screen but declined," so the dashboard reports the metric it CAN
   * measure honestly (devices with a live push token / all devices) rather
   * than fabricating the screen-view denominator. See the dashboard page's
   * own copy for the same caveat surfaced to whoever reads it. */
  optInRate: number | null;
  totalDevices: number;
  devicesWithToken: number;
  openRateByCategory: CategoryOpenRate[];
  muteRateByCategory: CategoryMuteRate[];
  /** Fraction of devices with `master_enabled = false`. */
  masterOffRate: number | null;
  devicesMasterOff: number;
  /** Every category currently over MUTE_RATE_FLAG_THRESHOLD — the "flag/
   * report" this phase's scope line asks for, pre-filtered so a caller
   * doesn't have to re-derive it from muteRateByCategory. */
  flaggedCategories: string[];
  generatedAt: string;
  /** True when there was enough delivery history to compute anything
   * meaningful — a brand-new deployment with zero devices/deliveries
   * renders an honest "no data yet" state instead of misleading zeros. */
  hasData: boolean;
}

/** Pure compute: open rate per category from already-loaded delivery rows.
 * Categories with zero deliveries are omitted entirely (not rendered as a
 * fabricated 0%) — the caller decides whether to show "no data" for a
 * category with a live producer but no sends yet. */
export function computeOpenRateByCategory(
  deliveries: readonly DeliveryMetricsRow[],
): CategoryOpenRate[] {
  const byCategory = new Map<string, { sent: number; opened: number }>();
  for (const d of deliveries) {
    const category = d.category ?? 'uncategorized';
    const bucket = byCategory.get(category) ?? { sent: 0, opened: 0 };
    bucket.sent++;
    if (d.openedAt) bucket.opened++;
    byCategory.set(category, bucket);
  }
  return [...byCategory.entries()]
    .map(([category, { sent, opened }]) => ({
      category,
      sent,
      opened,
      openRate: sent > 0 ? opened / sent : null,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Pure compute: for every (device, category) delivery, was that category
 * muted (a `notification_prefs` row for the SAME device+category flipped
 * to `cadence = 'off'`) within 1 hour after the send? spec §11's
 * guardrail metric. A pref row's `updatedAt` after `sentAt` and within the
 * 1h window counts; a pref that was already `off` before the send (no NEW
 * mute event caused by this specific push) does not — this deliberately
 * measures REACTION to a push, not steady-state opt-out.
 */
export function computeMuteRateByCategory(
  deliveries: readonly DeliveryMetricsRow[],
  prefUpdates: readonly PrefUpdateRow[],
): CategoryMuteRate[] {
  // Index mute events by (deviceId, category) -> sorted updatedAt list, so
  // each delivery can binary-search-free scan the (typically tiny) list of
  // mute timestamps for that pair.
  const muteEventsByKey = new Map<string, number[]>();
  for (const p of prefUpdates) {
    if (p.cadence !== 'off') continue;
    const key = `${p.deviceId}:${p.category}`;
    const list = muteEventsByKey.get(key);
    const t = new Date(p.updatedAt).getTime();
    if (!Number.isFinite(t)) continue;
    if (list) list.push(t);
    else muteEventsByKey.set(key, [t]);
  }

  const byCategory = new Map<string, { sent: number; muted: number }>();
  for (const d of deliveries) {
    const category = d.category ?? 'uncategorized';
    const bucket = byCategory.get(category) ?? { sent: 0, muted: 0 };
    bucket.sent++;
    const sentAtMs = new Date(d.sentAt).getTime();
    const muteTimes = muteEventsByKey.get(`${d.deviceId}:${category}`) ?? [];
    const mutedWithinWindow = muteTimes.some((t) => t >= sentAtMs && t - sentAtMs <= ONE_HOUR_MS);
    if (mutedWithinWindow) bucket.muted++;
    byCategory.set(category, bucket);
  }

  return [...byCategory.entries()]
    .map(([category, { sent, muted }]) => {
      const muteRate = sent > 0 ? muted / sent : null;
      return {
        category,
        sent,
        mutedWithin1h: muted,
        muteRate,
        flagged: muteRate !== null && muteRate > MUTE_RATE_FLAG_THRESHOLD,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}

/** Pure compute: assembles the full dashboard payload from already-loaded
 * rows — the DB orchestration (`loadMetrics`) below is a thin loader that
 * hands rows to this function, keeping the actual math testable without a
 * database. */
export function computeMetrics(
  devices: readonly DeviceMetricsRow[],
  deliveries: readonly DeliveryMetricsRow[],
  prefUpdates: readonly PrefUpdateRow[],
  now: Date = new Date(),
): NotificationMetrics {
  const totalDevices = devices.length;
  const devicesWithToken = devices.filter((d) => Boolean(d.pushToken)).length;
  const devicesMasterOff = devices.filter((d) => !d.masterEnabled).length;

  const openRateByCategory = computeOpenRateByCategory(deliveries);
  const muteRateByCategory = computeMuteRateByCategory(deliveries, prefUpdates);
  const flaggedCategories = muteRateByCategory.filter((c) => c.flagged).map((c) => c.category);

  return {
    optInRate: totalDevices > 0 ? devicesWithToken / totalDevices : null,
    totalDevices,
    devicesWithToken,
    openRateByCategory,
    muteRateByCategory,
    masterOffRate: totalDevices > 0 ? devicesMasterOff / totalDevices : null,
    devicesMasterOff,
    flaggedCategories,
    generatedAt: now.toISOString(),
    hasData: totalDevices > 0,
  };
}

interface DeviceRow {
  id: string;
  master_enabled: boolean;
  push_token: string | null;
}

interface DeliveryRow {
  device_id: string;
  category: string | null;
  sent_at: string;
  opened_at: string | null;
}

interface PrefRow {
  device_id: string;
  category: string;
  cadence: string;
  updated_at: string;
}

const METRICS_LOOKBACK_DAYS = 30;

/**
 * DB orchestration for the dashboard route: loads every device, every
 * delivery in the last 30 days (spec doesn't specify a window; 30 days
 * matches the cooldown job's own "engaged in the last 30 days" definition
 * elsewhere in this system, so the dashboard's story stays consistent with
 * the product logic that already exists), and every `notification_prefs`
 * update in that same window, then hands them to `computeMetrics`.
 */
export async function loadMetrics(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<NotificationMetrics> {
  const since = new Date(now.getTime() - METRICS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: deviceRows, error: deviceError },
    { data: deliveryRows, error: deliveryError },
    { data: prefRows, error: prefError },
  ] = await Promise.all([
    db.from('devices').select('id,master_enabled,push_token'),
    db.from('deliveries').select('device_id,category,sent_at,opened_at').gte('sent_at', since),
    db
      .from('notification_prefs')
      .select('device_id,category,cadence,updated_at')
      .gte('updated_at', since),
  ]);

  if (deviceError) throw new Error(`metrics device load failed: ${deviceError.message}`);
  if (deliveryError) throw new Error(`metrics delivery load failed: ${deliveryError.message}`);
  if (prefError) throw new Error(`metrics prefs load failed: ${prefError.message}`);

  const devices: DeviceMetricsRow[] = ((deviceRows ?? []) as DeviceRow[]).map((d) => ({
    id: d.id,
    masterEnabled: d.master_enabled,
    pushToken: d.push_token,
  }));
  const deliveries: DeliveryMetricsRow[] = ((deliveryRows ?? []) as DeliveryRow[]).map((d) => ({
    deviceId: d.device_id,
    category: d.category,
    sentAt: d.sent_at,
    openedAt: d.opened_at,
  }));
  const prefUpdates: PrefUpdateRow[] = ((prefRows ?? []) as PrefRow[]).map((p) => ({
    deviceId: p.device_id,
    category: p.category,
    cadence: p.cadence,
    updatedAt: p.updated_at,
  }));

  return computeMetrics(devices, deliveries, prefUpdates, now);
}
