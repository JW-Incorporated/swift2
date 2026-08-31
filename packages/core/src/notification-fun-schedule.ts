// Notifications Phase 4 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§5)
// — fun-notification scheduling math. Pure, zero I/O (same testing
// philosophy as notification-digest-schedule.ts): every function is a
// plain function over already-known inputs so the 30-day simulation
// acceptance test (NOTIFICATIONS_PLAN.md Phase 4: "correct counts per
// cadence, zero lyric repeats, empty on_this_day dates send nothing") can
// run without a database.
//
// Fun categories use the SAME three-cadence set as the digest engine's
// daily/weekly, plus `monthly` (spec §4/§5: "Daily · Weekly · Monthly ·
// Off" for fun categories, vs. steady categories' "Instant · Daily ·
// Weekly · Off"). Reuses notification-digest-schedule.ts's send-window
// clamp/check (spec §6 gate 5 applies identically to fun sends) and
// notification-governor.ts's tz helpers — no logic fork, just an extra
// cadence value.
import { localHour, tzOffsetMinutes } from './notification-governor';
import {
  SEND_TIME_MIN_HOUR,
  SEND_TIME_MAX_HOUR,
  isWithinSendWindow,
} from './notification-digest-schedule';

export type FunCadence = 'daily' | 'weekly' | 'monthly';

export { isWithinSendWindow, SEND_TIME_MIN_HOUR, SEND_TIME_MAX_HOUR };

/** Weekly fun sends land on the same day as the digest engine's weekly
 * digest (Friday) — one consistent "this is the weekly day" mental model
 * across the whole notification system, not a second convention to learn.
 * JS Sunday=0..Saturday=6. */
const WEEKLY_TARGET_DAY = 5;

interface LocalDateParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 (Sun) - 6 (Sat)
}

function localDateParts(tz: string, at: Date): LocalDateParts {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(at);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return {
      year: Number(get('year')),
      month: Number(get('month')),
      day: Number(get('day')),
      weekday: weekdayMap[get('weekday')] ?? at.getUTCDay(),
    };
  } catch {
    return {
      year: at.getUTCFullYear(),
      month: at.getUTCMonth() + 1,
      day: at.getUTCDate(),
      weekday: at.getUTCDay(),
    };
  }
}

/** True on the device-local calendar day a fun notification of this
 * cadence is eligible to send AT ALL — daily is every day, weekly is
 * Friday, monthly is the 1st. Distinct from `isWithinSendWindow` (the
 * hour-of-day check) and from "already sent this period" (the dispatch
 * job's own dedupe query against `deliveries`) — this function only
 * answers "is today the right day". */
export function isFunSendDay(cadence: FunCadence, tz: string, now: Date): boolean {
  const { day, weekday } = localDateParts(tz, now);
  if (cadence === 'daily') return true;
  if (cadence === 'weekly') return weekday === WEEKLY_TARGET_DAY;
  return day === 1; // monthly
}

/** DST-safe UTC instant for local midnight on the device's tz — same
 * offset-at-that-instant technique as notification-governor.ts's
 * startOfLocalDay, extracted here so startOfLocalPeriod's weekly/monthly
 * cases can reuse it for an arbitrary (not-necessarily-today) date. */
function localMidnightUtc(tz: string, year: number, month: number, day: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0');
  const naiveUtcMidnight = new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00Z`);
  const offsetMinutes = tzOffsetMinutes(tz, naiveUtcMidnight);
  return new Date(naiveUtcMidnight.getTime() - offsetMinutes * 60_000);
}

/**
 * Start of the device-local period a fun send at `now` belongs to — the
 * dispatch job's dedupe boundary ("has this device already gotten a
 * lyric_of_day since this instant?"). `daily` = local midnight today;
 * `weekly` = local midnight on the most recent local Sunday (so a Friday
 * send and any other send that same local week collide correctly);
 * `monthly` = local midnight on the 1st of the current local month.
 */
export function startOfLocalPeriod(cadence: FunCadence, tz: string, now: Date): Date {
  const { year, month, day, weekday } = localDateParts(tz, now);
  if (cadence === 'daily') return localMidnightUtc(tz, year, month, day);
  if (cadence === 'monthly') return localMidnightUtc(tz, year, month, 1);
  // weekly: back up `weekday` days to the most recent Sunday, via a
  // UTC-safe day-roll (Date.UTC correctly handles month/year underflow).
  const sunday = new Date(Date.UTC(year, month - 1, day - weekday));
  return localMidnightUtc(
    tz,
    sunday.getUTCFullYear(),
    sunday.getUTCMonth() + 1,
    sunday.getUTCDate(),
  );
}

/** Re-exported so callers don't need a separate import from
 * notification-governor.ts just for the local-hour helper. */
export { localHour };
