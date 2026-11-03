// Argument validation shared by the backfill scripts. Fails closed: anything
// that is not exactly what the contract allows throws instead of defaulting.

/** BACKFILL_LIMIT: a non-negative integer, 0 = all. Unset means 0. */
export function parseLimit(raw) {
  if (raw === undefined) return 0;
  if (!/^[0-9]+$/.test(raw)) throw new Error(`invalid limit ${JSON.stringify(raw)}: expected a non-negative integer (0 = all)`);
  return Number.parseInt(raw, 10);
}

/** BACKFILL_DAYS: unset or empty means the live feed's own window; otherwise a non-negative integer of days (0 = the feed's window). */
export function parseDays(raw) {
  if (raw === undefined || raw === '') return undefined;
  if (!/^[0-9]*$/.test(raw)) throw new Error(`invalid days ${JSON.stringify(raw)}: expected a non-negative integer`);
  const days = Number.parseInt(raw, 10);
  return days > 0 ? days : undefined;
}

/** An ISO-8601 date or datetime; returns the canonical ISO string. */
export function parseIsoDate(raw) {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(raw)) {
    throw new Error(`invalid --since ${JSON.stringify(raw)}: expected an ISO date such as 2026-11-03 or 2026-11-03T12:00:00Z`);
  }
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) throw new Error(`invalid --since ${JSON.stringify(raw)}: not a real date`);
  return new Date(ms).toISOString();
}
