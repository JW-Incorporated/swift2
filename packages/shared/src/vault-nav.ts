// Pure navigation + snap math for the Vault time machine. No I/O, no view code —
// this is the shared logic under both the web scrubber and the future native one.
import type { Era, YearMonth } from './vault-types';

/** Eras sorted by their timeline order, ascending. */
export function orderedEras(eras: readonly Era[]): Era[] {
  return [...eras].sort((a, b) => a.order - b.order);
}

/**
 * Which era a normalized scrub position (0..1 across all eras, equal slots)
 * lands in. Returns -1 when there are no eras.
 */
export function eraIndexAtPosition(count: number, position: number): number {
  if (count <= 0) return -1;
  const clamped = Math.min(0.999999, Math.max(0, position));
  return Math.min(count - 1, Math.floor(clamped * count));
}

/** The center position (0..1) an era index snaps to. */
export function positionForEraIndex(count: number, index: number): number {
  if (count <= 0) return 0;
  const i = Math.min(count - 1, Math.max(0, index));
  return (i + 0.5) / count;
}

/** Snap a free scrub position to the nearest era's center (v1 snaps to eras only). */
export function snapPositionToEra(count: number, position: number): number {
  return positionForEraIndex(count, eraIndexAtPosition(count, position));
}

/**
 * The index of the era containing an ISO date, or — if none contains it — the
 * nearest era by distance to its [start, end] window. Returns -1 for empty
 * input or an unparseable date.
 */
export function eraIndexForDate(eras: readonly Era[], isoDate: string): number {
  const ordered = orderedEras(eras);
  if (ordered.length === 0) return -1;
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return -1;

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ordered.length; i += 1) {
    const era = ordered[i]!;
    const start = Date.parse(era.startDate);
    const end = Date.parse(era.endDate);
    if (t >= start && t <= end) return i;
    const distance = t < start ? start - t : t - end;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** Every year/month from an era's start through its end (inclusive), in order. */
export function monthsInEra(era: Era): YearMonth[] {
  const start = new Date(era.startDate);
  const end = new Date(era.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const months: YearMonth[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1; // 1–12
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}
