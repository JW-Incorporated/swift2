import { describe, expect, it } from 'vitest';
import type { Era, EraTheme, Milestone, MonthItem } from '@swift2/shared';
import {
  buildModel,
  clamp,
  eraIndexAtMonthFloat,
  nearestEraStart,
} from './scrubberModel';

const theme: EraTheme = {
  bg: '#000',
  surface: '#111',
  ink: '#fff',
  inkSoft: '#aaa',
  line: '#333',
  accent: '#abc',
  heroGradient: 'linear-gradient(#000,#111)',
  eyebrow: 'x',
};

function era(slug: string, order: number, start: string, end: string): Era {
  return { slug, title: `${slug} era`, album: slug, startDate: start, endDate: end, order, theme, coverImageUrl: null };
}
function item(slug: string, year: number, month: number): MonthItem {
  return {
    id: `${slug}-${year}-${month}`,
    eraSlug: slug,
    year,
    month,
    category: 'music',
    title: 't',
    snippet: 's',
    sourceUrl: null,
    thumbnailUrl: null,
  };
}

describe('clamp', () => {
  it('bounds a value to [lo, hi]', () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});

describe('buildModel', () => {
  const eras = [
    era('a', 0, '2020-01-01', '2020-03-01'),
    era('b', 1, '2021-01-01', '2021-02-01'),
  ];
  // Only content-bearing months are rendered (mirrors the reader's filter).
  const items = [item('a', 2020, 1), item('a', 2020, 3), item('b', 2021, 2)];
  const milestones: Milestone[] = [
    { id: 'm1', eraSlug: 'a', type: 'album_release', title: 'A', date: '2020-01-15' },
    { id: 'm2', eraSlug: 'b', type: 'tour', title: 'Tour', date: '2021-02-10' },
  ];

  it('flattens only content months, in order, tagging era-firsts', () => {
    const { months } = buildModel(eras, items, milestones);
    expect(months.map((m) => m.label)).toEqual(['Jan 2020', 'Mar 2020', 'Feb 2021']);
    expect(months.filter((m) => m.isEraFirst).map((m) => m.eraSlug)).toEqual(['a', 'b']);
  });

  it('marks milestone glyphs by type', () => {
    const { months } = buildModel(eras, items, milestones);
    expect(months.find((m) => m.label === 'Jan 2020')?.milestoneGlyph).toBe('💿');
    expect(months.find((m) => m.label === 'Feb 2021')?.milestoneGlyph).toBe('🎤');
    expect(months.find((m) => m.label === 'Mar 2020')?.milestoneGlyph).toBeNull();
  });

  it('builds contiguous per-era startFloat offsets and total length', () => {
    const { eraMetas, totalMonths } = buildModel(eras, items, milestones);
    expect(eraMetas.map((m) => m.monthCount)).toEqual([2, 1]);
    expect(eraMetas.map((m) => m.startFloat)).toEqual([0, 2]);
    expect(totalMonths).toBe(3);
  });

  it('guarantees a >=1 month count so an empty era still maps', () => {
    const { eraMetas, totalMonths } = buildModel([era('z', 0, '2019-01-01', '2019-02-01')], [], []);
    expect(eraMetas[0]!.monthCount).toBe(1);
    expect(totalMonths).toBe(1);
  });
});

describe('era resolution from a continuous month float', () => {
  const { eraMetas } = buildModel(
    [era('a', 0, '2020-01-01', '2020-03-01'), era('b', 1, '2021-01-01', '2021-02-01')],
    [item('a', 2020, 1), item('a', 2020, 3), item('b', 2021, 2)],
    [],
  );

  it('eraIndexAtMonthFloat picks the era containing the float', () => {
    expect(eraIndexAtMonthFloat(eraMetas, 0)).toBe(0);
    expect(eraIndexAtMonthFloat(eraMetas, 1.9)).toBe(0);
    expect(eraIndexAtMonthFloat(eraMetas, 2)).toBe(1);
    expect(eraIndexAtMonthFloat(eraMetas, 99)).toBe(1);
  });

  it('nearestEraStart snaps to the closest era first-month (era-only snap)', () => {
    expect(nearestEraStart(eraMetas, 0.4)).toBe(0);
    expect(nearestEraStart(eraMetas, 1.4)).toBe(1); // closer to startFloat 2 than 0
    expect(nearestEraStart(eraMetas, 2.9)).toBe(1);
  });
});
