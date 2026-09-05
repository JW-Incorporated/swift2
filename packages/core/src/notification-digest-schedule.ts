// Notifications Phase 3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §5) —
// digest scheduling math. Pure, zero I/O (same testing philosophy as
// notification-governor.ts's gates): every function here is a plain
// function over already-known inputs, so the single biggest risk this
// phase calls out ("timezone correctness... write tests covering at least
// 3 timezones including a DST transition day, verifying no double-send and
// no zero-send") can be unit-tested exhaustively without a database.
//
// DST-safety technique matches notification-governor.ts's
// startOfLocalDay()/tzOffsetMinutes(): read the device's local wall-clock
// parts via Intl, then correct to UTC using the offset AT THAT SPECIFIC
// INSTANT (never a fixed/cached offset) — this is what makes a
// spring-forward/fall-back day compute correctly without hand-rolled DST
// tables.
import { localHour, tzOffsetMinutes } from './notification-governor';

export type DigestCadence = 'daily' | 'weekly';

/** spec §5: "Weekly — same, sent Friday at digest time." Friday = 5 in
 * JS's Sunday=0..Saturday=6 day numbering. */
const WEEKLY_TARGET_DAY = 5;

/** spec §6 gate 5: "digests and fun notifications only fire between
 * 8 AM–9 PM local." A device's chosen `digest_hour` (spec §9's default 9,
 * user-adjustable in Settings) is NOT validated against this range at the
 * settings API layer (a user could type any hour), so the scheduler clamps
 * here instead of trusting the stored value — the one place that matters
 * for actually not sending outside the sane window. */
export const SEND_TIME_MIN_HOUR = 8;
export const SEND_TIME_MAX_HOUR = 21;

/** Clamps an arbitrary requested hour into the spec §6 gate 5 sane window.
 * Exported so both the scheduler (below) and the router's send-time gate
 * apply the exact same bounds. */
export function clampToSendWindow(hour: number): number {
  if (!Number.isFinite(hour)) return SEND_TIME_MIN_HOUR;
  const h = ((Math.trunc(hour) % 24) + 24) % 24;
  if (h < SEND_TIME_MIN_HOUR) return SEND_TIME_MIN_HOUR;
  if (h > SEND_TIME_MAX_HOUR) return SEND_TIME_MAX_HOUR;
  return h;
}

interface LocalDateParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 (Sun) - 6 (Sat)
}

/** The device's local calendar date (and weekday) at the given instant. */
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

/** Converts a device-local calendar date + local hour into the correct UTC
 * instant, DST-safe. A single offset probe (same technique as
 * notification-governor.ts's startOfLocalDay) can land on the WRONG side
 * of a transition on the transition day itself — e.g. probing "09:00
 * treated as UTC" for a spring-forward day can read the pre-transition
 * (PST) offset even though the real 9am-local instant falls after the
 * 2am->3am jump into PDT. A one-step fixed-point refinement (probe again
 * at the first candidate instant, which is much closer to the real
 * instant than the naive guess) resolves this: the offset can only change
 * once around a single transition, so this always converges in at most
 * one extra iteration. */
function localDateHourToUtc(tz: string, year: number, month: number, day: number, hour: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0');
  const naiveUtc = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:00:00Z`);
  const firstOffset = tzOffsetMinutes(tz, naiveUtc);
  const candidate = new Date(naiveUtc.getTime() - firstOffset * 60_000);
  const refinedOffset = tzOffsetMinutes(tz, candidate);
  return new Date(naiveUtc.getTime() - refinedOffset * 60_000);
}

/**
 * Computes the next digest send instant (UTC) for a device, at or after
 * `now`. `daily` fires every local day at `digestHour` (today if that time
 * hasn't passed yet, otherwise tomorrow); `weekly` fires the next Friday at
 * `digestHour` (today if it's already Friday and the time hasn't passed).
 *
 * `digestHour` is clamped into the spec §6 gate 5 sane window before use —
 * callers never need to pre-validate it.
 */
export function nextDigestOccurrence(
  cadence: DigestCadence,
  tz: string,
  digestHour: number,
  now: Date,
): Date {
  const hour = clampToSendWindow(digestHour);
  const { year, month, day, weekday } = localDateParts(tz, now);

  if (cadence === 'daily') {
    const todayAt = localDateHourToUtc(tz, year, month, day, hour);
    if (todayAt.getTime() > now.getTime()) return todayAt;
    // Tomorrow's local date — compute via a UTC-safe day roll rather than
    // hand-rolled month/year arithmetic (Date handles month/year overflow
    // correctly when fed through Date.UTC).
    const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
    return localDateHourToUtc(
      tz,
      tomorrow.getUTCFullYear(),
      tomorrow.getUTCMonth() + 1,
      tomorrow.getUTCDate(),
      hour,
    );
  }

  // weekly: next Friday (today counts if it's Friday and time hasn't passed).
  let daysUntilFriday = (WEEKLY_TARGET_DAY - weekday + 7) % 7;
  if (daysUntilFriday === 0) {
    const todayAt = localDateHourToUtc(tz, year, month, day, hour);
    if (todayAt.getTime() > now.getTime()) return todayAt;
    daysUntilFriday = 7; // today's Friday slot already passed — next week
  }
  const target = new Date(Date.UTC(year, month - 1, day + daysUntilFriday));
  return localDateHourToUtc(
    tz,
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    target.getUTCDate(),
    hour,
  );
}

/** Re-exported so callers of this module don't need a separate import from
 * notification-governor.ts just for the send-time-sanity check below. */
export { localHour };

/**
 * spec §6 gate 5: digests only actually fire while the device's local clock
 * reads within [SEND_TIME_MIN_HOUR, SEND_TIME_MAX_HOUR]. A digest whose
 * `scheduled_for` has arrived but whose local hour has drifted outside the
 * window (e.g. cron ran late, or the row was queued near a boundary) simply
 * waits for the next 15-minute tick rather than sending late-night —
 * nothing is dropped, `digest_queue` rows are untouched until this passes.
 */
export function isWithinSendWindow(tz: string, now: Date): boolean {
  const hour = localHour(tz, now);
  return hour >= SEND_TIME_MIN_HOUR && hour <= SEND_TIME_MAX_HOUR;
}
