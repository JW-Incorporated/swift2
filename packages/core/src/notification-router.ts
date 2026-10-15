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
import {
  engagePushFreeze,
  readPushFreeze,
  sendPushBatch,
  type PushSendResult,
} from './notification-sender';
import { enqueueForDigest } from './notification-digest';

export interface RouterEventRow {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deep_link: string;
  created_at?: string;
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
  skippedAlreadyDelivered: number;
  skippedStale: number;
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
  freezeEngaged: boolean;
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
  /** Phase 6: which wire sendPushBatch should use — see
   * notification-sender.ts's `PushSendInput.platform`. Optional on the
   * type only because a couple of test fixtures predate this column
   * existing on the query; production rows always have it. */
  platform?: string;
}

const PENDING_EVENT_LIMIT = 200;
export const INSTANT_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const EVENT_COLUMNS =
  'id,category,tier,title,body,deep_link,created_at,available_at,expires_at,killed_at';

async function pendingEvents(db: SupabaseClient, now: Date): Promise<RouterEventRow[]> {
  const pending: RouterEventRow[] = [];
  const seen = new Set<string>();
  let lastEvent: RouterEventRow | null = null;
  const nowIso = now.toISOString();

  while (pending.length < PENDING_EVENT_LIMIT) {
    let query = db
      .from('events')
      .select(EVENT_COLUMNS)
      .lte('available_at', nowIso)
      .is('killed_at', null)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('available_at', { ascending: false })
      .order('id')
      .limit(PENDING_EVENT_LIMIT);
    if (lastEvent) {
      query = query.or(
        `available_at.lt.${lastEvent.available_at},and(available_at.eq.${lastEvent.available_at},id.gt.${lastEvent.id})`,
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(`could not load pending events: ${error.message}`);
    const rows = (data ?? []) as RouterEventRow[];
    if (rows.length === 0) return pending;
    lastEvent = rows[rows.length - 1] ?? null;
    const candidates = rows.filter((event) => !seen.has(event.id));
    for (const event of candidates) seen.add(event.id);
    const remaining = PENDING_EVENT_LIMIT - pending.length;
    pending.push(...candidates.slice(0, remaining));
    if (rows.length < PENDING_EVENT_LIMIT) return pending;
  }
  return pending;
}

/**
 * One dispatch pass: loads events whose `available_at` has arrived (every
 * tier's 5-minute kill window applies here, so an event isn't a candidate
 * until the delay elapses) and haven't
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
    skippedAlreadyDelivered: 0,
    skippedStale: 0,
    skippedHardCeiling: 0,
    sendFailures: 0,
    enqueuedToDigest: 0,
    freezeEngaged: false,
    errors: [],
  };

  const pushFreeze = await readPushFreeze(db);
  if (pushFreeze.state === 'unreadable') {
    const reason = pushFreeze.reason ?? 'switch row is missing';
    const message = `PUSH_FREEZE could not be read; dispatch skipped: ${reason}`;
    console.warn(`notification-router: ${message}`);
    result.errors.push(message);
    return result;
  }
  if (pushFreeze.state === 'frozen') {
    console.warn('notification-router: PUSH_FREEZE is on; dispatch skipped');
    return result;
  }

  let events: RouterEventRow[];
  try {
    events = await pendingEvents(db, now);
  } catch (err) {
    result.errors.push((err as Error).message);
    return result;
  }

  for (const event of events) {
    result.eventsConsidered++;
    if (event.expires_at && new Date(event.expires_at).getTime() < now.getTime()) {
      result.eventsSkippedExpired++;
      continue;
    }
    try {
      const safeToContinue = await dispatchOneEvent(db, event, now, result);
      if (!safeToContinue) break;
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
): Promise<boolean> {
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
  const instantDeviceIds = prefRowsArr
    .filter((r) => r.cadence === 'instant')
    .map((r) => r.device_id);
  const digestDeviceIds = prefRowsArr.filter((r) => r.cadence !== 'instant');
  const allDeviceIds = [...new Set(prefRowsArr.map((r) => r.device_id))];
  if (allDeviceIds.length === 0) return true;

  const { data: devices, error: devicesError } = await db
    .from('devices')
    .select(
      'id,push_token,master_enabled,snooze_until,daily_cap,quiet_start,quiet_end,tz,digest_hour,platform',
    )
    .in('id', allDeviceIds);
  if (devicesError) throw new Error(`device lookup: ${devicesError.message}`);

  const devicesById = new Map(
    ((devices ?? []) as (DeviceRow & { digest_hour: number })[]).map((d) => [d.id, d]),
  );

  const { data: deliveredRows, error: deliveredError } = await db
    .from('deliveries')
    .select('device_id')
    .eq('event_id', event.id)
    .eq('kind', 'instant');
  if (deliveredError) throw new Error(`delivered-device lookup: ${deliveredError.message}`);
  const deliveredDeviceIds = new Set(
    ((deliveredRows ?? []) as { device_id: string }[]).map((row) => row.device_id),
  );

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
      result.errors.push(
        `digest enqueue failed for device ${device_id}: ${(err as Error).message}`,
      );
    }
  }

  // --- Instant-tier devices: governed send, same as Phase 2. ---
  const toSend: { device: DeviceRow }[] = [];

  for (const deviceId of instantDeviceIds) {
    const device = devicesById.get(deviceId);
    if (!device) continue;
    result.candidateDevices++;
    if (!device.push_token) continue; // never granted permission / no token yet
    if (deliveredDeviceIds.has(device.id)) {
      result.skippedAlreadyDelivered++;
      continue;
    }

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
        if (isInstantStale(event, now) && !wasHeldForQuietHours(event, device, now)) {
          result.skippedStale++;
        } else {
          toSend.push({ device });
        }
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

  if (toSend.length === 0) return true;

  const sendResults = await sendPushBatch(
    toSend.map(({ device }) => ({
      deviceId: device.id,
      pushToken: device.push_token as string,
      title: event.title,
      body: event.body,
      deepLink: event.deep_link,
      platform: device.platform as 'ios' | 'android' | 'web' | undefined,
    })),
    db,
  );

  return logDeliveriesAndPrune(db, event, sendResults, result, now);
}

function isInstantStale(event: RouterEventRow, now: Date): boolean {
  const createdAt = new Date(event.created_at ?? event.available_at).getTime();
  return Number.isFinite(createdAt) && now.getTime() - createdAt > INSTANT_MAX_AGE_MS;
}

function localDateHour(tz: string, at: Date): { date: string; hour: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(at);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 };
  } catch {
    return { date: at.toISOString().slice(0, 10), hour: at.getUTCHours() };
  }
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + 1)).toISOString().slice(0, 10);
}

function wasHeldForQuietHours(event: RouterEventRow, device: DeviceRow, now: Date): boolean {
  const { quiet_start: start, quiet_end: end } = device;
  if (start === end) return false;
  const created = localDateHour(device.tz, new Date(event.created_at ?? event.available_at));
  const current = localDateHour(device.tz, now);
  const wrapsMidnight = start > end;
  const createdDuringQuiet = wrapsMidnight
    ? created.hour >= start || created.hour < end
    : created.hour >= start && created.hour < end;
  if (!createdDuringQuiet) return false;

  const releaseDate = wrapsMidnight && created.hour >= start ? nextDate(created.date) : created.date;
  if (wrapsMidnight) {
    return current.date === releaseDate && current.hour >= end && current.hour < start;
  }
  return (
    (current.date === releaseDate && current.hour >= end) ||
    (current.date === nextDate(releaseDate) && current.hour < start)
  );
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
  now: Date,
): Promise<boolean> {
  const deliveryRows: {
    device_id: string;
    event_id: string;
    kind: string;
    category: string;
    delivery_token: string;
  }[] = [];
  const tokensToClear: string[] = [];

  for (const r of sendResults) {
    if (r.ok) {
      result.sent++;
      deliveryRows.push({
        device_id: r.deviceId,
        event_id: event.id,
        kind: 'instant',
        category: event.category,
        delivery_token: r.deliveryToken,
      });
    } else {
      result.sendFailures++;
      if (r.invalidToken) tokensToClear.push(r.deviceId);
    }
  }

  if (deliveryRows.length > 0) {
    const { error } = await db.from('deliveries').insert(deliveryRows);
    if (error) {
      result.errors.push(`delivery log insert failed: ${error.message}`);
      const freeze = await engagePushFreeze(db, now);
      result.freezeEngaged = freeze.engaged;
      if (!freeze.engaged) {
        result.errors.push(`PUSH_FREEZE engage failed: ${freeze.reason ?? 'unknown error'}`);
      }
      console.error(
        `notification-router: delivery log insert failed after provider acceptance; PUSH_FREEZE ${freeze.engaged ? 'engaged' : 'engage failed'}; run stopped`,
      );
      return false;
    }
  }

  if (tokensToClear.length > 0) {
    const { error } = await db.from('devices').update({ push_token: null }).in('id', tokensToClear);
    if (error) result.errors.push(`invalid-token prune failed: ${error.message}`);
  }
  return true;
}
