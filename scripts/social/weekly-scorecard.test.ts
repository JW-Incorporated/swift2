import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { weeklyFollowerDeltas, renderScorecard, calibration, renderCalibration, expiredWhilePending, redditRepliesDone } from './weekly-scorecard.mjs';

function feedbackRow(overrides: Record<string, unknown> = {}) {
  return { ts: '2026-09-14T00:00:00Z', pr: 1, file: 'social/queue/2026-09-14-example-x.json', action: 'approve', ...overrides };
}

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
    expect(fullLines).toHaveLength(8); // S8 appends lines 6-8 unconditionally; see the dedicated 8-line test below
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
    expect(out.split('\n')).toHaveLength(8); // S8 appends lines 6-8 unconditionally; see the dedicated 8-line test below
    expect(out).toContain('**Your verdicts:** no drafts went to you this week');
    expect(out).toContain('**Time to your answer:** no drafts went to you this week');
  });

  // S8 (PLAN.md's S6+S8 task, docs/plans/tree-overhaul PLAN.md "S8 —
  // scorecard extensions"): 5 -> 8 lines, lines 6-8 appended in the same
  // optional-line style T4 established for lines 4-5.
  const WITH_T4 = { ...BASE_CARD, verdicts: { approve: 9, edit: 2, reject: 1, total: 12, needsChangePct: 25 }, latency: { median: 190 * 60000, slowest: 19 * 60 * 60000 } };

  it('grows to 8 lines, with the first 5 byte-identical to the pre-S8 render for the same fixture', () => {
    const withReddit = { ...WITH_T4, redditLatency: { median: 3 * 60 * 60000, slowest: 8 * 60 * 60000 }, expiredWhilePending: 1, redditRepliesDone: 4 };
    const preS8Lines = renderScorecard(WITH_T4).split('\n');
    const fullLines = renderScorecard(withReddit).split('\n');
    expect(fullLines).toHaveLength(8);
    expect(fullLines.slice(0, 5)).toEqual(preS8Lines.slice(0, 5));
    expect(fullLines[5]).toBe('**Time to your Reddit answer:** median 3h, slowest 8h');
    expect(fullLines[6]).toBe('**Slowest to hear back (>48h):** 1 target took longer than 48h to hear back from you');
    expect(fullLines[7]).toBe('**Reddit replies done:** 4');
  });

  it('pluralizes "targets" correctly and renders a real, informative zero (not a sentinel) when nothing was slow', () => {
    const zero = { ...WITH_T4, redditLatency: null, expiredWhilePending: 0, redditRepliesDone: 0 };
    const out = renderScorecard(zero);
    expect(out).toContain('**Slowest to hear back (>48h):** 0 targets took longer than 48h to hear back from you');
    expect(out).toContain('**Reddit replies done:** 0');
  });

  it('renders lines 6-8 as sentences, never 0/NaN, when nothing reddit-shaped is in the window at all', () => {
    const card = { ...WITH_T4, redditLatency: null, expiredWhilePending: null, redditRepliesDone: null };
    const out = renderScorecard(card);
    expect(out).toContain('**Time to your Reddit answer:** no Reddit prompts were resolved this week');
    expect(out).toContain('**Slowest to hear back (>48h):** no drafts or Reddit prompts were resolved this week');
    expect(out).toContain('**Reddit replies done:** no Reddit prompts were resolved this week');
    expect(out).not.toMatch(/undefined|NaN/);
  });

  it('renders the same 8 lines, with 6-8 as sentences, when the 3 new fields are simply absent (pre-S8 callers)', () => {
    const out = renderScorecard(WITH_T4);
    expect(out.split('\n')).toHaveLength(8);
    expect(out).toContain('**Time to your Reddit answer:** no Reddit prompts were resolved this week');
    expect(out).toContain('**Slowest to hear back (>48h):** no drafts or Reddit prompts were resolved this week');
    expect(out).toContain('**Reddit replies done:** no Reddit prompts were resolved this week');
  });
});

