// eval-writing unit test — tiny fixture: 3 results (1 pass, 2 fails sharing
// body_too_short) gives passed 1, reason counts in count-desc order, and the
// worst list most-reasons-first with the passing item excluded.

import { describe, it, expect } from 'vitest';
import { scoreItems, summarize } from './eval-writing.mjs';

describe('scoreItems', () => {
  it('scores a v2 item with no citations like the read gate, crediting fact attributions', () => {
    const lead =
      'Taylor stepped into a quiet Nashville recording room this week, and the photos that followed have fans wondering what the next chapter of The Life of a Showgirl might sound like. The visit was brief, but the timing lands in a stretch of careful silence.';
    const body =
      'The photos show Taylor outside Blackbird Studio in Nashville on Tuesday afternoon. According to Variety, the session ran long. Neither her team nor the studio has said what the session was for. Blackbird has hosted sessions for artists across country and pop for decades. Fans noticed the visit within hours and began comparing it with earlier studio sightings. Last autumn the album rollout began with a similarly quiet stretch of studio rumors. That history is why one afternoon outside a recording room now draws such attention. For now the only detail anyone can confirm is the location and the day. Everything about the purpose stays open until Taylor or her representatives say otherwise. Watch her official channels over the coming days, since announcements for this era have usually landed with very little warning, often on a weekday morning.';
    const facts = [{ id: 'f1', claim: 'The session ran long.', attribution: 'Variety', confidence: 'reported' }];
    const [scored] = scoreItems([{ id: 'v2', headline: 'Taylor at Blackbird', summary: lead, detail: body, sources: [], facts }]);
    expect(scored?.reasons).not.toContain('citations_missing');
    expect(scored?.reasons).not.toContain('attribution_unknown_outlet');
    expect(scored?.ok).toBe(true);
  });
});

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
