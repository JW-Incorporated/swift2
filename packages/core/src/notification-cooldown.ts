// Notifications Phase 5 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §6) —
// the auto-cooldown job: "if a device hasn't opened any notification in 30
// days, downgrade its Instant categories to Daily and send one final
// 'We've quieted things down — tap to adjust' push."
//
// OPEN-TRACKING FLAG: `deliveries.opened_at` is the column this job reads
// (it already exists — the Phase 2 migration, supabase/migrations/
// 20260911000000_notifications_events.sql, ships it), but the callback that
// actually SETS it (a notification-open event from the client) is Phase 6
// scope (NOTIFICATIONS_PLAN.md Phase 6: "Open tracking: notification-open
// callback → deliveries.opened_at") and is NOT wired yet. This job is
// written against the correct spec §6 semantic (`opened_at`, not a proxy
// like `devices.last_seen_at`, which only reflects app opens/prefs calls,
// not notification opens specifically) so it needs no rework once Phase 6
// lands the callback. Until then, EVERY delivery's `opened_at` is null, so
// in production this job will find every device with at least one Instant
// pref and at least 30 days of delivery history eligible for cooldown —
// flagged here, in STATE.md, and in the PR body rather than silently
// shipping a job that looks correct but always fires. It is still fully
// testable (see notification-cooldown.test.ts's seeded-stale-device
// fixture) and does the right thing the moment Phase 6 starts populating
// the column.
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendPushBatch } from './notification-sender';

const COOLDOWN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface CooldownDeviceRow {
  id: string;
  push_token: string | null;
  master_enabled: boolean;
  /** Phase 6: which wire sendPushBatch should use. */
  platform?: string;
}

export interface CooldownResult {
  devicesConsidered: number;
  devicesDowngraded: number;
  noticesSent: number;
  sendFailures: number;
  errors: string[];
}

/**
 * A device is cooldown-eligible when:
 *   1. it has at least one `notification_prefs` row currently set to
 *      `instant` (nothing to downgrade otherwise), AND
 *   2. it has at least one `deliveries` row older than the 30-day window
 *      (so a genuinely brand-new device with zero delivery history yet
 *      isn't punished for "never opening" something it was never sent —
 *      the spec's intent is quieting an unengaged EXISTING user, not a
 *      fresh install), AND
 *   3. NONE of its `deliveries` rows have a non-null `opened_at` within
 *      the 30-day window.
 *
 * Pure decision function — zero I/O, same testing philosophy as
 * notification-governor.ts's gates (this task's own instruction: "write
 * as a real automated test... verified against a seeded stale device").
 */
export function isCooldownEligible(
  hasInstantPref: boolean,
  deliveries: readonly { sentAt: string; openedAt: string | null }[],
  now: Date,
): boolean {
  if (!hasInstantPref) return false;
  const cutoff = now.getTime() - COOLDOWN_WINDOW_MS;
  const hasOldEnoughHistory = deliveries.some((d) => new Date(d.sentAt).getTime() < cutoff);
  if (!hasOldEnoughHistory) return false;
  const hasRecentOpen = deliveries.some(
    (d) => d.openedAt !== null && new Date(d.openedAt).getTime() >= cutoff,
  );
  return !hasRecentOpen;
}

interface DeliveryRow {
  device_id: string;
  sent_at: string;
  opened_at: string | null;
}

interface PrefRow {
  device_id: string;
  category: string;
  cadence: string;
}

/**
 * One cooldown pass: finds every device with an `instant` pref and no
 * notification open in the last 30 days, downgrades ALL of that device's
 * `instant` prefs to `daily` (spec: "downgrade its Instant categories to
 * Daily"), and sends the one required notice push. Idempotent in effect —
 * a device already fully downgraded (no remaining `instant` prefs) simply
 * won't be selected as eligible on the next pass (gate 1 above).
 */