describe('expiredWhilePending (S8b)', () => {
  // Discord snowflake ids encoding 2026-09-14T10:00:00.000Z and
  // 2026-09-14T10:00:00.000Z + 49h respectively (same technique
  // feedback.test.ts's aggregateLatency fixtures use).
  const POSTED = '1548996732518400000'; // 2026-09-14T10:00:00.000Z

  it('counts a draft or reddit row whose brief-to-answer latency exceeded 48h', () => {
    const rows = [
      { file: 'social/queue/a.json', messageId: POSTED, ts: '2026-09-16T12:00:00.000Z' }, // ~50h, slow
      { file: 'reddit:x', messageId: POSTED, ts: '2026-09-14T12:00:00.000Z' }, // 2h, not slow
      { file: 'proposal:1', messageId: POSTED, ts: '2026-09-20T12:00:00.000Z' }, // not tracked by this metric at all
    ];
    expect(expiredWhilePending(rows)).toBe(1);
  });

  it('returns null (never a bare 0) when nothing in the window has a decodable latency sample', () => {
    expect(expiredWhilePending([])).toBeNull();
    expect(expiredWhilePending([{ file: 'proposal:1', messageId: POSTED, ts: '2026-09-14T12:00:00.000Z' }])).toBeNull();
  });

  it('returns a real 0 (not null) when tracked rows exist but none were slow', () => {
    expect(expiredWhilePending([{ file: 'social/queue/a.json', messageId: POSTED, ts: '2026-09-14T12:00:00.000Z' }])).toBe(0);
  });
});

describe('redditRepliesDone (S8c)', () => {
  it('counts only action:"approve" rows scoped to reddit:<postId>', () => {
    const rows = [
      { file: 'reddit:a', action: 'approve' },
      { file: 'reddit:b', action: 'approve' },
      { file: 'reddit:c', action: 'edit' },
      { file: 'reddit:d', action: 'skip' },
      { file: 'social/queue/e.json', action: 'approve' }, // not reddit — excluded
    ];
    expect(redditRepliesDone(rows)).toBe(2);
  });

  it('returns null (never a bare 0) when no reddit row appears in the window at all', () => {
    expect(redditRepliesDone([])).toBeNull();
    expect(redditRepliesDone([{ file: 'social/queue/a.json', action: 'approve' }])).toBeNull();
  });

  it('returns a real 0 (not null) when reddit rows exist but none are approve', () => {
    expect(redditRepliesDone([{ file: 'reddit:a', action: 'reject' }])).toBe(0);
  });
});

