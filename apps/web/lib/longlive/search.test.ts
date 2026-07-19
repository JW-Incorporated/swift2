import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';
import {
  MAX_RESULTS_PER_TYPE,
  buildSearchIndex,
  flattenGroups,
  normalize,
  scoreDoc,
  searchDocs,
  tokenize,
  type SearchDoc,
  type SearchDocType,
} from './search';

/** Minimal doc factory for ranking tests (mirrors makeDoc's normalization). */
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
  };
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
    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(scores[1]).toBeGreaterThan(scores[2]);
    expect(scores[2]).toBeGreaterThan(scores[3]);
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
    const [group] = searchDocs(many, 'snake');
    expect(group.results.map((r) => r.doc.title)).toEqual(['Snake', 'Apple snake', 'Zebra snake']);
  });

  it('caps each group at MAX_RESULTS_PER_TYPE', () => {
    const many = Array.from({ length: MAX_RESULTS_PER_TYPE + 3 }, (_, i) =>
      doc({ title: `Snake ${i}`, type: 'moment', key: `m:${i}` }),
    );
    const [group] = searchDocs(many, 'snake');
    expect(group.results).toHaveLength(MAX_RESULTS_PER_TYPE);
  });
});

describe('buildSearchIndex (real data)', () => {
  const index = buildSearchIndex();

  it('has unique keys', () => {
    const keys = index.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers every content type', () => {
    const types = new Set(index.map((d) => d.type));
    for (const t of ['era', 'moment', 'egg', 'track', 'theory', 'video'] as SearchDocType[]) {
      expect(types.has(t), `index missing type "${t}"`).toBe(true);
    }
  });

  it('finds a known moment by a straight-quote query', () => {
    const flat = flattenGroups(searchDocs(index, 'tim mcgraw'));
    // post-migration (stage 2a): the legacy id is now the item's SLUG; the doc
    // key carries the generated vault id, so resolve it through CONTENT.
    const timMcgraw = CONTENT.find((c) => c.slug === 'debut-tim-mcgraw');
    expect(timMcgraw, 'migrated tim-mcgraw item missing').toBeDefined();
    expect(flat.some((r) => r.doc.key === 'moment:' + timMcgraw!.id)).toBe(true);
  });

  it('finds the snake egg nodes and targets a Clue Web trail', () => {
    const groups = searchDocs(index, 'snake');
    const eggs = groups.find((g) => g.type === 'egg');
    expect(eggs).toBeDefined();
    expect(eggs!.results.every((r) => r.doc.target.kind === 'trail')).toBe(true);
  });

  it('every doc has a snippet and a resolvable target shape', () => {
    for (const d of index) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.snippet.length).toBeGreaterThan(0);
      expect(d.bodyNorm.length).toBeGreaterThan(0);
    }
  });
});