export async function runCooldownPass(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<CooldownResult> {
  const result: CooldownResult = {
    devicesConsidered: 0,
    devicesDowngraded: 0,
    noticesSent: 0,
    sendFailures: 0,
    errors: [],
  };

  const { data: prefRows, error: prefError } = await db
    .from('notification_prefs')
    .select('device_id,category,cadence')
    .eq('cadence', 'instant');
  if (prefError) {
    result.errors.push(`cooldown prefs lookup failed: ${prefError.message}`);
    return result;
  }
  const instantPrefRows = (prefRows ?? []) as PrefRow[];
  const candidateDeviceIds = [...new Set(instantPrefRows.map((r) => r.device_id))];
  if (candidateDeviceIds.length === 0) return result;

  const [{ data: deviceRows, error: deviceError }, { data: deliveryRows, error: deliveryError }] =
    await Promise.all([
      db
        .from('devices')
        .select('id,push_token,master_enabled,platform')
        .in('id', candidateDeviceIds),
      // Only need deliveries up to "now" and only for candidate devices —
      // no upper time bound needed since we're checking for recency, not
      // filtering a window server-side (isCooldownEligible does that pure
      // computation once the rows are loaded).
      db
        .from('deliveries')
        .select('device_id,sent_at,opened_at')
        .in('device_id', candidateDeviceIds),
    ]);
  if (deviceError) {
    result.errors.push(`cooldown device lookup failed: ${deviceError.message}`);
    return result;
  }
  if (deliveryError) {
    result.errors.push(`cooldown delivery lookup failed: ${deliveryError.message}`);
    return result;
  }

  const devicesById = new Map(((deviceRows ?? []) as CooldownDeviceRow[]).map((d) => [d.id, d]));
  const deliveriesByDevice = new Map<string, { sentAt: string; openedAt: string | null }[]>();
  for (const row of (deliveryRows ?? []) as DeliveryRow[]) {
    const bucket = deliveriesByDevice.get(row.device_id);
    const entry = { sentAt: row.sent_at, openedAt: row.opened_at };
    if (bucket) bucket.push(entry);
    else deliveriesByDevice.set(row.device_id, [entry]);
  }
  const hasInstantByDevice = new Set(instantPrefRows.map((r) => r.device_id));

  for (const deviceId of candidateDeviceIds) {
    result.devicesConsidered++;
    const device = devicesById.get(deviceId);
    if (!device) continue;

    const eligible = isCooldownEligible(
      hasInstantByDevice.has(deviceId),
      deliveriesByDevice.get(deviceId) ?? [],
      now,
    );
    if (!eligible) continue;

    const { error: downgradeError } = await db
      .from('notification_prefs')
      .update({ cadence: 'daily', updated_at: now.toISOString() })
      .eq('device_id', deviceId)
      .eq('cadence', 'instant');
    if (downgradeError) {
      result.errors.push(`cooldown downgrade failed for ${deviceId}: ${downgradeError.message}`);
      continue;
    }
    result.devicesDowngraded++;

    if (!device.master_enabled || !device.push_token) continue; // downgraded, but nothing to notify

    const sendResults = await sendPushBatch([
      {
        deviceId,
        pushToken: device.push_token,
        title: "We've quieted things down",
        body: "You hadn't opened a notification in a while, so we moved your Instant alerts to a daily digest \u2014 tap to adjust \u2192",
        deepLink: 'https://www.longlivets.com/?screen=settings',
        platform: device.platform as 'ios' | 'android' | 'web' | undefined,
      },
    ]);
    const sendResult = sendResults[0];
    if (sendResult?.ok) {
      result.noticesSent++;
      const { error: deliveryLogError } = await db.from('deliveries').insert({
        device_id: deviceId,
        event_id: null,
        kind: 'fun',
        category: null,
        sent_at: now.toISOString(),
        delivery_token: sendResult.deliveryToken,
      });
      if (deliveryLogError) {
        result.errors.push(
          `cooldown notice log failed for ${deviceId}: ${deliveryLogError.message}`,
        );
      }
    } else {
      result.sendFailures++;
      result.errors.push(
        `cooldown notice send failed for ${deviceId}: ${sendResult && !sendResult.ok ? sendResult.error : 'no result'}`,
      );
    }
  }

  return result;
}
