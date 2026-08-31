// Notifications Phase 2/3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §10)
// — the router: fans a pending `events` row out to every device whose
// prefs say "instant" for that category (governed, sent immediately) or
// "daily"/"weekly" (enqueued into `digest_queue`, Phase 3), running each
// instant candidate through the governor (notification-governor.ts) and
// logging a `deliveries` row for every send.
//
// Server-only, service-role posture (same as every other notifications
// module). Called by the dispatch API route (POST /api/notifications/dispatch)
// on a schedule.
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  evaluateGovernor,
  startOfLocalDay,
  totalDeliveriesToday,
  type GovernorDeviceSettings,
} from './notification-governor';
import { sendPushBatch, type PushSendResult } from './notification-sender';
import { enqueueForDigest } from './notification-digest';

export interface RouterEventRow {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deep_link: string;
  available_at: string;
  expires_at: string | null;
  killed_at: string | null;
}

export interface RouterDispatchResult {
  eventsConsidered: number;
  eventsSkippedNotReady: number;
  eventsSkippedKilled: number;
  eventsSkippedExpired: number;
  candidateDevices: number;
  sent: number;
  held: number; // quiet-hours
  skippedMasterOff: number;
  skippedSnoozed: number;
  skippedCoalesced: number;
  skippedDailyCap: number;
  /** spec §6.4 hard ceiling (Phase 5): combined instant+scheduled sends
   * blocked outright once the device's device-wide 6/day floor is hit —
   * unlike daily_cap overflow, never rolled into a digest (see gate 6's
   * docstring in notification-governor.ts). */
  skippedHardCeiling: number;
  sendFailures: number;
  /** Phase 3: daily/weekly-pref devices fanned into `digest_queue` instead
   * of sent, PLUS any instant-tier cap-overflow rollovers (spec §6 gate 4:
   * "overflow rolls into the next digest"). */
  enqueuedToDigest: number;
  errors: string[];
}

interface DeviceRow {
  id: string;
  push_token: string | null;
  master_enabled: boolean;
  snooze_until: string | null;
  daily_cap: number;
  quiet_start: number;
  quiet_end: number;
  tz: string;
}

const PENDING_EVENT_LIMIT = 200;

/**
 * One dispatch pass: loads events whose `available_at` has arrived (T1's
 * 5-min delay applies here — an event isn't even a candidate until its
 * delay elapses, which is what makes the kill hook effective) and haven't
 * been killed or expired, fans each out to opted-in instant devices, runs
 * the governor, sends via FCM, and logs `deliveries`.
 */
