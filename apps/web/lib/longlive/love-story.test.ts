import { describe, expect, it } from 'vitest';
import { durationLabel, mergedTimeline, monthsBetween, previousRelationship, soloLeadIn } from './love-story';
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