describe('calibration (Tree Overhaul T2 — the Monday calibration)', () => {
  it('returns verdict "insufficient" with fewer than 3 rejections, and never a mean over n<1 (spec AC#8)', () => {
    const noRejections = calibration({
      ledgerRows: [feedbackRow({ action: 'approve', critiqueTotal: 21 }), feedbackRow({ action: 'approve', critiqueTotal: 23 })],
    });
    expect(noRejections.verdict).toBe('insufficient');
    expect(noRejections.rejectedMean).toBeNull();
    expect(noRejections.n).toBe(0);

    const twoRejections = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', critiqueTotal: 21 }),
        feedbackRow({ action: 'reject', critiqueTotal: 19 }),
        feedbackRow({ action: 'reject', critiqueTotal: 18 }),
      ],
    });
    expect(twoRejections.verdict).toBe('insufficient');
    expect(twoRejections.n).toBe(2);
    expect(twoRejections.rejectedMean).toBeCloseTo(18.5); // a mean IS computable at n=2 — only the VERDICT is "insufficient"
  });

  it('flags "uncalibrated" when a rejected item\'s total exceeds the approved mean, even though the aggregate spread alone would read "calibrated" (spec AC#9)', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', critiqueTotal: 20 }),
        feedbackRow({ action: 'approve', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', critiqueTotal: 10 }),
        feedbackRow({ action: 'reject', critiqueTotal: 10 }),
        feedbackRow({ action: 'reject', critiqueTotal: 22 }), // outscored the approved mean (20)
      ],
    });
    expect(c.approvedMean).toBe(20);
    expect(c.spread).toBeGreaterThanOrEqual(3); // the aggregate spread alone would say "calibrated"
    expect(c.verdict).toBe('uncalibrated'); // the per-item floor overrides it anyway
  });

  it('is "uncalibrated" when the spread itself is under 3.0, even with no single outlier', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', critiqueTotal: 19 }),
        feedbackRow({ action: 'reject', critiqueTotal: 18 }),
        feedbackRow({ action: 'reject', critiqueTotal: 19 }),
      ],
    });
    expect(c.spread).toBeLessThan(3);
    expect(c.verdict).toBe('uncalibrated');
  });

  it('is "calibrated" when the spread is wide and no rejection outscores the approved mean', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', critiqueTotal: 23 }),
        feedbackRow({ action: 'approve', critiqueTotal: 22 }),
        feedbackRow({ action: 'reject', critiqueTotal: 15 }),
        feedbackRow({ action: 'reject', critiqueTotal: 16 }),
        feedbackRow({ action: 'reject', critiqueTotal: 17 }),
      ],
    });
    expect(c.verdict).toBe('calibrated');
  });

  it('excludes reddit/proposal/header rows — only `social/queue/`-prefixed files are drafts', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'reject', file: 'reddit:abc123', critiqueTotal: 5 }),
        feedbackRow({ action: 'reject', file: 'proposal:2', critiqueTotal: 5 }),
        feedbackRow({ action: 'reject', file: '*', critiqueTotal: 5 }),
      ],
    });
    expect(c.n).toBe(0);
    expect(c.rejectedMean).toBeNull();
  });

  it("joins a still-on-disk item's critique.total by file, falling back to the row's own critiqueTotal for a deleted (rejected) file", () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', file: 'social/queue/a.json' }), // no critiqueTotal on the row — must join
        feedbackRow({ action: 'reject', file: 'social/queue/b.json', critiqueTotal: 14 }), // file is gone — must use the row
        feedbackRow({ action: 'reject', file: 'social/queue/c.json', critiqueTotal: 15 }),
        feedbackRow({ action: 'reject', file: 'social/queue/d.json', critiqueTotal: 16 }),
      ],
      items: [{ file: 'social/queue/a.json', critique: { total: 24 } }],
    });
    expect(c.approvedMean).toBe(24);
    expect(c.rejectedMean).toBeCloseTo(15);
  });

  it('never computes a mean over n=0 for any bucket — null, not NaN or 0', () => {
    const c = calibration({});
    expect(c.approvedMean).toBeNull();
    expect(c.editedMean).toBeNull();
    expect(c.rejectedMean).toBeNull();
    expect(c.spread).toBeNull();
    expect(c.verdict).toBe('insufficient');
  });

  // Round 6 review: `byAction` was a plain `{}`, so `row.action in byAction`
  // walks the prototype chain — `action: "constructor"` (a corrupted/
  // hand-edited ledger line) passed the guard and then crashed on
  // `byAction[row.action].push(...)`, the identical shape this round's
  // PLATFORM_RULES/ACCOUNT_BY_PLATFORM fixes already closed elsewhere.
  it('an Object.prototype property name as `action` does not crash — excluded, not treated as a real bucket', () => {
    for (const evilAction of ['constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
      expect(() => calibration({ ledgerRows: [{ action: evilAction, file: 'social/queue/a.json', critiqueTotal: 20 }] })).not.toThrow();
      const c = calibration({ ledgerRows: [{ action: evilAction, file: 'social/queue/a.json', critiqueTotal: 20 }] });
      expect(c.approvedMean).toBeNull();
      expect(c.editedMean).toBeNull();
      expect(c.rejectedMean).toBeNull();
      expect(c.n).toBe(0);
    }
  });

  // Codex round 1, MEDIUM 3 — reproduction: an approved item whose live
  // queue/posted file carries only `{ critique: { total: 999 } }` used to
  // override a CORRECT ledger critiqueTotal:20, and with 3 real rejects
  // scoring 20 each, calibration reported approvedMean:999, spread:979,
  // verdict:'calibrated' — confident-looking nonsense.
  describe('trusts the ledger snapshot over the live item, and bounds-checks either source (Codex round 1, MEDIUM 3)', () => {
    it("prefers the ledger's own immutable critiqueTotal over the live item's CURRENT critique.total when both exist", () => {
      const c = calibration({
        ledgerRows: [
          feedbackRow({ action: 'approve', file: 'social/queue/a.json', critiqueTotal: 20 }),
          feedbackRow({ action: 'reject', file: 'social/queue/b.json', critiqueTotal: 20 }),
          feedbackRow({ action: 'reject', file: 'social/queue/c.json', critiqueTotal: 20 }),
          feedbackRow({ action: 'reject', file: 'social/queue/d.json', critiqueTotal: 20 }),
        ],
        items: [{ file: 'social/queue/a.json', critique: { total: 999 } }], // corrupted/edited live item
      });
      expect(c.approvedMean).toBe(20); // NOT 999
    });

    it('the exact Codex repro no longer produces a nonsense "calibrated" verdict off a spread of 979', () => {
      const c = calibration({
        ledgerRows: [
          feedbackRow({ action: 'approve', file: 'social/queue/a.json', critiqueTotal: 20 }),
          feedbackRow({ action: 'reject', file: 'social/queue/b.json', critiqueTotal: 20 }),
          feedbackRow({ action: 'reject', file: 'social/queue/c.json', critiqueTotal: 20 }),
          feedbackRow({ action: 'reject', file: 'social/queue/d.json', critiqueTotal: 20 }),
        ],
        items: [{ file: 'social/queue/a.json', critique: { total: 999 } }],
      });
      expect(c.spread).toBe(0);
      expect(c.verdict).toBe('uncalibrated'); // spread 0 < 3.0 — no longer 'calibrated'
    });

    it('excludes an out-of-bounds critiqueTotal on the LEDGER row rather than trusting it', () => {
      const c = calibration({ ledgerRows: [feedbackRow({ action: 'approve', file: 'social/queue/a.json', critiqueTotal: 999 })] });
      expect(c.approvedMean).toBeNull();
    });

    it('excludes an out-of-bounds critique.total on the FALLBACK live item rather than trusting it', () => {
      const c = calibration({
        ledgerRows: [feedbackRow({ action: 'approve', file: 'social/queue/a.json' })], // no critiqueTotal on the row
        items: [{ file: 'social/queue/a.json', critique: { total: 999 } }],
      });
      expect(c.approvedMean).toBeNull();
    });

    it('excludes a non-integer critiqueTotal from either source', () => {
      const c1 = calibration({ ledgerRows: [feedbackRow({ action: 'approve', file: 'social/queue/a.json', critiqueTotal: 20.5 })] });
      expect(c1.approvedMean).toBeNull();
      const c2 = calibration({
        ledgerRows: [feedbackRow({ action: 'approve', file: 'social/queue/a.json' })],
        items: [{ file: 'social/queue/a.json', critique: { total: '20' } }],
      });
      expect(c2.approvedMean).toBeNull();
    });
  });

  // Codex round 1, MEDIUM 4 — reproduction: 3 rejects scoring 20, zero
  // scored approvals -> null spread math still fell through to the final
  // `else` and reported 'calibrated'. Both sides of the comparison need
  // real data, not just the rejected side.
  it('does not report "calibrated" (or "uncalibrated") with zero scored approvals, even with 3+ valid rejections', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'reject', file: 'social/queue/a.json', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', file: 'social/queue/b.json', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', file: 'social/queue/c.json', critiqueTotal: 20 }),
      ],
    });
    expect(c.approvedMean).toBeNull();
    expect(c.n).toBe(3);
    expect(c.verdict).toBe('insufficient');
  });
});

