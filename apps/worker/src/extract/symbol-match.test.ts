import { describe, expect, it } from 'vitest';
import { symbolMatchScore } from './symbol-match';
import { CATALOG_FACTS, catalogFactNumbers } from './catalog-facts';

describe('catalogFactNumbers', () => {
  it('dedupes overlapping facts (currentAlbumNumber === currentAlbumTrackCount today)', () => {
    const numbers = catalogFactNumbers(CATALOG_FACTS);
    expect(numbers.filter((n) => n === 12)).toHaveLength(1);
  });

  it('includes the numerology digit and era start date parts', () => {
    const numbers = catalogFactNumbers(CATALOG_FACTS);
    expect(numbers).toContain(13);
    expect(numbers).toEqual(expect.arrayContaining(CATALOG_FACTS.eraStartDateParts));
  });
});

describe('symbolMatchScore', () => {
  it('returns 0 for an empty numeric_signals array', () => {
    expect(symbolMatchScore([])).toBe(0);
  });

  it('never divides by zero when numericSignals has values but shares nothing with the facts', () => {
    // Regression guard: distinct-signal denominator must come from the
    // candidate's own signals, never from an accidentally-empty fact set.
    expect(symbolMatchScore([1, 2, 3], CATALOG_FACTS)).toBe(0);
  });

  it('worked example: today\'s "0 styled as () + 12 exclamation points + 12th studio album" case', () => {
    // Extracted numeric_signals from the theory text: 0 (stylized zero),
    // 12 (exclamation point count), 12 (album ordinal) — distinct: [0, 12].
    const numericSignals = [0, 12, 12];
    const score = symbolMatchScore(numericSignals, CATALOG_FACTS);
    // 1 of 2 distinct signals (12) hits a real catalog fact; the bare 0 does not.
    expect(score).toBe(0.5);
  });

  it('scores a perfect match at 1', () => {
    expect(symbolMatchScore([12], CATALOG_FACTS)).toBe(1);
    expect(symbolMatchScore([13], CATALOG_FACTS)).toBe(1);
  });

  it('scores a total miss at 0', () => {
    expect(symbolMatchScore([7, 99], CATALOG_FACTS)).toBe(0);
  });

  it('dedupes repeated signals before scoring rather than double-counting', () => {
    // Same signal repeated many times must not change the score vs. it
    // appearing once — precision is over DISTINCT signals.
    expect(symbolMatchScore([12, 12, 12, 12], CATALOG_FACTS)).toBe(1);
  });

  it('weights a single well-aimed match higher than a scattershot list (documented precision choice)', () => {
    const focused = symbolMatchScore([12], CATALOG_FACTS);
    const scattershot = symbolMatchScore([12, 4, 9, 100], CATALOG_FACTS);
    expect(focused).toBeGreaterThan(scattershot);
  });
});
