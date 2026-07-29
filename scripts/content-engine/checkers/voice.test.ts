import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check, checkAiTells, checkSurnameOveruse } from './voice.mjs';

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

describe('check (combined)', () => {
  it('runs both sub-checks and merges results', async () => {
    const f = await check([
      item({
        context: 'In this article: Swift wrote it, Swift recorded it, Swift released it last fall.',
      }),
    ]);
    const checkers = f.map((x: { checker: string }) => x.checker).sort();
    expect(checkers).toEqual(['content.voice.ai-tell', 'content.voice.surname-overuse']);
  });

  it('ignores items with no texts at all', async () => {
    expect(await check([{ type: 'moment', file: 'x', era: 'x', key: 'x', title: 'x' }])).toEqual([]);
  });
});
