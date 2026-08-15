import { describe, expect, it } from 'vitest';
import { evaluate, findConfirmingPr, REPAIR_SINCE, WINDOW_END } from './karen-post-repair-check.mjs';

const pr = (n: number, title: string, mergedAt: string) => ({ number: n, title, mergedAt });

const report = (date: string, extra: { source?: string; filingStatus?: string; unfiled?: number } = {}) => {
  const lines = [`# Content Integrity Engine — run ${date}`];
  if (extra.source) lines.push(`<!-- cie-run: source=${extra.source} date=${date} -->`);
  if (extra.filingStatus) {
    lines.push(
      `<!-- cie-filing: status=${extra.filingStatus} filed=3 deduped=0 unfiled=${extra.unfiled ?? 0} -->`,
    );
  }
  return { name: `${date}-cie-run.md`, date, text: lines.join('\n') };
};

describe('findConfirmingPr', () => {
  it('ignores a genuine Karen PR merged before the repair', () => {
    const found = findConfirmingPr([pr(1850, 'karen: nightly run report 2026-08-09', '2026-08-09T09:27:37Z')]);
    expect(found).toBeNull();
  });

  it('finds a genuine post-repair Karen PR', () => {
    const found = findConfirmingPr([
      pr(1547, 'karen: nightly run report 2026-07-26', '2026-07-26T09:16:50Z'),
      pr(2200, 'karen: nightly run report 2026-08-16', '2026-08-16T09:00:00Z'),
    ]);
    expect(found?.number).toBe(2200);
  });

  it('does not match an unrelated PR that happens to mention Karen', () => {
    const found = findConfirmingPr([pr(2201, 'fix(karen): unrelated cleanup', '2026-08-16T09:00:00Z')]);
    expect(found).toBeNull();
  });
});

describe('evaluate — Karen did NOT run (unconfirmed)', () => {
  it('reports unconfirmed when there is no PR and no qualifying report, inside the window', () => {
    const result = evaluate({
      prs: [],
      newestReport: report('2026-08-14'), // real state: no markers at all (PR #2088 bypass)
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('unconfirmed');
  });

  it('reports unconfirmed when the newest report has no cie-run marker even though it postdates the repair', () => {
    const result = evaluate({
      prs: [],
      newestReport: report('2026-08-16'), // no source= marker at all
      now: new Date('2026-08-17T14:35:00Z'),
    });
    expect(result.status).toBe('unconfirmed');
  });

  it('stands down at window expiry instead of nagging forever', () => {
    const result = evaluate({
      prs: [],
      newestReport: report('2026-08-14'),
      now: new Date(WINDOW_END),
    });
    expect(result.status).toBe('window-expired');
  });
});

describe('evaluate — Karen DID run (confirmed)', () => {
  it('confirms via a merged Karen PR alone, even with no usable report', () => {
    const result = evaluate({
      prs: [pr(2200, 'karen: nightly run report 2026-08-16', '2026-08-16T09:00:00Z')],
      newestReport: null,
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('confirmed');
    expect(result.reason).toMatch(/#2200/);
  });

  it('confirms via a report with source=all and filing status=ok', () => {
    const result = evaluate({
      prs: [],
      newestReport: report('2026-08-16', { source: 'all', filingStatus: 'ok', unfiled: 0 }),
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('confirmed');
  });

  it('is only partial when the run is genuine but filing did not complete', () => {
    const result = evaluate({
      prs: [],
      newestReport: report('2026-08-16', { source: 'all', filingStatus: 'partial-failure', unfiled: 12 }),
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('partial');
  });

  it('does not confirm from a scan-only report even if dated after the repair', () => {
    const result = evaluate({
      prs: [],
      newestReport: report('2026-08-16', { source: 'scan', filingStatus: 'ok', unfiled: 0 }),
      now: new Date('2026-08-16T14:35:00Z'),
    });
    expect(result.status).toBe('unconfirmed');
  });
});

it('REPAIR_SINCE is the founder-specified 2026-08-15 cutoff', () => {
  expect(REPAIR_SINCE.startsWith('2026-08-15')).toBe(true);
});
