import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check, checkStylizedTitleMiscased, checkBadTtpdAbbreviation } from './era-capitalization.mjs';

const item = (texts: Record<string, string>, over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'test-item',
  title: 'Test item',
  texts,
  ...over,
});

describe('content.era-capitalization.stylized-title-miscased', () => {
  it('flags "Folklore" used mid-sentence as if it were title-case — deliberately miscased fixture', async () => {
    const f = await checkStylizedTitleMiscased([
      item({
        context: 'She wore a purple dress that captured the woodsy feel of Folklore on opening night.',
      }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.era-capitalization.stylized-title-miscased');
    expect(f[0].severity).toBe('P2');
    expect(f[0].suggestedFix).toMatch(/folklore/);
  });

  it('flags "Evermore" used mid-sentence as if it were title-case', async () => {
    const f = await checkStylizedTitleMiscased([
      item({ context: 'The tracks that would go on to shape Reputation, Lover, folklore, Evermore, and Midnights.' }),
    ]);
    // Two hits: "Reputation" and "Evermore" both miscased mid-sentence; "folklore" is correct and not flagged.
    expect(f.length).toBeGreaterThanOrEqual(2);
    const eras = f.map((x: any) => x.title);
    expect(eras.some((t: string) => t.includes('Evermore'))).toBe(true);
    expect(eras.some((t: string) => t.includes('Reputation'))).toBe(true);
  });

  it('does not flag correct lowercase styling, including sentence-initial use', async () => {
    const f = await checkStylizedTitleMiscased([
      item({ context: 'folklore is the sister album to evermore. reputation came out in 2017.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not flag "Reputation Stadium Tour" — the tour\'s established proper-noun name', async () => {
    const f = await checkStylizedTitleMiscased([
      item({ context: 'She performed the song live on the Reputation Stadium Tour in 2018.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not flag "Evermore Park" — an unrelated third-party business name', async () => {
    const f = await checkStylizedTitleMiscased([
      item({ context: 'Evermore Park alleged trademark infringement over the album name.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('excludes a quoted outlet headline — that is the publication\'s own title, not this repo\'s prose', async () => {
    const f = await checkStylizedTitleMiscased([
      item({
        context: 'Per the outlet\'s own headline, "Taylor Swift Is Releasing a Folklore Special on Disney+" ran that week.',
      }),
    ]);
    expect(f).toEqual([]);
  });

  it('treats sentence-initial capitalized use as a lower-confidence review finding, not a skip', async () => {
    const f = await checkStylizedTitleMiscased([
      item({ context: 'Reputation was the best-selling album of 2017.' }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].confidence).toBeLessThan(0.5);
  });

  it('does not flag correctly capitalized standard-case titles', async () => {
    const f = await checkStylizedTitleMiscased([
      item({ context: 'Taylor Swift released Fearless, Speak Now, Midnights, and The Tortured Poets Department.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('ignores non-string / missing texts', async () => {
    expect(await checkStylizedTitleMiscased([item({})])).toEqual([]);
  });
});

describe('content.era-capitalization.bad-ttpd-abbreviation', () => {
  it('flags mixed-case "Ttpd" — deliberately miscased fixture', async () => {
    const f = await checkBadTtpdAbbreviation([
      item({ context: 'The record entered at No. 7 on the Hot 100 inside Ttpd\'s record-setting week.' }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.era-capitalization.bad-ttpd-abbreviation');
    expect(f[0].suggestedFix).toMatch(/The Tortured Poets Department|TTPD/);
  });

  it('does not flag the all-caps acronym TTPD', async () => {
    const f = await checkBadTtpdAbbreviation([
      item({ context: "It charted inside TTPD's record-setting week." }),
    ]);
    expect(f).toEqual([]);
  });

  it('does not flag the spelled-out title', async () => {
    const f = await checkBadTtpdAbbreviation([
      item({ context: 'She released The Tortured Poets Department in April 2024.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('ignores non-string / missing texts', async () => {
    expect(await checkBadTtpdAbbreviation([item({})])).toEqual([]);
  });
});

describe('content.era-capitalization.check (combined)', () => {
  it('runs both sub-checkers and returns their combined findings', async () => {
    const f = await check([
      item({
        context:
          "The Ttpd set had the marquee guest. It captured the woodsy feel of Folklore on opening night.",
      }),
    ]);
    const checkers = f.map((x: any) => x.checker);
    expect(checkers).toContain('content.era-capitalization.bad-ttpd-abbreviation');
    expect(checkers).toContain('content.era-capitalization.stylized-title-miscased');
  });
});
