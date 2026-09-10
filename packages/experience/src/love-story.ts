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
 * Hit-area allocation for the timeline band. Painted segments stay
 * proportional (a two-month relationship must still *look* two months long),
 * so the clickable ranges are allocated separately and tile
 * [domainStart, domainEnd] in order without overlapping.
 *
 * Two properties, in priority order:
 *
 * 1. **A range always contains its own segment's painted centre.** This is
 *    the invariant, and it is not negotiable: clicking the block you can see
 *    must open the chapter you clicked. #1532's allocator broke it — it
 *    seeded boundaries at the midpoint of adjacent painted *edges* and then
 *    only ever pushed them RIGHT to make room, so the displacement
 *    accumulated across a run of slivers and dragged ranges clean off their
 *    own segments. Measured on the live 18-entry dataset, 8 of 18 segments
 *    opened a *different* entry when you clicked their painted centre at the
 *    band's real 862px width (clicking Harry Styles opened Conor Kennedy);
 *    at 640px it was 13 of 18. It passed axe because every range was ≥24px —
 *    it just pointed at the wrong thing.
 *
 * 2. **Subject to (1), every range is ≥ `minWidth`** (same unit as the
 *    domain — WCAG 2.5.8's 24px expressed as a percentage of band width).
 *
 * Boundaries therefore seed at the midpoint of adjacent painted *centres*
 * (nearest-centre / Voronoi: click resolves to the closest block, which is
 * what a user expects), then forward+backward min-gap passes widen slivers by
 * taking space from neighbours that can spare it — with every boundary
 * clamped into `[centre(i-1), centre(i)]` so widening can never step over a
 * neighbour's centre and re-break property 1.
 *
 * Where the two properties genuinely conflict, (1) wins and (2) is dropped:
 * three centres inside a 25px span cannot all own 24px, and no allocator can
 * change that. Those ranges are covered by WCAG 2.5.8's "Equivalent"
 * exception — the same chapter is reachable from the full-width row in the
 * chapter list that this thread renders below the band at every viewport.
 */
export function allocateHitRanges(
  segments: Array<{ start: number; end: number }>,
  minWidth: number,
  domainStart = 0,
  domainEnd = 100,
): HitRange[] {
  const n = segments.length;
  if (n === 0) return [];
  const centres = segments.map((s) => (s.start + s.end) / 2);
  const m = Math.min(minWidth, (domainEnd - domainStart) / n);
  // A boundary must keep at least KEEP_OFF of the inter-centre gap clear of
  // each centre, so every centre sits STRICTLY inside its own range with real
  // margin. Landing exactly on a centre is not good enough:
  // `document.elementFromPoint` at an exact boundary resolves to the
  // neighbour, and percentage layout rounds the painted rect and the button
  // rect independently, so a click on the middle pixel of a two-month sliver
  // would still open the wrong chapter. At 0.25 the guaranteed margin is a
  // quarter of the local gap — ≥0.5px even in the tightest cluster on the
  // narrowest phone — and widening still recovers ~75% of the slack a
  // neighbour can spare.
  const KEEP_OFF = 0.25;
  // `i` always indexes an existing centre inside these helpers' call sites
  // (1 <= i <= n-1, and `centres` has length n) — the `!`s document that
  // invariant for `noUncheckedIndexedAccess` rather than adding a runtime
  // check the array-length math already guarantees.
  const lo = (i: number) => centres[i - 1]! + KEEP_OFF * (centres[i]! - centres[i - 1]!);
  const hi = (i: number) => centres[i]! - KEEP_OFF * (centres[i]! - centres[i - 1]!);
  const b: number[] = new Array(n + 1);
  b[0] = domainStart;
  b[n] = domainEnd;
  for (let i = 1; i < n; i++) b[i] = (centres[i - 1]! + centres[i]!) / 2;
  // Widen forward, then backward, clamping into (centres[i-1], centres[i]) on
  // every write. The clamp boxes are disjoint and increasing
  // (hi(i) < centres[i] < lo(i+1)), so ranges can never invert or reorder.
  for (let i = 1; i < n; i++) {
    b[i] = Math.min(Math.max(b[i]!, b[i - 1]! + m), hi(i));
  }
  for (let i = n - 1; i >= 1; i--) {
    b[i] = Math.max(Math.min(b[i]!, b[i + 1]! - m), lo(i));
  }
  return segments.map((_, i) => ({ start: b[i]!, end: b[i + 1]! }));
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
