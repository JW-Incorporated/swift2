import { describe, expect, it } from 'vitest';

import { keywordQuery, isEmptyQuery } from './mood-keywords';
import { matchMoods } from './mood-match';

describe('keywordQuery', () => {
  it('asserts only the axes the words evoke', () => {
    const q = keywordQuery('heartbroken and furious after the breakup');
    expect(q.moods.heartbreak).toBeGreaterThan(0);
    expect(q.moods.anger).toBeGreaterThan(0);
    expect(q.moods.joy).toBeUndefined();
    expect(q.moods.calm).toBeUndefined();
  });

  it('infers low valence / energy from sad-and-quiet language', () => {
    const q = keywordQuery('lonely and sad, quiet 3am kind of feeling');
    expect(q.moods.longing).toBeGreaterThan(0);
    expect(q.valence).toBeLessThan(0.5);
    expect(q.energy).toBeLessThan(0.5);
  });

  it('infers high valence / energy from an upbeat message', () => {
    const q = keywordQuery('so happy and excited, dancing around the kitchen');
    expect(q.moods.joy).toBeGreaterThan(0);
    expect(q.valence).toBeGreaterThan(0.5);
    expect(q.energy).toBeGreaterThan(0.5);
  });

  it('returns an empty query for text with no mood signal', () => {
    const q = keywordQuery('what is the capital of France');
    expect(isEmptyQuery(q)).toBe(true);
  });

  it('degrades to REAL songs — the whole point of the fallback', () => {
    const q = keywordQuery('heartbroken and angry');
    const picks = matchMoods(q, { limit: 5 });
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) expect(typeof p.slug).toBe('string');
  });

  it('does not fire an axis on a substring of an unrelated word', () => {
    // "management" contains "anger" as a substring; whole-token matching must
    // not assert anger from it.
    const q = keywordQuery('thinking about project management today');
    expect(q.moods.anger).toBeUndefined();
  });
});
