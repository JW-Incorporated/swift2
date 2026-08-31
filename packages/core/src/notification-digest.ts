// Notifications Phase 3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §5/§9/
// §10) — the digest engine: enqueueing (called from notification-router.ts)
// and the periodic dispatch job that actually builds + sends merged
// digests.
//
// TWO SEPARATE SEND TRACKS, ON PURPOSE:
//
// 1. The GENERIC digest (`dispatchDueDigests`) — built entirely from
//    `digest_queue` rows, which only ever come from `events` (the same
//    producer seam Phase 2 wired). Merges every queued category into ONE
//    push per device per cadence (spec §5: "Digests merge across
//    categories... never four").
//
// 2. The Weekly Clown Report (`dispatchClownReports`) — easter_egg's own
//    branded weekly send. This is deliberately NOT part of the generic
//    digest_queue merge: its content is Clownbot-curated top theories
//    (notification-clownbot-source.ts), not a summary of `events` rows —
//    there is no `easter_egg` event producer yet (that's Phase 5 scope per
//    NOTIFICATIONS_PLAN.md), so nothing would ever land in digest_queue for
//    it today even if it were merged in. Keeping it a separate scheduled
//    send means a device that also has other categories on Weekly gets TWO
//    Friday pushes (the merged news digest + the Clown Report) rather than
//    a merge that can't actually happen yet — and once Phase 5 does wire a
//    real easter_egg producer, that pipeline can start feeding
//    digest_queue too without this module's branding logic changing.
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildDigestBody,
  buildEasterEggDigestBody,
  type AnyNotificationCategory,
  type DigestQueueItem,
} from '@swift2/shared';
import { getTopTheories } from './notification-clownbot-source';
import { isWithinSendWindow, nextDigestOccurrence, type DigestCadence } from './notification-digest-schedule';
import { HARD_CEILING_PER_DAY, startOfLocalDay, totalDeliveriesToday } from './notification-governor';
import { sendPushBatch } from './notification-sender';

export interface DigestDeviceRow {
  id: string;
  push_token: string | null;
  tz: string;
  digest_hour: number;
  master_enabled: boolean;
}

/**
 * Enqueues one event for one device's digest (called by the router when a
 * device's pref for the event's category is `daily`/`weekly` instead of
 * `instant`, and as the gate-4 cap-overflow rollover path). Idempotent on
 * `(device_id, event_id)` — the same event re-offered to the same device
 * (e.g. a re-run dispatch pass before the queue is drained) is a no-op, not
 * a duplicate queue entry or an error.
 */
export async function enqueueForDigest(
  db: SupabaseClient,
  input: {
    deviceId: string;
    eventId: string;
    category: string;
    cadence: DigestCadence;
    tz: string;
    digestHour: number;
    now: Date;
  },
): Promise<void> {
  const scheduledFor = nextDigestOccurrence(input.cadence, input.tz, input.digestHour, input.now);
  const { error } = await db.from('digest_queue').upsert(
    {
      device_id: input.deviceId,
      event_id: input.eventId,
      cadence: input.cadence,
      category: input.category,
      scheduled_for: scheduledFor.toISOString(),
    },
    { onConflict: 'device_id,event_id', ignoreDuplicates: true },
  );
  if (error) throw new Error(`enqueueForDigest: ${error.message}`);
}

export interface DigestDispatchResult {
  devicesConsidered: number;
  digestsSent: number;
  digestsHeldOutsideSendWindow: number;
  digestsSkippedMasterOff: number;
  digestsSkippedHardCeiling: number;
  sendFailures: number;
  clownReportsSent: number;
  errors: string[];
}

interface QueueRow {
  device_id: string;
  event_id: string;
  cadence: DigestCadence;
  category: string;
}

interface EventTitleRow {
  id: string;
  title: string;
}

const DEVICE_BATCH_LIMIT = 500;

/**
 * One dispatch pass: finds every device with at least one due
 * (`scheduled_for <= now`) `digest_queue` row, builds ONE merged push per
 * (device, cadence) pair — never one per category, per spec's non-
 * negotiable requirement — sends it, logs a single `deliveries` row
 * (`kind: 'digest'`), and clears the queued rows. A device with rows due
 * under both `daily` and `weekly` at the same tick gets two separate
 * pushes (they're genuinely different cadences the user opted into
 * separately), never merged with each other.
 */
