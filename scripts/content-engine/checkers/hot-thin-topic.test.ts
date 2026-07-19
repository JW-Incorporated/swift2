import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './hot-thin-topic.mjs';

// Frozen "now" so recency assertions never rot: mid-July 2026.
const NOW = Date.parse('2026-07-19T00:00:00Z');

// A recent, high-visibility relationship moment with weak sourcing — the
// wedding shape. latest-news era (+4) + relationship (+3) clears the tier.
const weddingish = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'wedding',
  title: 'Taylor and Travis marry at Madison Square Garden',
  category: 'relationship',
  texts: { snippet: '' },
  images: [],
  sources: [{ url: 'a' }],
  raw: {
    year: 2026, month: 7, day: 3,
    moment: { sources: [{ url: 'a', reliability_score: 3 }] },
  },
  ...over,
});

describe('hot-thin-topic check', () => {
  it('flags the canonical case: recent + rumor-prone + thin + untreated', async () => {
    const f = await check([weddingish()], { now: NOW });
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.hot-thin-topic');
    expect(f[0].severity).toBe('P2');
  });

  it('does NOT flag settled history (the 2009 VMAs shape) — recency gate', async () => {
    const vmas = weddingish({
      era: 'fearless',
      file: 'supabase/seed/content/fearless.mjs',
      title: 'Kanye West interrupts the VMA speech — engagement of the whole culture',
      raw: { year: 2009, month: 9, day: 13, moment: { sources: [] } },
    });
    expect(await check([vmas], { now: NOW })).toEqual([]);
  });

  it('does NOT flag settled-by-nature categories (chart records, song stories)', async () => {
    // Real-world shape: certifications/chart records are filed as 'business'
    // in the seeds (the 2026-07-19 tuning run caught "1989 goes Diamond"
    // through the business category) — and song stories as 'music'.
    const cert = weddingish({
      title: '1989 goes Diamond — an engagement record for the catalog',
      category: 'business',
      raw: { year: 2026, month: 6, day: 1, moment: { sources: [] } },
    });
    const chart = weddingish({
      title: 'All 12 tracks debut as the Hot 100 entire top 12 — engagement record',
      category: 'music',
      raw: { year: 2025, month: 10, day: 18, significance: 'defining', moment: { sources: [] } },
    });
    expect(await check([cert, chart], { now: NOW })).toEqual([]);
  });

  it('does NOT flag a topic with solid confirmed sourcing', async () => {
    const wellSourced = weddingish({
      raw: {
        year: 2026, month: 7, day: 3,
        moment: { sources: [{ url: 'a', reliability_score: 4 }, { url: 'b', reliability_score: 5 }] },
      },
    });
    expect(await check([wellSourced], { now: NOW })).toEqual([]);
  });

  it('leaves the queue once rumor treatment exists (lifecycle handoff)', async () => {
    const treatedByConfidence = weddingish({ raw: { ...weddingish().raw, confidence: 'rumored' } });
    const treatedByRumors = weddingish({
      raw: { year: 2026, month: 7, day: 3, moment: { sources: [], rumors: [{ claim: 'x', outlet: 'Page Six' }] } },
    });
    expect(await check([treatedByConfidence, treatedByRumors], { now: NOW })).toEqual([]);
  });
});
