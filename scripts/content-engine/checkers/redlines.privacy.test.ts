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
  // 2026-07-20: forward-looking location is deliberately NO LONGER a
  // deterministic finding. The rule now keys on specificity weighted by
  // provenance, not tense (docs/content-ops/rumor-pipeline.md) — an announced
  // tour date is future, venue-level and legitimate, so a tense regex here
  // would hard-fail CI on real tour announcements. The judgment call routes to
  // candidates() instead; see the location-privacy tests below.
  it('does NOT hard-fail region-level forward-looking location (now legal at L0)', async () => {
    const f = await check([
      moment({ context: 'She is reportedly heading to the Caribbean once the tour wraps.' }),
    ]);
    expect(f).toEqual([]);
  });

  it('does NOT hard-fail an officially announced future venue (L2, announced)', async () => {
    const f = await check([
      moment({ context: 'She plays Wembley Stadium on 14 August, the promoter confirmed.' }),
    ]);
    expect(f).toEqual([]);
  });

  // Interception-grade travel detail stays banned at every provenance — the
  // line is between "somewhere in the world" and "how to be where she lands".
  it('flags a flight number at any provenance', async () => {
    const f = await check([moment({ context: 'She boarded flight no. AA271 out of the city.' })]);
    expect(f.some((x: { excerpt: string }) => /flight no\. AA271/i.test(x.excerpt))).toBe(true);
  });

  it('flags private-aviation logs', async () => {
    const f = await check([moment({ context: 'Fans compiled her jet logs for the month.' })]);
    expect(f.some((x: { excerpt: string }) => /jet logs/i.test(x.excerpt))).toBe(true);
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

  // The case a regex genuinely cannot decide: identical phrasing, opposite
  // verdicts, because the answer is in the place name that follows.
  it('routes speculative forward-looking location to the location-privacy review', () => {
    const bahamas = candidates([moment({ context: 'She is expected at the Bahamas resort area next month.' })]);
    const hotel = candidates([moment({ context: 'She is expected at the Bowery Hotel this weekend.' })]);
    // Both surface for the agent; neither is auto-accused. The agent applies
    // the matrix — L0 passes, L2 speculation does not.
    expect(bahamas.some((x: { kind: string }) => x.kind === 'location-privacy')).toBe(true);
    expect(hotel.some((x: { kind: string }) => x.kind === 'location-privacy')).toBe(true);
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
