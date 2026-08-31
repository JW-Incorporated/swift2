// Notifications Phase 2 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §6/§9)
// — Governor v1, gates 1-4. Pure decision logic, zero I/O: every gate is a
// plain function over already-loaded state, so the safety-critical path can
// be unit-tested exhaustively without a database (per this task's own
// instruction: "unit-test every gate individually, including cap-overflow
// and quiet-hours-hold paths, with adversarial test cases").
//
// The DB-touching orchestration (loading device/prefs/recent-deliveries,
// calling evaluateGovernor, writing the delivery row) lives in
// notification-router.ts — this module only decides.
//
// Gate order matches spec §6 exactly: 1 master/snooze, 2 quiet hours,
// 3 coalescing, 4 daily cap. Gate 5 (send-time sanity, digests/fun only)
// and the 6/day hard ceiling are out of Phase 2 scope (digest/fun categories
// don't exist yet; the hard ceiling is Phase 5's "governor polish").

export interface GovernorDeviceSettings {
  masterEnabled: boolean;
  snoozeUntil: string | null;
  dailyCap: number;
  quietStart: number; // local hour, 0-23
  quietEnd: number; // local hour, 0-23
  tz: string; // IANA timezone
}

export interface GovernorEvent {
  category: string;
  tier: number;
}

export type GovernorDecision =
  | { action: 'send' }
  | { action: 'skip'; reason: 'master_off' }
  | { action: 'skip'; reason: 'snoozed'; until: string }
  | { action: 'hold'; reason: 'quiet_hours'; resumeAtLocalHour: number }
  | { action: 'skip'; reason: 'coalesced'; withinMinutes: number }
  | { action: 'skip'; reason: 'daily_cap'; dailyCap: number };

export interface GovernorContext {
  now: Date;
  device: GovernorDeviceSettings;
  event: GovernorEvent;
  /** `sent_at` timestamps of this device's deliveries in the SAME category,
   * already filtered by the caller to a generous lookback window (the
   * coalescing gate only cares whether the most recent one is < 30 min
   * old — no need to load more than that). */
  recentSameCategoryDeliveries: readonly string[];
  /** Count of this device's `kind='instant'` deliveries already sent since
   * the start of the device's current local day. */
  instantDeliveriesToday: number;
}

const COALESCE_WINDOW_MS = 30 * 60 * 1000;

/** Gate 1 — master switch & snooze (spec §6.1). */
export function gateMasterAndSnooze(
  device: GovernorDeviceSettings,
  now: Date,
): GovernorDecision | null {
  if (!device.masterEnabled) return { action: 'skip', reason: 'master_off' };
  if (device.snoozeUntil && new Date(device.snoozeUntil).getTime() > now.getTime()) {
    return { action: 'skip', reason: 'snoozed', until: device.snoozeUntil };
  }
  return null;
}

/** The device's current local hour (0-23), via its IANA tz. Falls back to
 * UTC hour if the tz string is somehow unresolvable (never throws — a bad
 * tz value must not crash the governor mid-dispatch). */
export function localHour(tz: string, now: Date): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).format(now);
    // en-US hour12:false can format midnight as "24" on some ICU builds —
    // normalize into 0-23.
    const h = Number(formatted) % 24;
    return Number.isFinite(h) ? h : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

/** Gate 2 — quiet hours (spec §6.2). "Nothing bypasses quiet hours" — every
 * category, T1 included, holds during the window. The router simply
 * re-evaluates the still-undelivered event on its next periodic run, which
 * naturally becomes "deliver at quiet-hours end" once local time passes
 * `quiet_end` — no separate queue table needed for that behavior in Phase 2
 * (digest_queue is Phase 3 scope). Wraps midnight correctly (e.g. 22-8). */
export function gateQuietHours(device: GovernorDeviceSettings, now: Date): GovernorDecision | null {
  const hour = localHour(device.tz, now);
  const { quietStart, quietEnd } = device;
  if (quietStart === quietEnd) return null; // a 0-width window means quiet hours are effectively off
  const inWindow =
    quietStart < quietEnd
      ? hour >= quietStart && hour < quietEnd
      : hour >= quietStart || hour < quietEnd; // wraps midnight
  if (!inWindow) return null;
  return { action: 'hold', reason: 'quiet_hours', resumeAtLocalHour: quietEnd };
}

