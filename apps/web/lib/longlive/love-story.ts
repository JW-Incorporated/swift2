import type { Relationship, SinglePeriod } from './types';

export type LoveStoryEntry = ({ kind: 'relationship' } & Relationship) | ({ kind: 'single' } & SinglePeriod);

const TAYLOR_BIRTH = '1989-12-13';

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

export function monthsBetween(start: string, end: string | null): number {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
}

export function durationLabel(start: string, end: string | null): string {
  const months = monthsBetween(start, end);
  if (months < 12) return `${months}mo`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs}y ${rem}mo` : `${yrs}y`;
}

function ageAt(iso: string): number {
  const b = new Date(TAYLOR_BIRTH);
  const d = new Date(iso);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age;
}

/** Merges relationships + single periods into one chronologically sorted timeline. */
export function mergedTimeline(relationships: Relationship[], singles: SinglePeriod[]): LoveStoryEntry[] {
  const entries: LoveStoryEntry[] = [
    ...relationships.map((r) => ({ kind: 'relationship' as const, ...r })),
    ...singles.map((s) => ({ kind: 'single' as const, ...s })),
  ];
  return entries.sort((a, b) => toMs(a.start) - toMs(b.start));
}

export interface HitRange {
  start: number;
  end: number;
}

/**
 * WCAG 2.5.8 hit-area allocation for the timeline band (#658): painted
 * segments stay proportional, but each clickable range must be ≥ `minWidth`
 * (same unit as the domain). Boundaries seed at the midpoint between adjacent
 * painted edges, then forward+backward passes push them apart until every
 * range has the minimum — slivers take space from neighbors that can spare
 * it. Ranges tile [domainStart, domainEnd] in order without overlapping; if
 * n × minWidth exceeds the domain, the shortfall is shared evenly instead of
 * letting ranges collapse.
 */
export function allocateHitRanges(
  segments: Array<{ start: number; end: number }>,
  minWidth: number,
  domainStart = 0,
  domainEnd = 100,
): HitRange[] {
  const n = segments.length;
  if (n === 0) return [];
  const m = Math.min(minWidth, (domainEnd - domainStart) / n);
  const b: number[] = new Array(n + 1);
  b[0] = domainStart;
  b[n] = domainEnd;
  for (let i = 1; i < n; i++) {
    b[i] = (segments[i - 1].end + segments[i].start) / 2;
  }
  for (let i = 1; i < n; i++) b[i] = Math.max(b[i], b[i - 1] + m);
  for (let i = n - 1; i >= 1; i--) b[i] = Math.min(b[i], b[i + 1] - m);
  return segments.map((_, i) => ({ start: b[i], end: b[i + 1] }));
}

/** The relationship most recently ended before this entry began. */
export function previousRelationship(entry: LoveStoryEntry, timeline: LoveStoryEntry[]): (Relationship & { kind: 'relationship' }) | null {
  const rels = timeline.filter(
    (e): e is Relationship & { kind: 'relationship' } => e.kind === 'relationship' && toMs(e.start) < toMs(entry.start),
  );
  if (rels.length === 0) return null;
  return rels.reduce((latest, r) => {
    const latestEnd = latest.end ? toMs(latest.end) : Date.now();
    const rEnd = r.end ? toMs(r.end) : Date.now();
    return rEnd >= latestEnd ? r : latest;
  });
}

/**
 * A solo period's recap always opens with where she was coming from. The
 * very first solo period (no prior relationship) opens with her age instead.
 */
export function soloLeadIn(entry: SinglePeriod, timeline: LoveStoryEntry[]): string {
  const prev = previousRelationship({ kind: 'single', ...entry }, timeline);
  if (!prev) {
    return `She was ${ageAt(entry.start)} — barely out of high school, still writing about love mostly from the outside looking in.`;
  }
  return `Just out of her relationship with ${prev.name}.`;
}
