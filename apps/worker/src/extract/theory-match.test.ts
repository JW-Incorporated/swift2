import { describe, expect, it } from 'vitest';
import { findTheoryMatch, isTheoryMatch, nameSimilarity, symbolOverlap } from './theory-match';

describe('nameSimilarity', () => {
  it('is 1 for identical names', () => {
    expect(nameSimilarity('Ticket Countdown Theory', 'Ticket Countdown Theory')).toBe(1);
  });

  it('is 0 for completely different names', () => {
    expect(nameSimilarity('Ticket Countdown Theory', 'Merch Color Easter Egg')).toBe(0);
  });

  it('is partial for overlapping-but-not-identical wording', () => {
    const score = nameSimilarity('The Ticket Countdown', 'Ticket Countdown Theory');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe('symbolOverlap', () => {
  it('is 0 when either side has no symbols, even if both are empty', () => {
    expect(symbolOverlap([], [])).toBe(0);
    expect(symbolOverlap(['13'], [])).toBe(0);
  });

  it('is 1 for identical symbol sets', () => {
    expect(symbolOverlap(['13', 'butterfly'], ['13', 'butterfly'])).toBe(1);
  });

  it('is partial for a partial overlap', () => {
    expect(symbolOverlap(['13', 'butterfly'], ['13', 'snake'])).toBeCloseTo(1 / 3);
  });
});

describe('isTheoryMatch / findTheoryMatch', () => {
  it('matches on strong symbol overlap alone (sum >= 0.5)', () => {
    const candidate = { name: 'Totally Different Name', symbols: ['13', 'butterfly'] };
    const existing = { name: 'Unrelated Wording Entirely', symbols: ['13', 'butterfly'] };
    expect(isTheoryMatch(candidate, existing)).toBe(true);
  });

  it('does not match on weak overlap in both axes', () => {
    const candidate = { name: 'Totally Different Name', symbols: ['13'] };
    const existing = { name: 'Unrelated Wording Entirely', symbols: ['snake'] };
    expect(isTheoryMatch(candidate, existing)).toBe(false);
  });

  it('findTheoryMatch returns the best-scoring match among several candidates', () => {
    const candidate = { name: 'Ticket Countdown Theory', symbols: ['13'] };
    const existing = [
      { id: 'a', name: 'Merch Color Egg', symbols: ['snake'] },
      { id: 'b', name: 'Ticket Countdown Theory', symbols: ['13'] },
    ];
    expect(findTheoryMatch(candidate, existing)?.id).toBe('b');
  });

  it('findTheoryMatch returns undefined when nothing clears the threshold', () => {
    const candidate = { name: 'Brand New Idea', symbols: ['owl'] };
    const existing = [{ id: 'a', name: 'Merch Color Egg', symbols: ['snake'] }];
    expect(findTheoryMatch(candidate, existing)).toBeUndefined();
  });
});
