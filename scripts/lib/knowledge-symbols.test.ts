import { describe, expect, it } from 'vitest';
import { buildSymbolLexicon, symbolsIn, THEME_MIN_RECURRENCE } from './knowledge-symbols.mjs';

describe('buildSymbolLexicon', () => {
  it('keeps only themes that recur across >=THEME_MIN_RECURRENCE tracks', () => {
    const byEra = {
      debut: [{ facts: { themes: ['heartbreak', 'nostalgia'] } }, { facts: { themes: ['heartbreak'] } }],
      fearless: [{ facts: { themes: ['nostalgia'] } }, { facts: {} }],
    };
    const lexicon = buildSymbolLexicon(byEra);
    const keys = lexicon.map((s) => s.key);
    expect(keys).toContain('heartbreak');
    expect(keys).toContain('nostalgia');
    expect(keys).not.toContain('one-off-theme');
  });

  it('drops themes with fewer than the recurrence threshold', () => {
    const byEra = { debut: [{ facts: { themes: ['only-once'] } }] };
    expect(THEME_MIN_RECURRENCE).toBeGreaterThanOrEqual(2);
    expect(buildSymbolLexicon(byEra)).toEqual([]);
  });

  it('tracks which eras a recurring theme appeared in, sorted', () => {
    const byEra = {
      fearless: [{ facts: { themes: ['longing'] } }],
      debut: [{ facts: { themes: ['longing'] } }],
    };
    const [entry] = buildSymbolLexicon(byEra);
    expect(entry.linked_eras).toEqual(['debut', 'fearless']);
  });

  it('is deterministic — same input twice yields identical output', () => {
    const byEra = {
      debut: [{ facts: { themes: ['heartbreak', 'nostalgia'] } }, { facts: { themes: ['heartbreak'] } }],
    };
    expect(buildSymbolLexicon(byEra)).toEqual(buildSymbolLexicon(byEra));
  });
});

describe('symbolsIn', () => {
  const lexicon = [
    { key: 'heartbreak', label: 'heartbreak', aliases: [], category: 'theme', linked_eras: [], note: '' },
    { key: 'nostalgia', label: 'nostalgia', aliases: [], category: 'theme', linked_eras: [], note: '' },
  ];

  it('matches a symbol label as a case-insensitive substring', () => {
    expect(symbolsIn('A song about Heartbreak and moving on', lexicon)).toEqual(['heartbreak']);
  });

  it('returns no matches for unrelated text', () => {
    expect(symbolsIn('A song about the weather', lexicon)).toEqual([]);
  });

  it('handles empty/undefined text without throwing', () => {
    expect(symbolsIn('', lexicon)).toEqual([]);
    expect(symbolsIn(undefined as unknown as string, lexicon)).toEqual([]);
  });
});
