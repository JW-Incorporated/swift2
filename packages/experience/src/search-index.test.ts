import { describe, expect, it } from 'vitest';
import {
  MAX_RESULTS_PER_TYPE,
  flattenGroups,
  normalize,
  scoreDoc,
  searchDocs,
  tokenize,
  WEIGHT_DEFINING,
  type SearchDoc,
  type SearchGroup,
} from './search-index';

/** Minimal doc factory for ranking tests (mirrors makeSearchDoc's normalization). */
function doc(
  partial: Partial<SearchDoc> & { title: string },
  body: string[] = [],
): SearchDoc {
  const titleNorm = normalize(partial.title);
  return {
    key: partial.key ?? `moment:${partial.title}`,
    type: partial.type ?? 'moment',
    title: partial.title,
    snippet: partial.snippet ?? '',
    eraId: partial.eraId ?? null,
    target: partial.target ?? { kind: 'moment', itemId: partial.title },
    titleNorm,
    bodyNorm: [titleNorm, ...body.map(normalize)].join(' '),
    weight: partial.weight ?? 0,
  };
}

/** First group, asserted present — tests below always expect at least one match. */
function firstGroup(groups: readonly SearchGroup[]): SearchGroup {
  const group = groups[0];
  if (!group) throw new Error('expected at least one search group');
  return group;
}

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  Vault Track  ')).toBe('vault track');
  });

  it('straightens smart quotes and dashes so typed queries match content', () => {
    expect(normalize('“Taylor’s Version”')).toBe('"taylor\'s version"');
    expect(normalize('clue — payoff')).toBe('clue - payoff');
  });

  it('strips diacritics', () => {
    expect(normalize('café')).toBe('cafe');
  });

  it('collapses internal whitespace', () => {
    expect(normalize('a\n b\t\tc')).toBe('a b c');
  });
});

