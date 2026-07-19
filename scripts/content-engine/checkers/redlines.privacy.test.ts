import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check, candidates } from './redlines.mjs';

// Privacy-redline coverage (docs/content-ops/privacy-redlines.md). The
// pre-existing redline behaviors (lyrics, dumps, addresses) are exercised by
// the engine's own runs; this file locks the 2026-07-19 privacy additions.
const moment = (texts: Record<string, string>, over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'k',
  title: 't',
  texts,
  sources: [],
  images: [],
  raw: {},
  ...over,
});

describe('redlines — future-whereabouts hard patterns (auto-filed P0)', () => {
  it('flags forward-looking location — the dangerous rumor payload', async () => {
    const f = await check([moment({ context: 'She is reportedly staying at a hotel near the Garden this week.' })]);
    expect(f.some((x: { title: string }) => /Private\/location data/.test(x.title))).toBe(true);
  });

  it('flags planned-attendance phrasing', async () => {
    const f = await check([moment({ context: 'Swift is expected to attend at the ceremony on Saturday.' })]);
    expect(f.some((x: { excerpt: string }) => /expected to attend at/i.test(x.excerpt))).toBe(true);
  });

  it('flags travel-pattern references', async () => {
    const f = await check([moment({ context: 'Fans mapped her usual route to the stadium.' })]);
    expect(f.some((x: { excerpt: string }) => /usual route/i.test(x.excerpt))).toBe(true);
  });

  it('does NOT flag past-tense venue-level sightings (the Always-OK shape)', async () => {
    const f = await check([
      moment({ context: 'She was at Arrowhead Stadium on Oct. 12, chatting in the suite as Kansas City won.' }),
    ]);
    expect(f).toEqual([]);
  });
});

describe('redlines — privacy-speculation candidates (agent-classified, never auto-accused)', () => {
  it('routes pregnancy/medical speculation to the privacy-speculation review', () => {
    const c = candidates([moment({ context: 'Tabloids ran a pregnancy rumor after the game.' })]);
    expect(c.some((x: { kind: string }) => x.kind === 'privacy-speculation')).toBe(true);
  });

  it('routes home/security references to the location-privacy review', () => {
    const c = candidates([moment({ context: 'Paparazzi gathered outside her house in the neighborhood.' })]);
    expect(c.some((x: { kind: string }) => x.kind === 'location-privacy')).toBe(true);
  });

  it('routes the disclosed-diagnosis shape to review too — the AGENT applies the Always-OK exception, not the screen', () => {
    // Andrea's cancer diagnosis was disclosed by Taylor herself → Always-OK
    // content, but the deterministic screen must still surface it for
    // classification rather than silently passing anything containing the term.
    const c = candidates([moment({ context: 'She shared her mother’s cancer diagnosis in a 2019 interview.' })]);
    expect(c.some((x: { kind: string }) => x.kind === 'privacy-speculation')).toBe(true);
  });

  it('produces NO candidates for plain public-event coverage', () => {
    const c = candidates([moment({ context: 'The album debuted at No. 1 with record first-week sales.' })]);
    expect(c).toEqual([]);
  });
});
