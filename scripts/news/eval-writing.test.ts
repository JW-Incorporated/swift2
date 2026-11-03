// eval-writing unit test — tiny fixture: 3 results (1 pass, 2 fails sharing
// body_too_short) gives passed 1, reason counts in count-desc order, and the
// worst list most-reasons-first with the passing item excluded.

import { describe, it, expect } from 'vitest';
import { summarize } from './eval-writing.mjs';

describe('summarize', () => {
  const results = [
    { id: 'a', headline: 'A', ok: true, reasons: [] },
    { id: 'b', headline: 'B', ok: false, reasons: ['body_too_short'] },
    { id: 'c', headline: 'C', ok: false, reasons: ['body_too_short', 'lead_length'] },
  ];

  it('counts totals and the pass rate', () => {
    const summary = summarize(results);
    expect(summary.total).toBe(3);
    expect(summary.passed).toBe(1);
    expect(summary.passRate).toBeCloseTo(1 / 3, 5);
  });

  it('counts each reason code, most frequent first', () => {
    const { reasons } = summarize(results);
    expect(reasons).toEqual({ body_too_short: 2, lead_length: 1 });
    expect(Object.keys(reasons)).toEqual(['body_too_short', 'lead_length']);
  });

  it('lists failing items worst-first', () => {
    const { worst } = summarize(results);
    expect(worst.map((w) => w.id)).toEqual(['c', 'b']);
    expect(worst[0]).toEqual({ id: 'c', headline: 'C', reasons: ['body_too_short', 'lead_length'] });
  });

  it('keeps input order on ties and breaks reason-count ties by code', () => {
    const { worst, reasons } = summarize([
      { id: 'x', ok: false, reasons: ['lead_length'] },
      { id: 'y', ok: false, reasons: ['body_too_short'] },
    ]);
    expect(worst.map((w) => w.id)).toEqual(['x', 'y']);
    expect(Object.keys(reasons)).toEqual(['body_too_short', 'lead_length']);
  });

  it('returns an empty summary for no input', () => {
    expect(summarize([])).toEqual({ total: 0, passed: 0, passRate: 0, reasons: {}, worst: [] });
  });
});
