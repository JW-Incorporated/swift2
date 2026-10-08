import { describe, expect, it } from 'vitest';
import type { Era, EraTheme, Milestone, MonthItem } from './vault-types';
import {
  eraIndexAtPosition,
  eraIndexForDate,
  eraTimelineMonths,
  monthsInEra,
  orderedEras,
  positionForEraIndex,
  snapPositionToEra,
} from './vault-nav';

const theme: EraTheme = {
  bg: '#000',
  surface: '#111',
  ink: '#fff',
  inkSoft: '#aaa',
  line: '#222',
  accent: '#f0f',
  heroGradient: 'linear-gradient(#000,#111)',
  eyebrow: 'x',
};

function era(slug: string, order: number, startDate: string, endDate: string): Era {
  return { slug, title: slug, album: slug, startDate, endDate, order, theme, coverImageUrl: null };
}

const eras: Era[] = [
  era('lover', 2, '2019-08-23', '2020-07-23'),
  era('debut', 0, '2006-10-24', '2008-11-10'),
  era('folklore', 3, '2020-07-24', '2022-10-20'),
  era('fearless', 1, '2008-11-11', '2010-10-24'),
];

describe('orderedEras', () => {
  it('sorts by ascending order and does not mutate input', () => {
    const sorted = orderedEras(eras);
    expect(sorted.map((e) => e.slug)).toEqual(['debut', 'fearless', 'lover', 'folklore']);
    expect(eras[0]!.slug).toBe('lover'); // original untouched
  });
});

describe('position <-> era index', () => {
  it('maps normalized positions to era slots', () => {
    expect(eraIndexAtPosition(4, 0)).toBe(0);
    expect(eraIndexAtPosition(4, 0.24)).toBe(0);
    expect(eraIndexAtPosition(4, 0.26)).toBe(1);
    expect(eraIndexAtPosition(4, 1)).toBe(3);
    expect(eraIndexAtPosition(0, 0.5)).toBe(-1);
  });

  it('gives an era its center position', () => {
    expect(positionForEraIndex(4, 0)).toBeCloseTo(0.125);
    expect(positionForEraIndex(4, 3)).toBeCloseTo(0.875);
    expect(positionForEraIndex(4, 99)).toBeCloseTo(0.875); // clamped
  });

  it('snaps a free position to the nearest era center', () => {
    expect(snapPositionToEra(4, 0.3)).toBeCloseTo(0.375); // slot 1 center
    expect(snapPositionToEra(4, 0.0)).toBeCloseTo(0.125);
  });
});

describe('eraIndexForDate', () => {
  it('finds the containing era (in ordered space)', () => {
    expect(eraIndexForDate(eras, '2009-06-01')).toBe(1); // fearless
    expect(eraIndexForDate(eras, '2020-01-01')).toBe(2); // lover
  });

  it('falls back to the nearest era for out-of-range dates', () => {
    expect(eraIndexForDate(eras, '2005-01-01')).toBe(0); // before everything -> debut
    expect(eraIndexForDate(eras, '2030-01-01')).toBe(3); // after everything -> folklore
  });

  it('returns -1 for empty eras or bad dates', () => {
    expect(eraIndexForDate([], '2020-01-01')).toBe(-1);
    expect(eraIndexForDate(eras, 'not-a-date')).toBe(-1);
  });
});

describe('monthsInEra', () => {
  it('enumerates inclusive year/month range', () => {
    const months = monthsInEra(era('x', 0, '2019-11-01', '2020-02-15'));
    expect(months).toEqual([
      { year: 2019, month: 11 },
      { year: 2019, month: 12 },
      { year: 2020, month: 1 },
      { year: 2020, month: 2 },
    ]);
  });
});

describe('eraTimelineMonths', () => {
  const lover = era('lover', 2, '2019-08-23', '2020-07-23');
  function item(eraSlug: string, year: number, month: number): MonthItem {
    return { id: `${eraSlug}-${year}-${month}`, eraSlug, year, month, category: 'music', title: 't', snippet: '', sourceUrl: null, thumbnailUrl: null };
  }
  function milestone(eraSlug: string, date: string): Milestone {
    return { id: date, eraSlug, type: 'album_release', title: 'm', date };
  }

  it('unions the nominal span with an item dated before the album window', () => {
    const months = eraTimelineMonths(lover, [item('lover', 2019, 6)], []);
    // pre-window outlier first, then the 12-month nominal span (Aug 2019–Jul 2020)
    expect(months[0]).toEqual({ year: 2019, month: 6 });
    expect(months).toContainEqual({ year: 2019, month: 8 });
    expect(months).toContainEqual({ year: 2020, month: 7 });
    expect(months).not.toContainEqual({ year: 2019, month: 7 }); // no content, not in span
    expect(months).toHaveLength(13);
  });

  it('ignores items/milestones from other eras and de-dupes', () => {
    const months = eraTimelineMonths(
      lover,
      [item('lover', 2019, 8), item('debut', 2006, 10)],
      [milestone('lover', '2020-07-10'), milestone('reputation', '2018-01-01')],
    );
    expect(months).not.toContainEqual({ year: 2006, month: 10 });
    expect(months).not.toContainEqual({ year: 2018, month: 1 });
    expect(months).toHaveLength(12); // all within span, deduped
  });
});
