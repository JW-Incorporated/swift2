// Notifications Phase 4 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/
// §9/§10) — fun-notification content selection + the countdown scheduler.
//
// Same split as every prior phase: PURE decision functions (this module's
// exported `select*`/`schedule*` functions, zero I/O) vs. DB-touching
// orchestration (`dispatchFunNotifications`, `scheduleCountdownsForEvent`).
// The pure functions are what the Phase 4 acceptance test (a 30-day
// simulation: "correct counts per cadence, zero lyric repeats, empty
// on_this_day dates send nothing") exercises directly — see
// notification-fun.test.ts.
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendPushBatch } from './notification-sender';
import {
  isWithinSendWindow,
  isFunSendDay,
  startOfLocalPeriod,
  type FunCadence,
} from './notification-fun-schedule';
import { HARD_CEILING_PER_DAY, startOfLocalDay, totalDeliveriesToday } from './notification-governor';

export interface LyricCandidate {
  id: number;
  slug: string;
  song: string;
  album: string;
  lyric: string;
  verified: boolean;
}

/**
 * 12-month no-repeat rule (spec §4: "no repeats within 12 months per
 * device"). Picks the pool's FIRST candidate whose id isn't in
 * `seenLyricIds` (deterministic — same pool + same seen-set always picks
 * the same lyric, which is what makes the 30-day simulation reproducible).
 * `seenLyricIds` is the caller's responsibility to have already filtered
 * to the 12-month lookback window (see loadRecentLyricIds below) — this
 * function has no notion of time itself.
 *
 * `requireVerified` gates on `verified` (see the migration's comment and
 * supabase/seed/lyrics/starter-pool.mjs's DRAFT caveat) — production
 * dispatch always passes `true`; tests exercise the unverified draft pool
 * directly by passing `false`. Returns null when every candidate is
 * either seen or unverified — the device simply gets no lyric_of_day this
 * cycle, never a repeat and never a fabricated fallback.
 */
export function selectLyricForDevice(
  pool: readonly LyricCandidate[],
  seenLyricIds: ReadonlySet<number>,
  requireVerified: boolean = true,
): LyricCandidate | null {
  for (const candidate of pool) {
    if (requireVerified && !candidate.verified) continue;
    if (seenLyricIds.has(candidate.id)) continue;
    return candidate;
  }
  return null;
}

export interface OnThisDayEntry {
  id: number;
  month: number; // 1-12
  day: number; // 1-31
  year: number | null;
  text: string;
  deepLink: string | null;
}

/**
 * spec §4: "skips dates with no good entry rather than sending filler."
 * Pure lookup against today's device-local month/day — returns null (not
 * a fallback string) when nothing is authored for that date, which is the
 * ENTIRE mechanism the acceptance criterion ("empty on_this_day dates
 * send nothing") relies on: the dispatch orchestration below never
 * synthesizes a substitute when this returns null.
 */
export function selectOnThisDayEntry(
  entries: readonly OnThisDayEntry[],
  month: number,
  day: number,
): OnThisDayEntry | null {
  return entries.find((e) => e.month === month && e.day === day) ?? null;
}

// ---------------------------------------------------------------------------
// Countdown scheduler (spec §4 `countdowns`): "on announced-drop events,
// auto-create T-7d/T-1d/release-hour sends for opted-in devices."
// ---------------------------------------------------------------------------

export type CountdownMilestone = 't_minus_7d' | 't_minus_1d' | 'release_hour';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface CountdownSchedule {
  milestone: CountdownMilestone;
  scheduledFor: Date;
}

/**
 * Computes the T-7d / T-1d / release-hour instants for an announced drop
 * at `dropAt`, keeping only milestones still in the FUTURE relative to
 * `now` — spec: reminders "for announced drops only", and a device that
 * opts into countdowns after T-7d has already passed should still get
 * T-1d and release-hour, never a backdated push. A drop announced with
 * under 7 days' notice correctly yields fewer milestones (e.g. only T-1d
 * + release-hour, or just release-hour) — this is intentional, not a bug:
 * "self-limiting" per spec's own description of the category.
 */
