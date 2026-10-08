import { describe, expect, it } from 'vitest';
import { dateMath } from './date-math';

const FIXED_NOW = new Date('2026-08-19T12:00:00.000Z'); // Wednesday

describe('dateMath', () => {
  it('resolves today/yesterday/daysAgo off the injected now', () => {
    const dm = dateMath(FIXED_NOW);
    expect(dm.today()).toBe('2026-08-19');
    expect(dm.yesterday()).toBe('2026-08-18');
    expect(dm.daysAgo(0)).toBe('2026-08-19');
    expect(dm.daysAgo(7)).toBe('2026-08-12');
  });

  it('resolves thisWeekStart to the Monday of the current UTC week', () => {
    const dm = dateMath(FIXED_NOW);
    expect(dm.thisWeekStart()).toBe('2026-08-17');
  });

  it('resolve() handles the fixed phrase vocabulary, case-insensitive', () => {
    const dm = dateMath(FIXED_NOW);
    expect(dm.resolve('Today')).toBe('2026-08-19');
    expect(dm.resolve('YESTERDAY')).toBe('2026-08-18');
    expect(dm.resolve('this week')).toBe('2026-08-17');
    expect(dm.resolve('last 3 days')).toBe('2026-08-16');
    expect(dm.resolve('past 10 days')).toBe('2026-08-09');
  });

  it('resolve() returns null for unrecognized phrases rather than guessing', () => {
    const dm = dateMath(FIXED_NOW);
    expect(dm.resolve('next week')).toBeNull();
    expect(dm.resolve('since the announcement')).toBeNull();
    expect(dm.resolve('')).toBeNull();
  });

  it('defaults now to the real current time when none is injected', () => {
    const before = new Date();
    const today = dateMath().today();
    expect(today).toBe(before.toISOString().slice(0, 10));
  });
});