export async function dispatchPendingEvents(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<RouterDispatchResult> {
  const result: RouterDispatchResult = {
    eventsConsidered: 0,
    eventsSkippedNotReady: 0,
    eventsSkippedKilled: 0,
    eventsSkippedExpired: 0,
    candidateDevices: 0,
    sent: 0,
    held: 0,
    skippedMasterOff: 0,
    skippedSnoozed: 0,
    skippedCoalesced: 0,
    skippedDailyCap: 0,
    skippedHardCeiling: 0,
    sendFailures: 0,
    enqueuedToDigest: 0,
    errors: [],
  };

  const { data: events, error: eventsError } = await db
    .from('events')
    .select('id,category,tier,title,body,deep_link,available_at,expires_at,killed_at')
    .lte('available_at', now.toISOString())
    .is('killed_at', null)
    .not('id', 'in', `(select event_id from deliveries where event_id is not null)`)
    .limit(PENDING_EVENT_LIMIT);

  if (eventsError) {
    result.errors.push(`could not load pending events: ${eventsError.message}`);
    return result;
  }

  for (const event of (events ?? []) as RouterEventRow[]) {
    result.eventsConsidered++;
    if (event.expires_at && new Date(event.expires_at).getTime() < now.getTime()) {
      result.eventsSkippedExpired++;
      continue;
    }
    try {
      await dispatchOneEvent(db, event, now, result);
    } catch (err) {
      result.errors.push(`dispatch failed for event ${event.id}: ${(err as Error).message}`);
    }
  }

  return result;
}

async function dispatchOneEvent(
  db: SupabaseClient,
  event: RouterEventRow,
  now: Date,
  result: RouterDispatchResult,
): Promise<void> {
  // Phase 3: fan out to BOTH instant-tier devices (governed, sent below)
  // AND daily/weekly devices (enqueued into digest_queue — NOTIFICATIONS_
  // PLAN.md Phase 3: "router update so daily/weekly prefs enqueue instead
  // of send"). One prefs query covers all three cadences so a device that
  // changes cadence between dispatch passes is picked up correctly either
  // way, without a second round-trip.
  const { data: prefRows, error: prefsError } = await db
    .from('notification_prefs')
    .select('device_id,cadence')
    .eq('category', event.category)
    .in('cadence', ['instant', 'daily', 'weekly']);
  if (prefsError) throw new Error(`prefs lookup: ${prefsError.message}`);

  const prefRowsArr = (prefRows ?? []) as { device_id: string; cadence: string }[];
  const instantDeviceIds = prefRowsArr.filter((r) => r.cadence === 'instant').map((r) => r.device_id);
  const digestDeviceIds = prefRowsArr.filter((r) => r.cadence !== 'instant');
  const allDeviceIds = [...new Set(prefRowsArr.map((r) => r.device_id))];
  if (allDeviceIds.length === 0) return;

  const { data: devices, error: devicesError } = await db
    .from('devices')
    .select('id,push_token,master_enabled,snooze_until,daily_cap,quiet_start,quiet_end,tz,digest_hour')
    .in('id', allDeviceIds);
  if (devicesError) throw new Error(`device lookup: ${devicesError.message}`);

  const devicesById = new Map(((devices ?? []) as (DeviceRow & { digest_hour: number })[]).map((d) => [d.id, d]));

  // --- Daily/weekly devices: enqueue, never send from this path. ---
  for (const { device_id, cadence } of digestDeviceIds) {
    const device = devicesById.get(device_id);
    if (!device) continue;
    result.candidateDevices++;
    try {
      await enqueueForDigest(db, {
        deviceId: device_id,
        eventId: event.id,
        category: event.category,
        cadence: cadence as 'daily' | 'weekly',
        tz: device.tz,
        digestHour: device.digest_hour,
        now,
      });
      result.enqueuedToDigest++;
    } catch (err) {
      result.errors.push(`digest enqueue failed for device ${device_id}: ${(err as Error).message}`);
    }
  }

  // --- Instant-tier devices: governed send, same as Phase 2. ---
  const toSend: { device: DeviceRow }[] = [];

  for (const deviceId of instantDeviceIds) {
    const device = devicesById.get(deviceId);
    if (!device) continue;
    result.candidateDevices++;
    if (!device.push_token) continue; // never granted permission / no token yet

    const settings: GovernorDeviceSettings = {
      masterEnabled: device.master_enabled,
      snoozeUntil: device.snooze_until,
      dailyCap: device.daily_cap,
      quietStart: device.quiet_start,
      quietEnd: device.quiet_end,
      tz: device.tz,
    };

    const [recentDeliveries, instantToday, totalToday] = await Promise.all([
      recentSameCategoryDeliveries(db, device.id, event.category, now),
      instantDeliveriesToday(db, device.id, device.tz, now),
      totalDeliveriesToday(db, device.id, device.tz, now),
    ]);

    const decision = evaluateGovernor({
      now,
      device: settings,
      event: { category: event.category, tier: event.tier },
      recentSameCategoryDeliveries: recentDeliveries,
      instantDeliveriesToday: instantToday,
      totalDeliveriesToday: totalToday,
    });

    switch (decision.action) {
      case 'send':
        toSend.push({ device });
        break;
      case 'hold':
        result.held++;
        break;
      case 'skip':
        if (decision.reason === 'master_off') result.skippedMasterOff++;
        else if (decision.reason === 'snoozed') result.skippedSnoozed++;
        else if (decision.reason === 'coalesced') result.skippedCoalesced++;
        else if (decision.reason === 'hard_ceiling') result.skippedHardCeiling++;
        else if (decision.reason === 'daily_cap') {
          result.skippedDailyCap++;
          // spec §6 gate 4: "Overflow rolls into the next digest" — an
          // instant-tier device that's hit its daily cap doesn't just lose
          // this event, it gets it in its next digest instead (daily
          // cadence: even a device with NO daily/weekly prefs at all still
          // gets an overflow digest, since the spec's rollover promise
          // applies regardless of the device's own chosen cadence for this
          // category).
          try {
            await enqueueForDigest(db, {
              deviceId: device.id,
              eventId: event.id,
              category: event.category,
              cadence: 'daily',
              tz: device.tz,
              digestHour: device.digest_hour,
              now,
            });
            result.enqueuedToDigest++;
          } catch (err) {
            result.errors.push(
              `cap-overflow digest enqueue failed for device ${device.id}: ${(err as Error).message}`,
            );
          }
        }
        break;
    }
  }

  if (toSend.length === 0) return;

  const sendResults = await sendPushBatch(
    toSend.map(({ device }) => ({
      deviceId: device.id,
      pushToken: device.push_token as string,
      title: event.title,
      body: event.body,
      deepLink: event.deep_link,
    })),
  );

  await logDeliveriesAndPrune(db, event, sendResults, result);
}

async function recentSameCategoryDeliveries(
  db: SupabaseClient,
  deviceId: string,
  category: string,
  now: Date,
): Promise<string[]> {
  const lookback = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1h >> 30min window
  const { data, error } = await db
    .from('deliveries')
    .select('sent_at')
    .eq('device_id', deviceId)
    .eq('category', category)
    .gte('sent_at', lookback);
  if (error) throw new Error(`recent deliveries lookup: ${error.message}`);
  return (data ?? []).map((r) => r.sent_at as string);
}

async function instantDeliveriesToday(
  db: SupabaseClient,
  deviceId: string,
  tz: string,
  now: Date,
): Promise<number> {
  const since = startOfLocalDay(tz, now).toISOString();
  const { count, error } = await db
    .from('deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('device_id', deviceId)
    .eq('kind', 'instant')
    .gte('sent_at', since);
  if (error) throw new Error(`daily-cap count: ${error.message}`);
  return count ?? 0;
}

/** Gate 6's (Phase 5 hard ceiling) counter now lives in
 * notification-governor.ts's totalDeliveriesToday() so it can be shared
 * with notification-digest.ts / notification-fun.ts without a circular
 * import — re-exported here for any existing external importer. */
export { totalDeliveriesToday } from './notification-governor';

/**
 * Logs one `deliveries` row per successful send and prunes any device whose
 * token FCM reported UNREGISTERED (spec §10: "invalid tokens pruned on
 * response"). A send failure that ISN'T an invalid-token response is
 * counted but doesn't touch the token — a transient FCM error must not
 * silently disable a good device.
 */
async function logDeliveriesAndPrune(
  db: SupabaseClient,
  event: RouterEventRow,
  sendResults: readonly PushSendResult[],
  result: RouterDispatchResult,
): Promise<void> {
  const deliveryRows: { device_id: string; event_id: string; kind: string; category: string }[] =
    [];
  const tokensToClear: string[] = [];

  for (const r of sendResults) {
    if (r.ok) {
      result.sent++;
      deliveryRows.push({
        device_id: r.deviceId,
        event_id: event.id,
        kind: 'instant',
        category: event.category,
      });
    } else {
      result.sendFailures++;
      if (r.invalidToken) tokensToClear.push(r.deviceId);
    }
  }

  if (deliveryRows.length > 0) {
    const { error } = await db.from('deliveries').insert(deliveryRows);
    if (error) result.errors.push(`delivery log insert failed: ${error.message}`);
  }

  if (tokensToClear.length > 0) {
    const { error } = await db.from('devices').update({ push_token: null }).in('id', tokensToClear);
    if (error) result.errors.push(`invalid-token prune failed: ${error.message}`);
  }
}
