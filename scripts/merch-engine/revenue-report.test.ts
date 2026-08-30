import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildRevenueReport, formatRevenueSection, parseCoverage, parseNetworkReport, parseReportInput } from './revenue-report.mjs';

describe('revenue reporting', () => {
  const coverage = {
    rows: [
      { source: 'folklore.cardigan', retailer: 'amazon.com', status: 'pending-signup' },
      { source: 'folklore.cardigan', retailer: 'indie.example', status: 'uncovered' },
      { source: 'official', retailer: 'store.taylorswift.com', status: 'direct-by-policy' },
    ],
  };

  it('joins network rows by subid and totals eras, moments, and buckets', () => {
    const report = buildRevenueReport({
      coverage,
      reports: [
        { network: 'awin', available: true, rows: [{ subid: 'folklore.cardigan', clicks: 4, revenue: 1.5 }] },
        { network: 'amazon', available: true, rows: [{ subid: 'folklore.cardigan', clicks: 2, revenue: 3.25 }] },
      ],
    });

    expect(report.totals).toEqual({ clicks: 6, revenue: 4.75 });
    expect(report.byEra).toEqual([{ id: 'folklore', clicks: 6, revenue: 4.75 }]);
    expect(report.byMoment).toEqual([{ id: 'folklore.cardigan', clicks: 6, revenue: 4.75 }]);
    expect(report.byBucket).toEqual([]);
  });

  it('makes missing APIs explicit rather than treating them as zero', () => {
    const report = buildRevenueReport({ coverage, reports: [{ network: 'awin', available: false, reason: 'reporting API is not configured' }] });

    expect(report.sources).toEqual([{ network: 'awin', status: 'unavailable', reason: 'reporting API is not configured' }]);
    expect(formatRevenueSection(report)).toContain('Awin: unavailable — reporting API is not configured');
    expect(formatRevenueSection(report)).not.toContain('$0.00');
  });

  it('ranks uncovered retailers only when click evidence identifies them', () => {
    const report = buildRevenueReport({
      coverage,
      reports: [
        { network: 'site-clicks', available: true, rows: [
          { subid: 'folklore.cardigan', retailer: 'indie.example', clicks: 9, revenue: 0 },
          { subid: 'folklore.cardigan', retailer: 'amazon.com', clicks: 20, revenue: 0 },
        ] },
      ],
    });

    expect(report.uncoveredRetailers).toEqual([{ retailer: 'indie.example', clicks: 9 }]);
  });

  it('does not assign aggregate clicks without a retailer to every uncovered retailer', () => {
    const report = buildRevenueReport({
      coverage: {
        rows: [
          { source: 'folklore.cardigan', retailer: 'indie.example', status: 'uncovered' },
          { source: 'folklore.cardigan', retailer: 'other.example', status: 'uncovered' },
        ],
      },
      reports: [{ network: 'site-clicks', available: true, rows: [{ subid: 'folklore.cardigan', clicks: 9, revenue: 0 }] }],
    });

    expect(report.uncoveredRetailers).toEqual([]);
  });

  it('rejects malformed report rows instead of guessing identifiers or values', () => {
    expect(() => parseNetworkReport({ network: 'awin', rows: [{ subid: '', clicks: 1, revenue: 0 }] })).toThrow('subid');
    expect(() => parseNetworkReport({ network: 'awin', rows: [{ subid: 'folklore.cardigan', clicks: -1, revenue: 0 }] })).toThrow('clicks');
  });

  it('parses the generated coverage report schema without losing its row fields', () => {
    const coverage = parseCoverage([
      '| item | retailer | network | status | link-format | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| Cardigan | indie.example | none | uncovered | direct retailer URL | folklore.cardigan |',
    ].join('\n'));

    expect(coverage.rows).toEqual([{
      item: 'Cardigan',
      retailer: 'indie.example',
      network: 'none',
      status: 'uncovered',
      linkFormat: 'direct retailer URL',
      source: 'folklore.cardigan',
    }]);
  });

  it('accepts the checked-in multi-network input manifest', () => {
    expect(parseReportInput({ reports: [
      { network: 'awin', available: false, reason: 'not configured' },
      { network: 'amazon', available: false, reason: 'not configured' },
    ] })).toEqual([
      { network: 'awin', available: false, reason: 'not configured' },
      { network: 'amazon', available: false, reason: 'not configured' },
    ]);
  });
});
