import { describe, expect, it } from 'vitest';
import { SOURCE_TYPE_LITERAL, hostOf, sourceLiteral, sourcesFrom } from './longlive-sync-shared.mjs';

// `reliability_score` was authored on ~2.1k seed citations for a month and
// reached the app on exactly none of them: sourcesFrom() flattened every
// citation to {name,url}. These tests pin BOTH links of that chain — the
// normalizer AND the serializer — because a test on either one alone is what
// let the field disappear in the first place (same failure mode as
// significance, moment cross-links, rumor lifecycle and socialPost before it).

describe('sourcesFrom', () => {
  it('carries reliability_score and source_type through from the §5 shape', () => {
    expect(
      sourcesFrom(
        [
          {
            source_url: 'https://www.grammy.com/news/x',
            publisher: 'The Recording Academy',
            source_type: 'official',
            reliability_score: 5,
          },
        ],
        null,
      ),
    ).toEqual([
      {
        name: 'The Recording Academy',
        url: 'https://www.grammy.com/news/x',
        reliability: 5,
        type: 'official',
      },
    ]);
  });

  it('carries them from the legacy {outlet,url} shape too, when present', () => {
    expect(
      sourcesFrom(
        [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/a',
            source_type: 'chart_database',
            reliability_score: 5,
          },
        ],
        null,
      ),
    ).toEqual([
      {
        name: 'Billboard',
        url: 'https://www.billboard.com/a',
        reliability: 5,
        type: 'chart_database',
      },
    ]);
  });

  it('OMITS reliability when the seed never scored it — absent is not "scored low"', () => {
    const [only] = sourcesFrom([{ outlet: 'Rolling Stone', url: 'https://rollingstone.com/a' }], null);
    expect(only).toEqual({ name: 'Rolling Stone', url: 'https://rollingstone.com/a' });
    expect('reliability' in only).toBe(false);
    expect('type' in only).toBe(false);
  });

  it('drops an out-of-rubric score rather than passing a bogus number to the app', () => {
    for (const bad of [0, 6, -1, 4.5, '5', null, undefined, NaN]) {
      const [only] = sourcesFrom(
        [{ outlet: 'X', url: 'https://x.example/a', reliability_score: bad }],
        null,
      );
      expect('reliability' in only).toBe(false);
    }
  });

  it('leaves the bare top-level sourceUrl unscored — a url carries no judgment', () => {
    expect(sourcesFrom([], 'https://www.vogue.com/a')).toEqual([
      { name: 'vogue.com', url: 'https://www.vogue.com/a' },
    ]);
  });

  it('still de-dupes by url and still falls back to the hostname for a nameless entry', () => {
    expect(
      sourcesFrom(
        [
          { url: 'https://www.npr.org/a', reliability_score: 4 },
          { outlet: 'NPR again', url: 'https://www.npr.org/a', reliability_score: 1 },
        ],
        'https://www.npr.org/a',
      ),
    ).toEqual([{ name: 'npr.org', url: 'https://www.npr.org/a', reliability: 4 }]);
  });
});

describe('sourceLiteral', () => {
  it('emits reliability and type into the generated TypeScript', () => {
    expect(
      sourceLiteral({ name: 'TIME', url: 'https://time.com/a', reliability: 5, type: 'official' }),
    ).toBe('{ name: "TIME", url: "https://time.com/a", reliability: 5, type: "official" }');
  });

  it('emits neither key when the citation was never scored', () => {
    expect(sourceLiteral({ name: 'TIME', url: 'https://time.com/a' })).toBe(
      '{ name: "TIME", url: "https://time.com/a" }',
    );
  });

  it('emits a number, not a string — the vault type is a numeric union', () => {
    const out = sourceLiteral({ name: 'X', url: 'https://x.example/a', reliability: 2 });
    expect(out).toContain('reliability: 2');
    expect(out).not.toContain('reliability: "2"');
  });

  it('round-trips whatever sourcesFrom produced (normalizer + serializer agree)', () => {
    const [only] = sourcesFrom(
      [{ publisher: 'Wikipedia', source_url: 'https://en.wikipedia.org/wiki/A', source_type: 'wiki', reliability_score: 2 }],
      null,
    );
    expect(sourceLiteral(only)).toBe(
      '{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/A", reliability: 2, type: "wiki" }',
    );
  });
});

describe('SOURCE_TYPE_LITERAL', () => {
  it('declares every optional key sourceLiteral can emit', () => {
    // If someone adds a key to sourceLiteral without widening this, the
    // generated vault stops typechecking — so assert they move together.
    expect(SOURCE_TYPE_LITERAL).toContain('name: string');
    expect(SOURCE_TYPE_LITERAL).toContain('url: string');
    expect(SOURCE_TYPE_LITERAL).toContain('reliability?: 1 | 2 | 3 | 4 | 5');
    expect(SOURCE_TYPE_LITERAL).toContain('type?: string');
  });
});

describe('hostOf', () => {
  it('strips www and returns the raw value for a non-url', () => {
    expect(hostOf('https://www.billboard.com/a/b')).toBe('billboard.com');
    expect(hostOf('not a url')).toBe('not a url');
  });
});