/** Gate 3 — 30-min coalescing (spec §6.3). Distinct from `dedupe_key`
 * (which kills identical detections at INSERT time via the DB's unique
 * constraint) — this collapses multiple DIFFERENT events in the same
 * category within a rolling 30-min window into a single push per device.
 * "10 events in 1 minute should coalesce to 1 push, not 10": the FIRST
 * event in the window sends; every subsequent one in that same window is
 * skipped as coalesced (its content is still in `events`, so it's never
 * lost — Phase 3's digest and the in-app inbox both read `events`
 * directly, not `deliveries`). */
export function gateCoalescing(
  recentSameCategoryDeliveries: readonly string[],
  now: Date,
): GovernorDecision | null {
  const mostRecent = recentSameCategoryDeliveries
    .map((s) => new Date(s).getTime())
    .filter((t) => Number.isFinite(t))
    .reduce((max, t) => Math.max(max, t), -Infinity);
  if (mostRecent === -Infinity) return null;
  const ageMs = now.getTime() - mostRecent;
  if (ageMs < COALESCE_WINDOW_MS) {
    return { action: 'skip', reason: 'coalesced', withinMinutes: 30 };
  }
  return null;
}

/** Gate 4 — daily cap (spec §6.4). Overflow rolls into the next digest per
 * spec — Phase 2 has no digest_queue yet (Phase 3), so an overflowed event
 * simply stays undelivered; Phase 3's router update is expected to change
 * this gate's caller to enqueue instead of drop. This gate's OWN contract
 * (what Phase 2 must prove) is just: never exceed `dailyCap` instant sends
 * per device per local day. */
export function gateDailyCap(
  device: GovernorDeviceSettings,
  instantDeliveriesToday: number,
): GovernorDecision | null {
  if (instantDeliveriesToday >= device.dailyCap) {
    return { action: 'skip', reason: 'daily_cap', dailyCap: device.dailyCap };
  }
  return null;
}

/** Runs every gate in spec §6 order, returning the FIRST gate's decision
 * that isn't a pass-through (`null`), or `{ action: 'send' }` if every gate
 * clears. Order matters: master/snooze before quiet hours before
 * coalescing before the cap — a snoozed device should report "snoozed",
 * never "daily_cap", even if it happens to also be over cap. */
export function evaluateGovernor(ctx: GovernorContext): GovernorDecision {
  return (
    gateMasterAndSnooze(ctx.device, ctx.now) ??
    gateQuietHours(ctx.device, ctx.now) ??
    gateCoalescing(ctx.recentSameCategoryDeliveries, ctx.now) ??
    gateDailyCap(ctx.device, ctx.instantDeliveriesToday) ?? { action: 'send' }
  );
}

/** Start-of-local-day boundary (as a UTC ISO timestamp) for a device's tz —
 * used by the router to query "how many instant deliveries today" from
 * `deliveries.sent_at >= this`. Computed via Intl rather than a fixed UTC
 * offset so DST transitions are handled by the platform's tz database, not
 * hand-rolled math. */
export function startOfLocalDay(tz: string, now: Date): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const y = get('year');
    const m = get('month');
    const d = get('day');
    // Midnight in the device's tz, expressed correctly in UTC: construct a
    // UTC instant from the y/m/d local date at 00:00, then correct for the
    // tz's offset at that instant (handles DST because the offset is read
    // from the SAME instant we're correcting, not assumed fixed).
    const naiveUtcMidnight = new Date(`${y}-${m}-${d}T00:00:00Z`);
    const offsetMinutes = tzOffsetMinutes(tz, naiveUtcMidnight);
    return new Date(naiveUtcMidnight.getTime() - offsetMinutes * 60_000);
  } catch {
    // Unresolvable tz — fall back to UTC midnight rather than throwing.
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}

/** Minutes to ADD to local time to get UTC, at the given instant (handles
 * DST by evaluating the offset at that specific instant, not a fixed
 * constant). E.g. for America/Los_Angeles in winter this is +480 (UTC-8). */
function tzOffsetMinutes(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}
