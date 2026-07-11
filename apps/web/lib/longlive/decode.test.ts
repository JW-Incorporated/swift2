import { describe, expect, it } from 'vitest';
import { erasBetween, gapYears } from './decode';
import type { CluePoint } from './types';

function point(date: string): CluePoint {
  return { date, dateLabel: date, eraId: '1989', what: '' };
}

describe('erasBetween', () => {
  it('returns a single era when plant and payoff are in the same era', () => {
    expect(erasBetween('1989', '1989')).toEqual(['1989']);
  });

  it('returns every era spanned, inclusive of both ends, in chronological order', () => {
    expect(erasBetween('1989', 'reputation')).toEqual(['1989', 'reputation']);
  });

  it('is order-independent — payoff before plant chronologically still returns the same span', () => {
    expect(erasBetween('reputation', '1989')).toEqual(['1989', 'reputation']);
  });
});

describe('gapYears', () => {
  it('returns 0 for a same-day plant and payoff', () => {
    expect(gapYears({ plant: point('2020-01-01'), payoff: point('2020-01-01') })).toBe(0);
  });

  it('returns whole years for a multi-year gap', () => {
    expect(gapYears({ plant: point('2014-08-18'), payoff: point('2023-10-27') })).toBe(9);
  });

  it('never returns negative — a payoff dated before its plant clamps to 0', () => {
    expect(gapYears({ plant: point('2023-01-01'), payoff: point('2020-01-01') })).toBe(0);
  });
});