export async function dispatchDueDigests(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<DigestDispatchResult> {
  const result: DigestDispatchResult = {
    devicesConsidered: 0,
    digestsSent: 0,
    digestsHeldOutsideSendWindow: 0,
    digestsSkippedMasterOff: 0,
    digestsSkippedHardCeiling: 0,
    sendFailures: 0,
    clownReportsSent: 0,
    errors: [],
  };

  const { data: dueRows, error: dueError } = await db
    .from('digest_queue')
    .select('device_id,event_id,cadence,category')
    .lte('scheduled_for', now.toISOString())
    .limit(DEVICE_BATCH_LIMIT);
  if (dueError) {
    result.errors.push(`could not load due digest_queue rows: ${dueError.message}`);
    return result;
  }

  const rows = (dueRows ?? []) as QueueRow[];
  if (rows.length === 0) return result;

  // Group by (device_id, cadence) — the unit of ONE merged push.
  const groups = new Map<string, QueueRow[]>();
  for (const row of rows) {
    const key = `${row.device_id}:${row.cadence}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const deviceIds = [...new Set(rows.map((r) => r.device_id))];
  const { data: deviceRows, error: deviceError } = await db
    .from('devices')
    .select('id,push_token,tz,digest_hour,master_enabled')
    .in('id', deviceIds);
  if (deviceError) {
    result.errors.push(`could not load devices: ${deviceError.message}`);
    return result;
  }
  const devicesById = new Map(((deviceRows ?? []) as DigestDeviceRow[]).map((d) => [d.id, d]));

  const eventIds = [...new Set(rows.map((r) => r.event_id))];
  const { data: eventRows, error: eventError } = await db
    .from('events')
    .select('id,title')
    .in('id', eventIds);
  if (eventError) {
    result.errors.push(`could not load events: ${eventError.message}`);
    return result;
  }
  const titleByEventId = new Map(((eventRows ?? []) as EventTitleRow[]).map((e) => [e.id, e.title]));

  for (const [key, groupRows] of groups) {
    result.devicesConsidered++;
    const device = devicesById.get(groupRows[0]?.device_id ?? '');
    if (!device) continue;
    if (!device.master_enabled) {
      result.digestsSkippedMasterOff++;
      continue;
    }
    if (!device.push_token) continue; // no token yet — nothing to send
    if (!isWithinSendWindow(device.tz, now)) {
      // spec §6 gate 5: digests only fire 8am-9pm local. Rows stay queued
      // (untouched) for the next tick rather than being dropped.
      result.digestsHeldOutsideSendWindow++;
      continue;
    }

    // spec §6.4 hard ceiling (Phase 5): combined instant+scheduled sends
    // can never exceed 6/day. A ceiling-blocked digest's queued rows stay
    // queued (same "wait, don't drop" posture as the send-window hold) —
    // they'll be reconsidered, and re-merged with anything new, on the
    // next tick once the device's local day rolls over and the count
    // resets.
    const sentSoFarToday = await totalDeliveriesToday(db, device.id, device.tz, now);
    if (sentSoFarToday >= HARD_CEILING_PER_DAY) {
      result.digestsSkippedHardCeiling++;
      continue;
    }

    const cadence = groupRows[0]?.cadence as DigestCadence;
    const items: DigestQueueItem[] = groupRows.map((r) => ({
      category: r.category as AnyNotificationCategory,
      title: titleByEventId.get(r.event_id) ?? r.category,
    }));
    const body = buildDigestBody(cadence, items);

    const sendResults = await sendPushBatch([
      {
        deviceId: device.id,
        pushToken: device.push_token,
        title: cadence === 'daily' ? 'Today in Taylor' : 'This week in Taylor',
        body,
        deepLink: 'https://www.longlivets.com/?current=inbox',
      },
    ]);

    const sendResult = sendResults[0];
    if (sendResult?.ok) {
      result.digestsSent++;
      const { error: deliveryError } = await db.from('deliveries').insert({
        device_id: device.id,
        event_id: null,
        kind: 'digest',
        category: null,
        sent_at: now.toISOString(),
      });
      if (deliveryError) result.errors.push(`delivery log insert failed: ${deliveryError.message}`);

      const eventIdsInGroup = groupRows.map((r) => r.event_id);
      const { error: clearError } = await db
        .from('digest_queue')
        .delete()
        .eq('device_id', device.id)
        .in('event_id', eventIdsInGroup);
      if (clearError) result.errors.push(`digest_queue clear failed: ${clearError.message}`);
    } else {
      result.sendFailures++;
      result.errors.push(
        `digest send failed for group ${key}: ${sendResult && !sendResult.ok ? sendResult.error : 'no result'}`,
      );
    }
  }

  return result;
}

/**
 * The Weekly Clown Report — separate scheduled send, per this module's
 * header. Fires once per device per local week: on the device's local
 * Friday, once local time has reached its `digest_hour` (send-window
 * clamped), for every device opted into `easter_egg` at `weekly` cadence,
 * IF that device hasn't already received one since the start of its
 * current local day (idempotency guard against re-firing on every 15-min
 * tick for the rest of Friday).
 */
export async function dispatchClownReports(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<Pick<DigestDispatchResult, 'clownReportsSent' | 'errors'>> {
  const out = { clownReportsSent: 0, errors: [] as string[] };

  const { data: prefRows, error: prefError } = await db
    .from('notification_prefs')
    .select('device_id')
    .eq('category', 'easter_egg')
    .eq('cadence', 'weekly');
  if (prefError) {
    out.errors.push(`clown report prefs lookup failed: ${prefError.message}`);
    return out;
  }
  const deviceIds = [...new Set((prefRows ?? []).map((r) => r.device_id as string))];
  if (deviceIds.length === 0) return out;

  const { data: deviceRows, error: deviceError } = await db
    .from('devices')
    .select('id,push_token,tz,digest_hour,master_enabled')
    .in('id', deviceIds);
  if (deviceError) {
    out.errors.push(`clown report device lookup failed: ${deviceError.message}`);
    return out;
  }

  const WEEKLY_TARGET_DAY = 5; // Friday, JS Sunday=0..Saturday=6
  let theories: Awaited<ReturnType<typeof getTopTheories>> | null = null;

  for (const device of (deviceRows ?? []) as DigestDeviceRow[]) {
    if (!device.master_enabled || !device.push_token) continue;

    const weekday = new Date(
      new Date(now).toLocaleString('en-US', { timeZone: device.tz }),
    ).getDay();
    if (weekday !== WEEKLY_TARGET_DAY) continue;
    if (!isWithinSendWindow(device.tz, now)) continue;

    const sinceLocalDay = startOfLocalDay(device.tz, now).toISOString();
    const { count, error: alreadySentError } = await db
      .from('deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('kind', 'fun')
      .eq('category', 'easter_egg')
      .gte('sent_at', sinceLocalDay);
    if (alreadySentError) {
      out.errors.push(`clown report dedupe check failed: ${alreadySentError.message}`);
      continue;
    }
    if ((count ?? 0) > 0) continue; // already sent today

    // spec §6.4 hard ceiling (Phase 5) — the Clown Report is a 'fun'-kind
    // send just like lyric_of_day/on_this_day; it counts against the same
    // device-wide 6/day floor.
    const sentSoFarToday = await totalDeliveriesToday(db, device.id, device.tz, now);
    if (sentSoFarToday >= HARD_CEILING_PER_DAY) continue;

    if (theories === null) theories = await getTopTheories(db);
    const body = buildEasterEggDigestBody(theories);

    const sendResults = await sendPushBatch([
      {
        deviceId: device.id,
        pushToken: device.push_token,
        title: 'The Weekly Clown Report \u{1F921}',
        body,
        deepLink: 'https://www.longlivets.com/?current=theories',
      },
    ]);
    const sendResult = sendResults[0];
    if (sendResult?.ok) {
      out.clownReportsSent++;
      const { error: deliveryError } = await db.from('deliveries').insert({
        device_id: device.id,
        event_id: null,
        kind: 'fun',
        category: 'easter_egg',
        sent_at: now.toISOString(),
      });
      if (deliveryError) out.errors.push(`clown report delivery log failed: ${deliveryError.message}`);
    } else {
      out.errors.push(
        `clown report send failed for device ${device.id}: ${sendResult && !sendResult.ok ? sendResult.error : 'no result'}`,
      );
    }
  }

  return out;
}
