import { describe, expect, it } from 'vitest';
import { scoreEra, ACTIVE_FLOOR, ACTIVE_CEILING, WAVETOP_CEILING } from './depth-audit.mjs';

const era = { slug: 'fixture-era', start_date: '2022-01-01', end_date: '2022-04-30' };
const milestones = [{ era_slug: 'fixture-era', date: '2022-01-15', title: 'Album released' }];

describe('scoreEra', () => {
  it('flags a non-wavetop month below the Active floor', () => {
    const items = [
      // Jan (wavetop): 1 item — fine, wavetop has no floor requirement.
      { year: 2022, month: 1, category: 'business', title: 'A' },
      // Feb (non-wavetop): 1 item — below the 2-item Active floor.
      { year: 2022, month: 2, category: 'music', title: 'B' },
      // Mar: meets floor with 2, one of them weighted.
      { year: 2022, month: 3, category: 'fashion', title: 'C' },
      { year: 2022, month: 3, category: 'business', title: 'D' },
      // Apr: no items at all (Quiet by design, still flagged below-floor).
    ];
    const result = scoreEra(era, milestones, items, '2022-12-01');
    const byKey = Object.fromEntries(result.months.map((m) => [m.key, m]));

    expect(byKey['2022-01'].wavetop).toBe(true);
    expect(byKey['2022-01'].belowFloor).toBe(false); // wavetop exempt from floor
    expect(byKey['2022-02'].belowFloor).toBe(true);
    expect(byKey['2022-03'].belowFloor).toBe(false);
    expect(byKey['2022-04'].belowFloor).toBe(true);
    expect(byKey['2022-04'].total).toBe(0);
  });

  it('flags a month with zero of the three weighted categories', () => {
    const items = [
      { year: 2022, month: 2, category: 'business', title: 'A' },
      { year: 2022, month: 2, category: 'music', title: 'B' },
    ];
    const result = scoreEra(era, milestones, items, '2022-12-01');
    const feb = result.months.find((m) => m.key === '2022-02');
    expect(feb.zeroWeighted.sort()).toEqual(['fashion', 'relationship', 'sighting']);
  });

  it('does not flag zero-weighted when at least one weighted category is present', () => {
    const items = [
      { year: 2022, month: 2, category: 'fashion', title: 'A' },
      { year: 2022, month: 2, category: 'business', title: 'B' },
    ];
    const result = scoreEra(era, milestones, items, '2022-12-01');
    const feb = result.months.find((m) => m.key === '2022-02');
    expect(feb.zeroWeighted).toEqual(['relationship', 'sighting']);
  });

  it('flags over-ceiling for a non-wavetop month with >4 items, ceiling 8 for wavetop', () => {
    const items = [
      // Jan is wavetop: 6 items is fine (under WAVETOP_CEILING=8).
      ...Array.from({ length: 6 }, (_, i) => ({
        year: 2022,
        month: 1,
        category: 'business',
        title: `jan-${i}`,
      })),
      // Feb is not wavetop: 5 items exceeds ACTIVE_CEILING=4.
      ...Array.from({ length: 5 }, (_, i) => ({
        year: 2022,
        month: 2,
        category: 'business',
        title: `feb-${i}`,
      })),
    ];
    const result = scoreEra(era, milestones, items, '2022-12-01');
    const byKey = Object.fromEntries(result.months.map((m) => [m.key, m]));
    expect(byKey['2022-01'].overCeiling).toBe(false);
    expect(byKey['2022-02'].overCeiling).toBe(true);
    expect(ACTIVE_FLOOR).toBe(2);
    expect(ACTIVE_CEILING).toBe(4);
    expect(WAVETOP_CEILING).toBe(8);
  });

  it('routes items dated outside the era window to outOfWindow, not a phantom month', () => {
    const items = [
      { year: 2021, month: 12, category: 'business', title: 'runup' }, // before start
      { year: 2022, month: 1, category: 'business', title: 'in-window' },
    ];
    const result = scoreEra(era, milestones, items, '2022-12-01');
    expect(result.outOfWindow).toHaveLength(1);
    expect(result.outOfWindow[0].title).toBe('runup');
    expect(result.months.some((m) => m.key === '2021-12')).toBe(false);
  });

  it('audits the current era only through today, not the full placeholder window', () => {
    const rollingEra = { slug: 'fixture-era', start_date: '2022-01-01', end_date: '2030-12-31' };
    const items = [{ year: 2022, month: 1, category: 'business', title: 'A' }];
    const result = scoreEra(rollingEra, [], items, '2022-03-15');
    expect(result.months.map((m) => m.key)).toEqual(['2022-01', '2022-02', '2022-03']);
  });
});
