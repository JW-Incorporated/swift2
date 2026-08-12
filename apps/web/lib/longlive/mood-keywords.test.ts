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

  // #1981 — hyperbole/idiom that the crisis suppressor clears used to dead-end
  // in UNCLEAR (no axis word, empty query, no songs). It must now seed a
  // sensible default vector and return real songs.
  describe('hyperbole idioms seed a default mood and return songs (#1981)', () => {
    const EXCITED = [
      "I'm dying to see the Eras tour",
      'I am dying to see her live',
      'this bridge is to die for',
      'I want to die laughing at this',
    ];
    const ANXIOUS = [
      'this is killing me',
      'this wait is killing me',
      'I could die of embarrassment',
      'I want to die of embarrassment',
    ];

    it.each(EXCITED)('seeds joy and returns songs for %j', (text) => {
      const q = keywordQuery(text);
      expect(isEmptyQuery(q)).toBe(false);
      expect(q.moods.joy).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it.each(ANXIOUS)('seeds catharsis and returns songs for %j', (text) => {
      const q = keywordQuery(text);
      expect(isEmptyQuery(q)).toBe(false);
      expect(q.moods.catharsis).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it('an idiom never overrides a real mood word already in the message', () => {
      // "heartbroken" hits an axis, so the idiom seed must not add joy on top.
      const q = keywordQuery('heartbroken, this is killing me');
      expect(q.moods.heartbreak).toBeGreaterThan(0);
      expect(q.moods.joy).toBeUndefined();
    });
  });
});
