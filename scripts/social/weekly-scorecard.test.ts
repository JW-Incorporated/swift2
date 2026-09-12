import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { weeklyFollowerDeltas, renderScorecard } from './weekly-scorecard.mjs';

const NOW = new Date('2026-08-23T12:00:00Z').getTime();

describe('weeklyFollowerDeltas', () => {
  it('compares against the snapshot ~7 days back, not just the previous day', () => {
    const series = [
      { date: '2026-08-16', followers: { instagram: 10, x: 5, facebook: 2 } },
      { date: '2026-08-20', followers: { instagram: 12, x: 5, facebook: 2 } }, // 3d ago — must NOT be used
      { date: '2026-08-23', followers: { instagram: 15, x: 6, facebook: 3 } },
    ];
    const { deltas, weekAgoDate } = weeklyFollowerDeltas(series, NOW);
    expect(weekAgoDate).toBe('2026-08-16');
    expect(deltas).toEqual({ instagram: 5, x: 1, facebook: 1 });
  });

  it('returns null deltas, not a wrong comparison, when history is under a week deep', () => {
    const series = [
      { date: '2026-08-22', followers: { instagram: 10, x: 5, facebook: 2 } },
      { date: '2026-08-23', followers: { instagram: 11, x: 5, facebook: 2 } },
    ];
    const { deltas, weekAgoDate } = weeklyFollowerDeltas(series, NOW);
    expect(deltas).toBeNull();
    expect(weekAgoDate).toBeNull();
  });

  it('returns null for an empty series entirely', () => {
    expect(weeklyFollowerDeltas([], NOW).deltas).toBeNull();
  });
});

describe('renderScorecard', () => {
  it('renders posts, deltas, and failures as a verbatim-pastable block', () => {
    const card = {
      posts: { total: 12, x: 5, instagram: 4, facebook: 3 },
      failedCount: 0,
      deltas: { instagram: 5, x: 1, facebook: -1 },
      weekAgoDate: '2026-08-16',
    };
    const out = renderScorecard(card);
    expect(out).toContain('X 5');
    expect(out).toContain('IG +5');
    expect(out).toContain('FB -1');
    expect(out).toContain('Failed posts this week:** 0');
  });

  it('states missing history honestly rather than a fabricated delta', () => {
    const card = { posts: { total: 0, x: 0, instagram: 0, facebook: 0 }, failedCount: 0, deltas: null, weekAgoDate: null };
    expect(renderScorecard(card)).toContain('not enough metrics history yet');
  });

  it('flags a non-zero failure count as the incident it is, not a passing stat', () => {
    const card = { posts: { total: 5, x: 5, instagram: 0, facebook: 0 }, failedCount: 2, deltas: null, weekAgoDate: null };
    expect(renderScorecard(card)).toContain('Failed posts this week:** 2');
    expect(renderScorecard(card)).toContain('target is zero');
  });

  // T4 (docs/specs/tree-overhaul/t4-weekly-brief.md AC#9/AC#10): 3 -> 5 lines.
  const BASE_CARD = {
    posts: { total: 12, x: 5, instagram: 4, facebook: 3 },
    failedCount: 0,
    deltas: { instagram: 5, x: 1, facebook: -1 },
    weekAgoDate: '2026-08-16',
  };

  it('AC#9: grows to 5 lines, with the first 3 byte-identical to the pre-T4 render for the same fixture', () => {
    const withVerdicts = { ...BASE_CARD, verdicts: { approve: 9, edit: 2, reject: 1, total: 12, needsChangePct: 25 }, latency: { median: 190 * 60000, slowest: 19 * 60 * 60000 } };
    const legacyLines = renderScorecard(BASE_CARD).split('\n');
    const fullLines = renderScorecard(withVerdicts).split('\n');
    expect(fullLines).toHaveLength(5);
    expect(fullLines.slice(0, 3)).toEqual(legacyLines.slice(0, 3));
    expect(fullLines[3]).toBe('**Your verdicts:** 9 ✅ · 2 ✏️ · 1 ❌ — 25% needed a change from you');
    expect(fullLines[4]).toBe('**Time to your answer:** median 3h 10m, slowest 19h');
  });

  it('AC#10: an empty ledger renders lines 4-5 as sentences, never 0% or NaN', () => {
    const card = { ...BASE_CARD, verdicts: { approve: 0, edit: 0, reject: 0, total: 0, needsChangePct: null }, latency: null };
    const out = renderScorecard(card);
    expect(out).toContain('**Your verdicts:** no drafts went to you this week');
    expect(out).toContain('**Time to your answer:** no drafts went to you this week');
    expect(out).not.toMatch(/0%|NaN/);
  });

  it('renders the same empty-window sentences when verdicts/latency are simply absent (pre-T4 callers)', () => {
    const out = renderScorecard(BASE_CARD);
    expect(out.split('\n')).toHaveLength(5);
    expect(out).toContain('**Your verdicts:** no drafts went to you this week');
    expect(out).toContain('**Time to your answer:** no drafts went to you this week');
  });
});
