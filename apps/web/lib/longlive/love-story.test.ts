import { describe, expect, it } from 'vitest';
import { allocateHitRanges, durationLabel, mergedTimeline, monthsBetween, previousRelationship, soloLeadIn } from './love-story';
import type { Relationship, SinglePeriod } from './types';

const rels: Relationship[] = [
  { id: 'r1', name: 'Alex', start: '2010-01-01', end: '2010-06-01', eraIds: ['debut'], songs: [], note: '' },
  { id: 'r2', name: 'Sam', start: '2011-01-01', end: null, eraIds: ['debut'], songs: [], note: '' },
];
const singles: SinglePeriod[] = [{ id: 's1', start: '2010-06-01', end: '2011-01-01', eraIds: ['debut'], note: '' }];

describe('mergedTimeline', () => {
  it('interleaves relationships and singles in chronological order', () => {
    const timeline = mergedTimeline(rels, singles);
    expect(timeline.map((e) => e.id)).toEqual(['r1', 's1', 'r2']);
  });
});

describe('monthsBetween / durationLabel', () => {
  it('computes whole months for a closed range', () => {
    expect(monthsBetween('2010-01-01', '2010-06-01')).toBe(5);
    expect(durationLabel('2010-01-01', '2010-06-01')).toBe('5mo');
  });

  it('formats a multi-year span as years + remainder months', () => {
    expect(durationLabel('2016-11-12', '2023-04-08')).toBe('6y 5mo');
  });
});

describe('previousRelationship', () => {
  it('finds the relationship that most recently ended before an entry started', () => {
    const timeline = mergedTimeline(rels, singles);
    const prev = previousRelationship(timeline[1], timeline);
    expect(prev?.id).toBe('r1');
  });

  it('returns null when nothing preceded the entry', () => {
    const timeline = mergedTimeline(rels, singles);
    expect(previousRelationship(timeline[0], timeline)).toBeNull();
  });
});

describe('allocateHitRanges', () => {
  // Regression for #658: a run of contiguous sliver segments (5–12px painted
  // at 1280px wide, ~0.5–1% each) must still yield ≥24px (2% of ~1200px) hit
  // ranges that tile the band without overlapping.
  const slivers = [0, 16, 16.5, 17.4, 18.2, 19.2, 40, 100];
  const sliverRun = slivers.slice(0, -1).map((s, i) => ({ start: s, end: slivers[i + 1] }));
  const MIN = 2;

  it('gives every segment the minimum width, ordered and tiling the domain', () => {
    const ranges = allocateHitRanges(sliverRun, MIN);
    expect(ranges[0].start).toBe(0);
    expect(ranges[ranges.length - 1].end).toBe(100);
    ranges.forEach((r, i) => {
      expect(r.end - r.start).toBeGreaterThanOrEqual(MIN - 1e-9);
      if (i > 0) expect(r.start).toBeCloseTo(ranges[i - 1].end, 9);
    });
  });

  it('leaves boundaries between roomy segments at the midpoint of their painted edges', () => {
    const [a, b] = allocateHitRanges([{ start: 0, end: 30 }, { start: 32, end: 100 }], MIN);
    expect(a.end).toBe(31);
    expect(b.start).toBe(31);
  });

  it('shares the shortfall evenly when the domain cannot fit every minimum', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ start: i * 20, end: (i + 1) * 20 }));
    allocateHitRanges(five, 30, 0, 100).forEach((r) => expect(r.end - r.start).toBeCloseTo(20, 9));
  });

  it('returns an empty allocation for an empty timeline', () => {
    expect(allocateHitRanges([], MIN)).toEqual([]);
  });
});

describe('soloLeadIn', () => {
  it('names the prior relationship when one exists', () => {
    const timeline = mergedTimeline(rels, singles);
    expect(soloLeadIn(singles[0], timeline)).toBe('Just out of her relationship with Alex.');
  });

  it('falls back to an age-based lead-in for the very first solo period', () => {
    const first: SinglePeriod = { id: 's0', start: '2006-01-01', end: '2008-01-01', eraIds: ['debut'], note: '' };
    const timeline = mergedTimeline(rels, [first, ...singles]);
    expect(soloLeadIn(first, timeline)).toMatch(/^She was 16/);
  });
});
