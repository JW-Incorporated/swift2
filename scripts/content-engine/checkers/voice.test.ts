import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check, checkAiTells, checkSurnameOveruse, checkWireAttribution } from './voice.mjs';

const item = (texts: Record<string, string>, over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'test-item',
  title: 'Test item',
  texts,
  ...over,
});

describe('content.voice.surname-overuse', () => {
  it('flags bare "Swift" outnumbering "Taylor" — the wire-copy pattern', async () => {
    const f = await checkSurnameOveruse([
      item({
        context:
          'Swift has framed the song as a warning. Swift approached George Michael\'s estate for the interpolation. Swift has not named the subject.',
      }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.voice.surname-overuse');
    expect(f[0].severity).toBe('P2');
    expect(f[0].evidence).toMatch(/3 bare "Swift"/);
  });

  it('does not flag prose that defaults to "Taylor"', async () => {
    const f = await checkSurnameOveruse([
      item({
        context:
          'Taylor has framed the song as a warning. Taylor approached George Michael\'s estate for the interpolation. Taylor has not named the subject.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not count another "[Name] Swift" (family member or an outlet\'s own name) as a bare hit', async () => {
    // Regression: an early version of the companion fix-up script rewrote
    // "Austin Swift" (her brother) into "Austin Taylor" because it only
    // excluded "Taylor Swift", not other full names ending in "Swift".
    const f = await checkSurnameOveruse([
      item({
        context:
          'Austin Swift stood as Man of Honor. Andrea Swift and Scott Swift watched from the front row. Taylor thanked her family in her vows that night.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not count "Taylor Swift" (the full name) as a bare surname hit', async () => {
    const f = await checkSurnameOveruse([
      item({
        context:
          'Taylor Swift opened the show. Taylor Swift then thanked the crowd for coming out, and Taylor Swift closed with an acoustic set for the fans tonight.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('excludes bare "Swift" inside a direct quote — quoted words are not the item\'s own voice', async () => {
    const f = await checkSurnameOveruse([
      item({
        context:
          'A source told the outlet: "Swift was thrilled, Swift could not stop smiling, Swift called it the best night of her life." Taylor later confirmed the account herself in her own words to the press this week.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('is neutral at a tie (bare Swift == Taylor) — still flags, per the issue\'s own diagnostic', async () => {
    const f = await checkSurnameOveruse([
      item({ context: 'Swift wrote the bridge alone. Taylor recorded it the next day in Stockholm with her band.' }),
    ]);
    expect(f).toHaveLength(1);
  });

  it('does not flag Taylor-outnumbers-Swift prose', async () => {
    const f = await checkSurnameOveruse([
      item({
        context:
          'Taylor wrote the bridge alone. Taylor recorded it the next day. Swift is credited as a producer on the track alongside Antonoff and Martin this time.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('ignores very short text (below the judge-fairly floor)', async () => {
    const f = await checkSurnameOveruse([item({ snippet: 'Swift wore red.' })]);
    expect(f).toEqual([]);
  });

  it('ignores non-string / missing texts', async () => {
    expect(await checkSurnameOveruse([item({})])).toEqual([]);
  });
});

describe('content.voice.ai-tell', () => {
  it('flags "In this article..." throat-clearing', async () => {
    const f = await checkAiTells([item({ context: 'In this article, we look at the making of the album.' })]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.voice.ai-tell');
    expect(f[0].title).toMatch(/In this article/);
  });

  it('flags the wire-style full-name-plus-bio opener', async () => {
    const f = await checkAiTells([
      item({ context: 'Taylor Swift, the American singer-songwriter, released her twelfth album this fall.' }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/singer-songwriter/);
  });

  it('flags hedging qualifiers', async () => {
    const f = await checkAiTells([item({ context: 'It seems the song is about her early career.' })]);
    expect(f).toHaveLength(1);
  });

  it('does not flag clean fan-editor prose', async () => {
    const f = await checkAiTells([
      item({ context: 'The bridge is the whole song — three minutes of Taylor finally saying the quiet part out loud.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('can flag multiple distinct AI-tells in the same item', async () => {
    const f = await checkAiTells([
      item({ context: 'In this article, it is worth noting that the single charted well.' }),
    ]);
    expect(f).toHaveLength(2);
  });
});

describe('content.voice.wire-attribution', () => {
  it('flags a named outlet as the sentence\'s grammatical subject of a reporting verb', async () => {
    const f = await checkWireAttribution([
      item({
        context:
          'Billboard\'s chart recap put the scale plainly: the album outsold everything else that week combined.',
      }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.voice.wire-attribution');
    expect(f[0].severity).toBe('P3');
    expect(f[0].evidence).toMatch(/1 named-outlet-as-subject construction in/);
  });

  it('flags even a single occurrence — the construction itself is the tell, not a repeat count', async () => {
    const f = await checkWireAttribution([item({ context: 'Forbes tracked the record falling within hours of release day, a milestone nobody expected this fast.' })]);
    expect(f).toHaveLength(1);
  });

  it('flags multiple distinct outlet-subject constructions in one field and lists each', async () => {
    const f = await checkWireAttribution([
      item({
        context:
          'Billboard\'s tenth-anniversary retrospective put it at No. 1 among her debut-era singles, and Rolling Stone called it a "clear-eyed" opener for the rest of the catalog that followed.',
      }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].evidence).toMatch(/2 named-outlet-as-subject constructions/);
  });

  it('does not flag a source cited in a direct quote — quoted words are not the item\'s own voice', async () => {
    const f = await checkWireAttribution([
      item({
        context:
          'A friend told the outlet: "Billboard reported it wrong, Forbes tracked the wrong number entirely." Taylor never addressed the discrepancy publicly.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not flag ordinary prose that merely mentions an outlet by name without the reporting-verb construction', async () => {
    const f = await checkWireAttribution([
      item({ context: 'The story ran everywhere from Billboard to the morning shows within a day of the announcement.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not flag ordinary lowercase "time" colliding with the outlet "Time" (real regression, red.mjs)', async () => {
    // Real false positive found in the corpus: "outlets at the time noted"
    // and "reports at the time described" both matched an early
    // case-insensitive version of this rule, because it let lowercase
    // "time" collide with the magazine "Time." Outlets are always proper
    // nouns in real prose, so the match must require real capitalization.
    const f = await checkWireAttribution([
      item({
        context:
          'A look outlets at the time noted made the gown feel young and modern. Reports at the time described a blowout fight after the trip ended.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not flag a person\'s name that happens to share a word with an outlet', async () => {
    // "Time" the magazine is in the outlet list; "time" as an ordinary noun
    // must not collide because the pattern requires a capitalized match
    // immediately followed by one of the reporting verbs.
    const f = await checkWireAttribution([
      item({ context: 'This time around, she wrote every song alone before bringing in a producer.' }),
    ]);
    expect(f).toEqual([]);
  });
});

describe('check (combined)', () => {
  it('runs all three sub-checks and merges results', async () => {
    const f = await check([
      item({
        context: 'In this article: Swift wrote it, Swift recorded it, Swift released it last fall.',
      }),
    ]);
    const checkers = f.map((x: { checker: string }) => x.checker).sort();
    expect(checkers).toEqual(['content.voice.ai-tell', 'content.voice.surname-overuse']);
  });

  it('includes wire-attribution findings when present alongside the other two', async () => {
    const f = await check([
      item({
        context:
          'In this article: Billboard reported the record, and Swift wrote it, Swift recorded it, Swift released it last fall.',
      }),
    ]);
    const checkers = f.map((x: { checker: string }) => x.checker).sort();
    expect(checkers).toEqual([
      'content.voice.ai-tell',
      'content.voice.surname-overuse',
      'content.voice.wire-attribution',
    ]);
  });

  it('ignores items with no texts at all', async () => {
    expect(await check([{ type: 'moment', file: 'x', era: 'x', key: 'x', title: 'x' }])).toEqual([]);
  });
});
