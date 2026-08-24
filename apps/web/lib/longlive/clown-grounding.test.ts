import { describe, expect, it } from 'vitest';

import { groundCitations, type GroundingStoreRow } from './clown-grounding';

function store(rows: Record<string, boolean>): ReadonlyMap<string, GroundingStoreRow> {
  return new Map(Object.entries(rows).map(([id, redlineOk]) => [id, { redlineOk }]));
}

describe('groundCitations', () => {
  it('every cited id exists and is redline_ok=true: ok, no problems', () => {
    const result = groundCitations(
      ['egg:midnights:orange-door', 'moment:midnights:teaser'],
      store({
        'egg:midnights:orange-door': true,
        'moment:midnights:teaser': true,
      }),
    );
    expect(result).toEqual({ ok: true, problems: [] });
  });

  it('empty citedIds: trivially ok', () => {
    expect(groundCitations([], store({}))).toEqual({ ok: true, problems: [] });
  });

  it('a cited id absent from the store is reported as missing (hallucinated)', () => {
    const s = store({ 'egg:real': true });
    const r = groundCitations(['egg:real', 'egg:invented'], s);
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual([{ id: 'egg:invented', reason: 'missing' }]);
  });

  it('a cited id that exists but is not redline_ok is reported as not-redline-ok', () => {
    const s = store({ 'egg:screened-out': false });
    const r = groundCitations(['egg:screened-out'], s);
    expect(r).toEqual({
      ok: false,
      problems: [{ id: 'egg:screened-out', reason: 'not-redline-ok' }],
    });
  });

  it('mixed run: reports every problem, in citation order, never deduped', () => {
    const s = store({ 'egg:good': true, 'egg:bad-flag': false });
    const r = groundCitations(['egg:good', 'egg:missing', 'egg:bad-flag', 'egg:missing'], s);
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual([
      { id: 'egg:missing', reason: 'missing' },
      { id: 'egg:bad-flag', reason: 'not-redline-ok' },
      { id: 'egg:missing', reason: 'missing' },
    ]);
  });
});
