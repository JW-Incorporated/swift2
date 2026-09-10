/**
 * The number of whole days since the Unix epoch for a `YYYY-MM-DD` day key.
 * Parsed as UTC noon so a viewer's timezone can't nudge the boundary, and so
 * the value is a pure function of the calendar date string (testable, no
 * `Date.now()` inside).
 *
 * Shared by `era-secrets.ts` (apps/web — daily era-secret rotation) and
 * `gloss-rotation.ts` (this package — daily landing-masthead gloss rotation):
 * both need the same deterministic-daily-pick mechanism, so the date math
 * lives here once rather than being duplicated.
 */
export function epochDay(dayKey: string): number {
  const ms = Date.parse(`${dayKey}T12:00:00Z`);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 86_400_000);
}
