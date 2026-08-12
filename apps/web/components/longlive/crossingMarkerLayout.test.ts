import { describe, expect, it } from 'vitest';
import { MIN_MARKER_GAP_PX, resolveCrossingMarkerTops } from './crossingMarkerLayout';
import { CAREER_START_MS, careerEndMs } from '../../lib/longlive/eras';
import { CROSSING_THREADS, threadCrossings } from '../../lib/longlive/lenses';
import type { LensId } from '../../lib/longlive/types';

const RAIL_HEIGHT = 900; // mirrors Crossings.tsx
const GAP_PCT = (MIN_MARKER_GAP_PX / RAIL_HEIGHT) * 100;
const EPS = 1e-9;

/** Raw marker tops exactly as Crossings.tsx computes them. */
function rawTops(a: LensId, b: LensId): number[] {
  const end = careerEndMs();
  const span = Math.max(1, end - CAREER_START_MS);
  const pct = (ms: number) => Math.min(1, Math.max(0, (end - ms) / span)) * 100;
  return threadCrossings(a, b).map(
    (c) => (pct(new Date(c.a.date).getTime()) + pct(new Date(c.b.date).getTime())) / 2,
  );
}

const minAdjacentGap = (tops: number[]) => {
  const s = [...tops].sort((a, b) => a - b);
  return Math.min(...s.slice(1).map((v, i) => v - s[i]));
};

describe('resolveCrossingMarkerTops (#701, WCAG 2.5.8)', () => {
  it('leaves non-overlapping markers at their true positions', () => {
    expect(resolveCrossingMarkerTops([10, 50, 90], RAIL_HEIGHT)).toEqual([10, 50, 90]);
  });

  it('spreads a stacked group symmetrically around its true midpoint', () => {
    const [a, b, c] = resolveCrossingMarkerTops([50, 50, 50], RAIL_HEIGHT);
    expect(a).toBeCloseTo(50 - GAP_PCT, 6);
    expect(b).toBeCloseTo(50, 6);
    expect(c).toBeCloseTo(50 + GAP_PCT, 6);
  });

  it('clamps to the rail edges without collapsing the gap', () => {
    expect(resolveCrossingMarkerTops([0, 0], RAIL_HEIGHT)[0]).toBeCloseTo(0, 6);
    expect(resolveCrossingMarkerTops([100, 100], RAIL_HEIGHT)[0]).toBeCloseTo(100 - GAP_PCT, 6);
    expect(minAdjacentGap(resolveCrossingMarkerTops([0, 0, 100, 100], RAIL_HEIGHT))).toBeGreaterThanOrEqual(GAP_PCT - EPS);
  });

  it('returns positions in input order, preserving date order on the rail', () => {
    const raw = [80, 10, 80.1, 40];
    const resolved = resolveCrossingMarkerTops(raw, RAIL_HEIGHT);
    const byRaw = raw.map((_, i) => i).sort((a, b) => raw[a] - raw[b] || a - b);
    const byResolved = resolved.map((_, i) => i).sort((a, b) => resolved[a] - resolved[b] || a - b);
    expect(byResolved).toEqual(byRaw);
    expect(minAdjacentGap(resolved)).toBeGreaterThanOrEqual(GAP_PCT - EPS);
  });

  it('keeps an overfull pile-up separated even past the rail edge', () => {
    expect(minAdjacentGap(resolveCrossingMarkerTops(Array(50).fill(99), RAIL_HEIGHT))).toBeGreaterThanOrEqual(GAP_PCT - EPS);
  });

  // Guard every curated thread pair so newly-authored crossings can't
  // silently reintroduce sub-24px targets.
  it('gives every real thread pair ≥24px between marker centres', () => {
    let sawRawViolation = false;
    for (let i = 0; i < CROSSING_THREADS.length; i += 1) {
      for (let j = i + 1; j < CROSSING_THREADS.length; j += 1) {
        const raw = rawTops(CROSSING_THREADS[i], CROSSING_THREADS[j]);
        if (raw.length > 1 && minAdjacentGap(raw) < GAP_PCT) sawRawViolation = true;
        const resolved = resolveCrossingMarkerTops(raw, RAIL_HEIGHT);
        expect(resolved).toHaveLength(raw.length);
        if (resolved.length > 1) expect(minAdjacentGap(resolved)).toBeGreaterThanOrEqual(GAP_PCT - EPS);
        for (const top of resolved) {
          expect(top).toBeGreaterThanOrEqual(0);
          expect(top).toBeLessThanOrEqual(100);
        }
      }
    }
    // Prove the pass is load-bearing: at least one pair overlaps raw.
    expect(sawRawViolation).toBe(true);
  });
});
