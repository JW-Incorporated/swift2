// Expiry date-math (proposal §4.6, PLAN.md Stage 3): current_item 90d,
// fan_signal 30d, live_theory 60d from LAST activity, a live_theory quiet
// 45d flips to `abandoned`. Simple date-math on write/read, no separate cron
// — every write recomputes expires_at from "now" so continued activity
// extends the TTL (the schema's own column DEFAULTs only cover first
// insert, supabase/migrations/20260901000000_knowledge_engine.sql).

const DAY_MS = 24 * 60 * 60 * 1000;

export const CURRENT_ITEM_EXPIRY_DAYS = 90;
export const FAN_SIGNAL_EXPIRY_DAYS = 30;
export const LIVE_THEORY_EXPIRY_DAYS = 60;
export const LIVE_THEORY_ABANDON_QUIET_DAYS = 45;

/** ISO 8601 timestamp `days` from `from` (defaults to now). */
export function expiresAt(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() + days * DAY_MS).toISOString();
}

/** True when a live_theory's last_seen_on (YYYY-MM-DD) is quiet long enough to abandon. */
export function isTheoryAbandoned(lastSeenOn: string, today: Date = new Date()): boolean {
  const last = new Date(`${lastSeenOn}T00:00:00Z`).getTime();
  const now = today.getTime();
  return now - last >= LIVE_THEORY_ABANDON_QUIET_DAYS * DAY_MS;
}