export function scheduleCountdowns(dropAt: Date, now: Date): CountdownSchedule[] {
  const candidates: CountdownSchedule[] = [
    { milestone: 't_minus_7d', scheduledFor: new Date(dropAt.getTime() - SEVEN_DAYS_MS) },
    { milestone: 't_minus_1d', scheduledFor: new Date(dropAt.getTime() - ONE_DAY_MS) },
    { milestone: 'release_hour', scheduledFor: dropAt },
  ];
  return candidates.filter((c) => c.scheduledFor.getTime() > now.getTime());
}

/** Push copy for a countdown milestone — verbatim-flavored per spec §4's
 * "T-7d, T-1d, and release-hour reminders" language. `dropTitle` is the
 * source event's title (e.g. an album/tour name). */
export function countdownCopy(
  milestone: CountdownMilestone,
  dropTitle: string,
): { title: string; body: string } {
  switch (milestone) {
    case 't_minus_7d':
      return { title: 'One week to go', body: `${dropTitle} drops in 7 days →` };
    case 't_minus_1d':
      return { title: 'Tomorrow', body: `${dropTitle} drops tomorrow →` };
    case 'release_hour':
      return { title: "It's here", body: `${dropTitle} is out now →` };
  }
}

// ---------------------------------------------------------------------------
// DB orchestration
// ---------------------------------------------------------------------------

interface FunDeviceRow {
  id: string;
  push_token: string | null;
  tz: string;
  digest_hour: number;
  master_enabled: boolean;
}

export interface FunDispatchResult {
  lyricsSent: number;
  onThisDaySent: number;
  onThisDaySkippedNoEntry: number;
  countdownsSent: number;
  devicesConsidered: number;
  sendFailures: number;
  skippedHardCeiling: number;
  errors: string[];
}

/**
 * One dispatch pass: for every device with a non-off lyric_of_day/
 * on_this_day pref, on a day/hour eligible for that pref's cadence, sends
 * (or, for on_this_day with no entry, silently skips). Runs from the same
 * `/api/notifications/dispatch` route Phase 2/3 already wired every 15
 * minutes. Loads the lyric/on_this_day pools from their own tables
 * (`lyrics`/`on_this_day`, seeded by scripts/seed-lyrics.mjs and
 * scripts/seed-on-this-day.mjs from supabase/seed/**) — same
 * DB-is-the-runtime-source-of-truth pattern the digest engine and router
 * already use for `events`/`devices`.
 */