describe('tokenize', () => {
  it('splits on whitespace and drops empties', () => {
    expect(tokenize('  snake   vault ')).toEqual(['snake', 'vault']);
  });

  it('returns [] for blank input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('scoreDoc', () => {
  it('returns 0 when any term misses (AND semantics)', () => {
    const d = doc({ title: 'The snake strikes' }, ['reputation era imagery']);
    expect(scoreDoc(d, ['snake', 'zzz'])).toBe(0);
  });

  it('returns 0 for an empty term list', () => {
    expect(scoreDoc(doc({ title: 'Anything' }), [])).toBe(0);
  });

  it('ranks title matches above body-only matches', () => {
    const inTitle = doc({ title: 'Snake rings everywhere' });
    const inBody = doc({ title: 'A moment' }, ['the snake motif returns']);
    expect(scoreDoc(inTitle, ['snake'])).toBeGreaterThan(scoreDoc(inBody, ['snake']));
  });

  it('ranks exact title > title prefix > word prefix > substring', () => {
    const exact = doc({ title: 'Snake' });
    const prefix = doc({ title: 'Snake rings' });
    const wordPrefix = doc({ title: 'The snake strikes' });
    const substring = doc({ title: 'Rattlesnake' });
    const scores = [exact, prefix, wordPrefix, substring].map((d) => scoreDoc(d, ['snake']));
    expect(scores[0]).toBeGreaterThan(scores[1]!);
    expect(scores[1]).toBeGreaterThan(scores[2]!);
    expect(scores[2]).toBeGreaterThan(scores[3]!);
  });

  it('matches queries typed with straight quotes against curly-quoted titles', () => {
    const d = doc({ title: '“Tim McGraw” arrives' });
    expect(scoreDoc(d, tokenize('tim mcgraw'))).toBeGreaterThan(0);
    const tv = doc({ title: 'Taylor’s Version' });
    expect(scoreDoc(tv, tokenize("taylor's version"))).toBeGreaterThan(0);
  });

  it('gives a phrase bonus when the title contains all terms in order', () => {
    const phrase = doc({ title: 'Love story rewritten' });
    const scattered = doc({ title: 'Story of a love song' });
    const terms = tokenize('love story');
    expect(scoreDoc(phrase, terms)).toBeGreaterThan(scoreDoc(scattered, terms));
  });
});

describe('searchDocs', () => {
  const docs = [
    doc({ title: 'Snake rings', type: 'moment', key: 'moment:1' }),
    doc({ title: 'The snake strikes', type: 'egg', key: 'egg:1' }),
    doc({ title: 'Look What You Made Me Do', type: 'track', key: 'track:1' }, ['snake video']),
    doc({ title: 'Unrelated', type: 'era', key: 'era:1' }, ['nothing here']),
  ];

  it('returns [] for blank queries', () => {
    expect(searchDocs(docs, '')).toEqual([]);
    expect(searchDocs(docs, '   ')).toEqual([]);
  });

  it('returns [] when nothing matches', () => {
    expect(searchDocs(docs, 'zzzzz')).toEqual([]);
  });

  it('excludes non-matching docs and groups results by type', () => {
    const groups = searchDocs(docs, 'snake');
    const types = groups.map((g) => g.type);
    expect(types).toEqual(['moment', 'egg', 'track']); // no 'era' group
    expect(flattenGroups(groups)).toHaveLength(3);
  });

  it('presents groups in a stable order regardless of doc order', () => {
    const reversed = [...docs].reverse();
    expect(searchDocs(reversed, 'snake').map((g) => g.type)).toEqual(['moment', 'egg', 'track']);
  });

  it('sorts within a group by score, then title', () => {
    const many = [
      doc({ title: 'Zebra snake', type: 'moment', key: 'm:1' }),
      doc({ title: 'Snake', type: 'moment', key: 'm:2' }),
      doc({ title: 'Apple snake', type: 'moment', key: 'm:3' }),
    ];
    const group = firstGroup(searchDocs(many, 'snake'));
    expect(group.results.map((r) => r.doc.title)).toEqual(['Snake', 'Apple snake', 'Zebra snake']);
  });

  it('caps each group at MAX_RESULTS_PER_TYPE', () => {
    const many = Array.from({ length: MAX_RESULTS_PER_TYPE + 3 }, (_, i) =>
      doc({ title: `Snake ${i}`, type: 'moment', key: `m:${i}` }),
    );
    const group = firstGroup(searchDocs(many, 'snake'));
    expect(group.results).toHaveLength(MAX_RESULTS_PER_TYPE);
  });
});

// ---------------------------------------------------------------------------
// Editorial weighting. Added 2026-07-20 after a real, reported failure:
// searching "wedding" ranked the actual MSG wedding page 20th of 26 matches —
// past the 5-per-type cap, so invisible — because its title is "Taylor and
// Travis marry at Madison Square Garden" and never says "wedding", while a
// chat-show anecdote with the word in its title scored higher.
// ---------------------------------------------------------------------------
describe('editorial weighting in ranking', () => {
  it('lifts a defining body-match above an unmarked title-match', () => {
    const canonical = doc(
      { title: 'Taylor and Travis marry at Madison Square Garden', weight: WEIGHT_DEFINING },
      ['A wedding officiated by their friend Adam Sandler'],
    );
    const tangential = doc({ title: 'Wedding plans, teased from a chat-show couch' });
    const terms = tokenize('wedding');
    expect(scoreDoc(canonical, terms)).toBeGreaterThan(scoreDoc(tangential, terms));
  });

  it('still puts an exact title match first — importance reorders, never overrides', () => {
    const exact = doc({ title: 'wedding' });
    const defining = doc({ title: 'Something else entirely', weight: WEIGHT_DEFINING }, [
      'a wedding happened',
    ]);
    const terms = tokenize('wedding');
    expect(scoreDoc(exact, terms)).toBeGreaterThan(scoreDoc(defining, terms));
  });

  it('adds the bonus once per doc, not once per term', () => {
    const one = doc({ title: 'alpha', weight: WEIGHT_DEFINING }, ['beta']);
    const terms = tokenize('alpha beta');
    // title-word-prefix (25) + body hit (6) + phrase bonus is not triggered
    // here + weight (30) — the weight must appear exactly once.
    expect(scoreDoc(one, terms)).toBe(scoreDoc({ ...one, weight: 0 }, terms) + WEIGHT_DEFINING);
  });

  it('leaves unweighted docs scoring exactly as before', () => {
    const plain = doc({ title: 'a plain moment' }, ['nothing special']);
    expect(scoreDoc(plain, tokenize('plain'))).toBe(25);
  });
});

describe('result caps and totals', () => {
  // Wyatt, 2026-07-20: "if I type something and hit enter without selecting a
  // suggested result, it should take me to a search results page, not just the
  // top suggested result." The results view needs every match, and the
  // dropdown needs to admit what it is hiding.
  const many = Array.from({ length: 12 }, (_, i) =>
    doc({ title: `Wedding moment number ${i}`, key: `m${i}` }),
  );

  it('caps each group at five by default — the dropdown is a shortlist', () => {
    const group = firstGroup(searchDocs(many, 'wedding'));
    expect(group.results).toHaveLength(MAX_RESULTS_PER_TYPE);
  });

  it('reports the true total even while capped, so the UI can say "5 of 12"', () => {
    const group = firstGroup(searchDocs(many, 'wedding'));
    expect(group.totalMatches).toBe(12);
    expect(group.totalMatches).toBeGreaterThan(group.results.length);
  });

  it('returns every match when the cap is lifted', () => {
    const group = firstGroup(searchDocs(many, 'wedding', Number.POSITIVE_INFINITY));
    expect(group.results).toHaveLength(12);
    expect(group.totalMatches).toBe(12);
  });

  it('keeps ranking order when uncapped — more results must not mean worse order', () => {
    const uncapped = firstGroup(searchDocs(many, 'wedding', Number.POSITIVE_INFINITY)).results;
    const scores = uncapped.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('the uncapped list starts with exactly the capped list', () => {
    const capped = firstGroup(searchDocs(many, 'wedding')).results.map((r) => r.doc.key);
    const uncapped = firstGroup(searchDocs(many, 'wedding', Number.POSITIVE_INFINITY)).results.map(
      (r) => r.doc.key,
    );
    expect(uncapped.slice(0, capped.length)).toEqual(capped);
  });
});