describe('renderCalibration', () => {
  it('states "not enough rejections" honestly for an insufficient verdict, never a fabricated number', () => {
    const c = calibration({ ledgerRows: [feedbackRow({ action: 'approve', critiqueTotal: 21 })] });
    expect(renderCalibration(c)).toContain('not enough rejections to calibrate against');
  });

  // Codex round 1, MEDIUM 4: with real rejections but zero approvals, don't
  // blame "not enough rejections" — that would be false.
  it('states "nothing approved yet" honestly when rejections exist but there is no approved sample to compare against', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'reject', file: 'social/queue/a.json', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', file: 'social/queue/b.json', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', file: 'social/queue/c.json', critiqueTotal: 20 }),
      ],
    });
    const out = renderCalibration(c);
    expect(out).toContain('nothing approved yet');
    expect(out).not.toContain('not enough rejections');
  });

  it('renders the calibrated verdict', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', critiqueTotal: 23 }),
        feedbackRow({ action: 'reject', critiqueTotal: 15 }),
        feedbackRow({ action: 'reject', critiqueTotal: 16 }),
        feedbackRow({ action: 'reject', critiqueTotal: 17 }),
      ],
    });
    expect(renderCalibration(c)).toContain('calibrated');
  });

  it('renders the uncalibrated verdict with the spread called out', () => {
    const c = calibration({
      ledgerRows: [
        feedbackRow({ action: 'approve', critiqueTotal: 20 }),
        feedbackRow({ action: 'reject', critiqueTotal: 19 }),
        feedbackRow({ action: 'reject', critiqueTotal: 18 }),
        feedbackRow({ action: 'reject', critiqueTotal: 19 }),
      ],
    });
    const out = renderCalibration(c);
    expect(out).toContain('Spread');
    expect(out).toContain("not yet distinguishing");
  });
});