export async function dispatchFunNotifications(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<FunDispatchResult> {
  const result: FunDispatchResult = {
    lyricsSent: 0,
    onThisDaySent: 0,
    onThisDaySkippedNoEntry: 0,
    countdownsSent: 0,
    devicesConsidered: 0,
    sendFailures: 0,
    skippedHardCeiling: 0,
    errors: [],
  };

  const { data: prefRows, error: prefError } = await db
    .from('notification_prefs')
    .select('device_id,category,cadence')
    .in('category', ['lyric_of_day', 'on_this_day'])
    .in('cadence', ['daily', 'weekly', 'monthly']);
  if (prefError) {
    result.errors.push(`fun prefs lookup failed: ${prefError.message}`);
    return result;
  }
  const prefRowsArr = (prefRows ?? []) as {
    device_id: string;
    category: string;
    cadence: string;
  }[];
  if (prefRowsArr.length === 0) return result;

  const deviceIds = [...new Set(prefRowsArr.map((r) => r.device_id))];
  const [
    { data: deviceRows, error: deviceError },
    { data: lyricRows, error: lyricError },
    { data: otdRows, error: otdError },
  ] = await Promise.all([
    db.from('devices').select('id,push_token,tz,digest_hour,master_enabled').in('id', deviceIds),
    db.from('lyrics').select('id,slug,song,album,lyric,verified').order('id', { ascending: true }),
    db.from('on_this_day').select('id,month,day,year,text,deep_link'),
  ]);
  if (deviceError) {
    result.errors.push(`fun device lookup failed: ${deviceError.message}`);
    return result;
  }
  if (lyricError) {
    result.errors.push(`lyric pool lookup failed: ${lyricError.message}`);
    return result;
  }
  if (otdError) {
    result.errors.push(`on_this_day pool lookup failed: ${otdError.message}`);
    return result;
  }
  const devicesById = new Map(((deviceRows ?? []) as FunDeviceRow[]).map((d) => [d.id, d]));
  const lyricPool = (lyricRows ?? []) as LyricCandidate[];
  const onThisDayPool: OnThisDayEntry[] = (
    (otdRows ?? []) as {
      id: number;
      month: number;
      day: number;
      year: number | null;
      text: string;
      deep_link: string | null;
    }[]
  ).map((r) => ({
    id: r.id,
    month: r.month,
    day: r.day,
    year: r.year,
    text: r.text,
    deepLink: r.deep_link,
  }));

  for (const pref of prefRowsArr) {
    const device = devicesById.get(pref.device_id);
    if (!device) continue;
    result.devicesConsidered++;
    if (!device.master_enabled || !device.push_token) continue;
    const cadence = pref.cadence as FunCadence;
    if (!isFunSendDay(cadence, device.tz, now)) continue;
    if (!isWithinSendWindow(device.tz, now)) continue;

    const periodStart = startOfLocalPeriod(cadence, device.tz, now).toISOString();
    const { count: alreadySentCount, error: dedupeError } = await db
      .from('deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('kind', 'fun')
      .eq('category', pref.category)
      .gte('sent_at', periodStart);
    if (dedupeError) {
      result.errors.push(
        `fun dedupe check failed for ${device.id}/${pref.category}: ${dedupeError.message}`,
      );
      continue;
    }
    if ((alreadySentCount ?? 0) > 0) continue; // already sent this period

    // spec §6.4 hard ceiling (Phase 5): fun sends count against the same
    // device-wide 6/day floor as instant + digest sends.
    const sentSoFarToday = await totalDeliveriesToday(db, device.id, device.tz, now);
    if (sentSoFarToday >= HARD_CEILING_PER_DAY) {
      result.skippedHardCeiling++;
      continue;
    }

    if (pref.category === 'lyric_of_day') {
      await sendLyricOfDay(db, device, lyricPool, now, result);
    } else if (pref.category === 'on_this_day') {
      await sendOnThisDay(db, device, onThisDayPool, now, result);
    }
  }

  return result;
}

async function sendLyricOfDay(
  db: SupabaseClient,
  device: FunDeviceRow,
  lyricPool: readonly LyricCandidate[],
  now: Date,
  result: FunDispatchResult,
): Promise<void> {
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setUTCFullYear(twelveMonthsAgo.getUTCFullYear() - 1);
  const { data: historyRows, error: historyError } = await db
    .from('lyric_history')
    .select('lyric_id')
    .eq('device_id', device.id)
    .gte('sent_at', twelveMonthsAgo.toISOString());
  if (historyError) {
    result.errors.push(`lyric history lookup failed for ${device.id}: ${historyError.message}`);
    return;
  }
  const seenLyricIds = new Set(
    ((historyRows ?? []) as { lyric_id: number }[]).map((r) => r.lyric_id),
  );
  const lyric = selectLyricForDevice(lyricPool, seenLyricIds, true);
  if (!lyric) return; // exhausted the verified pool within the lookback window — nothing to send

  const sendResults = await sendPushBatch([
    {
      deviceId: device.id,
      pushToken: device.push_token as string,
      title: "Today's lyric",
      body: `\u201c${lyric.lyric}\u201d \u2014 ${lyric.song} \u2192`,
      deepLink: `https://www.longlivets.com/?song=${encodeURIComponent(lyric.slug)}`,
    },
  ]);
  const sendResult = sendResults[0];
  if (sendResult?.ok) {
    result.lyricsSent++;
    await Promise.all([
      db.from('deliveries').insert({
        device_id: device.id,
        event_id: null,
        kind: 'fun',
        category: 'lyric_of_day',
        sent_at: now.toISOString(),
      }),
      db
        .from('lyric_history')
        .upsert(
          { device_id: device.id, lyric_id: lyric.id, sent_at: now.toISOString() },
          { onConflict: 'device_id,lyric_id' },
        ),
    ]);
  } else {
    result.sendFailures++;
    result.errors.push(
      `lyric send failed for ${device.id}: ${sendResult && !sendResult.ok ? sendResult.error : 'no result'}`,
    );
  }
}

async function sendOnThisDay(
  db: SupabaseClient,
  device: FunDeviceRow,
  onThisDayPool: readonly OnThisDayEntry[],
  now: Date,
  result: FunDispatchResult,
): Promise<void> {
  const { month, day } = localMonthDay(device.tz, now);
  const entry = selectOnThisDayEntry(onThisDayPool, month, day);
  if (!entry) {
    result.onThisDaySkippedNoEntry++;
    return; // spec: skip silently, never send filler
  }

  const sendResults = await sendPushBatch([
    {
      deviceId: device.id,
      pushToken: device.push_token as string,
      title: 'On this day',
      body: entry.text,
      deepLink: entry.deepLink ?? 'https://www.longlivets.com/',
    },
  ]);
  const sendResult = sendResults[0];
  if (sendResult?.ok) {
    result.onThisDaySent++;
    await db.from('deliveries').insert({
      device_id: device.id,
      event_id: null,
      kind: 'fun',
      category: 'on_this_day',
      sent_at: now.toISOString(),
    });
  } else {
    result.sendFailures++;
    result.errors.push(
      `on_this_day send failed for ${device.id}: ${sendResult && !sendResult.ok ? sendResult.error : 'no result'}`,
    );
  }
}

function localMonthDay(tz: string, now: Date): { month: number; day: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { month: get('month'), day: get('day') };
  } catch {
    return { month: now.getUTCMonth() + 1, day: now.getUTCDate() };
  }
}

// ---------------------------------------------------------------------------
// Countdown dispatch: seeding + sending.
// ---------------------------------------------------------------------------

/** Countdown-eligible source categories — only announced drops with a firm
 * date make sense to count down to (spec: "for *announced* drops only").
 * `events.drop_at` (this phase's migration) is only ever set by a producer
 * that knows a real announced date, so any event with a non-null drop_at
 * in one of these categories is fair game. */
export const COUNTDOWN_ELIGIBLE_CATEGORIES: readonly string[] = [
  'song_drop',
  'album_news',
  'tour_news',
];

interface CountdownEventRow {
  id: string;
  title: string;
  category: string;
  drop_at: string | null;
}

/**
 * Seeds `countdown_sends` rows for every countdown-opted-in device against
 * every countdown-eligible event that has a `drop_at` and doesn't already
 * have rows for this device (idempotent — a re-run mid-window just
 * upserts the same milestones, primary key absorbs the duplicate).
 */
export async function scheduleCountdownsForPendingEvents(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<{ scheduled: number; errors: string[] }> {
  const out = { scheduled: 0, errors: [] as string[] };

  const { data: prefRows, error: prefError } = await db
    .from('notification_prefs')
    .select('device_id')
    .eq('category', 'countdowns')
    .eq('cadence', 'on');
  if (prefError) {
    out.errors.push(`countdown prefs lookup failed: ${prefError.message}`);
    return out;
  }
  const deviceIds = [...new Set((prefRows ?? []).map((r) => r.device_id as string))];
  if (deviceIds.length === 0) return out;

  const { data: eventRows, error: eventError } = await db
    .from('events')
    .select('id,title,category,drop_at')
    .in('category', COUNTDOWN_ELIGIBLE_CATEGORIES)
    .not('drop_at', 'is', null)
    .gte('drop_at', now.toISOString());
  if (eventError) {
    out.errors.push(`countdown events lookup failed: ${eventError.message}`);
    return out;
  }

  for (const event of (eventRows ?? []) as CountdownEventRow[]) {
    if (!event.drop_at) continue;
    const milestones = scheduleCountdowns(new Date(event.drop_at), now);
    for (const deviceId of deviceIds) {
      for (const m of milestones) {
        const { error } = await db.from('countdown_sends').upsert(
          {
            device_id: deviceId,
            event_id: event.id,
            milestone: m.milestone,
            scheduled_for: m.scheduledFor.toISOString(),
          },
          { onConflict: 'device_id,event_id,milestone', ignoreDuplicates: true },
        );
        if (error) {
          out.errors.push(`countdown schedule upsert failed: ${error.message}`);
        } else {
          out.scheduled++;
        }
      }
    }
  }

  return out;
}

interface CountdownSendRow {
  device_id: string;
  event_id: string;
  milestone: CountdownMilestone;
}

/** Sends every due (`scheduled_for <= now`, `sent_at is null`) countdown
 * row, then marks it sent. Device master-switch/push-token gating mirrors
 * every other send path in this system. */
export async function dispatchDueCountdowns(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<{ sent: number; sendFailures: number; skippedHardCeiling: number; errors: string[] }> {
  const out = { sent: 0, sendFailures: 0, skippedHardCeiling: 0, errors: [] as string[] };

  const { data: dueRows, error: dueError } = await db
    .from('countdown_sends')
    .select('device_id,event_id,milestone')
    .lte('scheduled_for', now.toISOString())
    .is('sent_at', null);
  if (dueError) {
    out.errors.push(`due countdown lookup failed: ${dueError.message}`);
    return out;
  }
  const rows = (dueRows ?? []) as CountdownSendRow[];
  if (rows.length === 0) return out;

  const deviceIds = [...new Set(rows.map((r) => r.device_id))];
  const eventIds = [...new Set(rows.map((r) => r.event_id))];
  const [{ data: deviceRows, error: deviceError }, { data: eventRows, error: eventError }] =
    await Promise.all([
      db.from('devices').select('id,push_token,master_enabled,tz').in('id', deviceIds),
      db.from('events').select('id,title').in('id', eventIds),
    ]);
  if (deviceError) {
    out.errors.push(`countdown device lookup failed: ${deviceError.message}`);
    return out;
  }
  if (eventError) {
    out.errors.push(`countdown event title lookup failed: ${eventError.message}`);
    return out;
  }
  const devicesById = new Map(
    (
      (deviceRows ?? []) as {
        id: string;
        push_token: string | null;
        master_enabled: boolean;
        tz: string;
      }[]
    ).map((d) => [d.id, d]),
  );
  const titleByEventId = new Map(
    ((eventRows ?? []) as { id: string; title: string }[]).map((e) => [e.id, e.title]),
  );

  for (const row of rows) {
    const device = devicesById.get(row.device_id);
    if (!device || !device.master_enabled || !device.push_token) continue;

    // spec §6.4 hard ceiling (Phase 5): countdown sends are kind='fun'
    // just like lyric_of_day/on_this_day — same device-wide 6/day floor.
    const sentSoFarToday = await totalDeliveriesToday(db, device.id, device.tz, now);
    if (sentSoFarToday >= HARD_CEILING_PER_DAY) {
      out.skippedHardCeiling++;
      continue;
    }

    const { title, body } = countdownCopy(
      row.milestone,
      titleByEventId.get(row.event_id) ?? 'A new drop',
    );
    const sendResults = await sendPushBatch([
      {
        deviceId: device.id,
        pushToken: device.push_token,
        title,
        body,
        deepLink: 'https://www.longlivets.com/?current=countdowns',
      },
    ]);
    const sendResult = sendResults[0];
    if (sendResult?.ok) {
      out.sent++;
      await Promise.all([
        db
          .from('countdown_sends')
          .update({ sent_at: now.toISOString() })
          .eq('device_id', row.device_id)
          .eq('event_id', row.event_id)
          .eq('milestone', row.milestone),
        db.from('deliveries').insert({
          device_id: device.id,
          event_id: row.event_id,
          kind: 'fun',
          category: 'countdowns',
          sent_at: now.toISOString(),
        }),
      ]);
    } else {
      out.sendFailures++;
      out.errors.push(
        `countdown send failed for ${device.id}/${row.milestone}: ${sendResult && !sendResult.ok ? sendResult.error : 'no result'}`,
      );
    }
  }

  return out;
}

/** Unused import guard — startOfLocalDay is re-exported for callers that
 * need the same local-day boundary the digest engine uses (kept for
 * symmetry with notification-digest.ts, not currently called directly by
 * this module's own logic). */
export { startOfLocalDay };
