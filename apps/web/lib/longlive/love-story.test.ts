import { describe, expect, it } from 'vitest';
import { allocateHitRanges, durationLabel, mergedTimeline, monthsBetween, previousRelationship, soloLeadIn } from './love-story';
import { RELATIONSHIPS, SINGLE_PERIODS } from './lenses';
import { songTargetOf } from './tracks';
import type { Relationship, SinglePeriod } from './types';

const rels: Relationship[] = [
  { id: 'r1', name: 'Alex', start: '2010-01-01', end: '2010-06-01', eraIds: ['debut'], songs: [], note: '' },
  { id: 'r2', name: 'Sam', start: '2011-01-01', end: null, eraIds: ['debut'], songs: [], note: '' },
];
const singles: SinglePeriod[] = [{ id: 's1', start: '2010-06-01', end: '2011-01-01', eraIds: ['debut'], note: '' }];

describe('mergedTimeline', () => {
  it('interleaves relationships and singles in chronological order', () => {
    const timeline = mergedTimeline(rels, singles);
    expect(timeline.map((e) => e.id)).toEqual(['r1', 's1', 'r2']);
  });
});

describe('monthsBetween / durationLabel', () => {
  it('computes whole months for a closed range', () => {
    expect(monthsBetween('2010-01-01', '2010-06-01')).toBe(5);
    expect(durationLabel('2010-01-01', '2010-06-01')).toBe('5mo');
  });

  it('formats a multi-year span as years + remainder months', () => {
    expect(durationLabel('2016-11-12', '2023-04-08')).toBe('6y 5mo');
  });
});

describe('previousRelationship', () => {
  it('finds the relationship that most recently ended before an entry started', () => {
    const timeline = mergedTimeline(rels, singles);
    const prev = previousRelationship(timeline[1], timeline);
    expect(prev?.id).toBe('r1');
  });

  it('returns null when nothing preceded the entry', () => {
    const timeline = mergedTimeline(rels, singles);
    expect(previousRelationship(timeline[0], timeline)).toBeNull();
  });
});

describe('allocateHitRanges', () => {
  // A run of contiguous sliver segments (5–12px painted at 1280px wide,
  // ~0.5–1% each) next to two roomy neighbours.
  const slivers = [0, 16, 16.5, 17.4, 18.2, 19.2, 40, 100];
  const sliverRun = slivers.slice(0, -1).map((s, i) => ({ start: s, end: slivers[i + 1] }));
  const MIN = 2;
  const centre = (s: { start: number; end: number }) => (s.start + s.end) / 2;

  it('tiles the domain in order without gaps or overlaps', () => {
    const ranges = allocateHitRanges(sliverRun, MIN);
    expect(ranges[0].start).toBe(0);
    expect(ranges[ranges.length - 1].end).toBe(100);
    ranges.forEach((r, i) => {
      expect(r.end).toBeGreaterThanOrEqual(r.start);
      if (i > 0) expect(r.start).toBeCloseTo(ranges[i - 1].end, 9);
    });
  });

  it('widens slivers to the minimum by taking space from roomier neighbours', () => {
    // Two roomy segments either side of one sliver: the sliver can reach MIN
    // without either boundary crossing a neighbouring centre.
    const ranges = allocateHitRanges(
      [{ start: 0, end: 40 }, { start: 40, end: 40.5 }, { start: 40.5, end: 100 }],
      MIN,
    );
    expect(ranges[1].end - ranges[1].start).toBeGreaterThanOrEqual(MIN - 1e-9);
  });

  // THE invariant, and the regression this function was rewritten for
  // (#1532's allocator failed it on 8 of 18 real segments at 862px): the
  // range for a segment must contain that segment's own painted centre, so
  // clicking the block you can see opens the chapter you clicked.
  it('always contains its own segment centre, even across a run of slivers', () => {
    for (const min of [0, 1, 2, 5, 20]) {
      const ranges = allocateHitRanges(sliverRun, min);
      ranges.forEach((r, i) => {
        const c = centre(sliverRun[i]);
        // Strictly inside — landing exactly on a boundary means
        // elementFromPoint hands the click to the neighbour.
        if (i > 0) expect(c).toBeGreaterThan(r.start);
        if (i < ranges.length - 1) expect(c).toBeLessThan(r.end);
      });
    }
  });

  it('holds the centre invariant on the real 18-entry timeline at every plausible band width', () => {
    const timeline = mergedTimeline(RELATIONSHIPS, SINGLE_PERIODS);
    const T0 = new Date('2006-01-01').getTime();
    const TOTAL = new Date('2026-12-31').getTime() - T0;
    const asPct = (iso: string | null) => ((new Date(iso ?? new Date().toISOString()).getTime() - T0) / TOTAL) * 100;
    const segments = timeline.map((e) => {
      const start = asPct(e.start);
      return { start, end: start + Math.max(asPct(e.end) - start, 0.6) };
    });
    expect(segments.length).toBeGreaterThanOrEqual(18);

    for (const bandWidth of [320, 361, 480, 640, 862, 1024, 1440]) {
      const ranges = allocateHitRanges(segments, (24 / bandWidth) * 100);
      ranges.forEach((r, i) => {
        const c = centre(segments[i]);
        // Strict on the inner edges, with at least half a CSS pixel of margin
        // so percentage-layout rounding can't tip a click into the neighbour.
        const halfPx = 100 / bandWidth / 2;
        const startOk = i === 0 ? c >= r.start : c > r.start + halfPx;
        const endOk = i === ranges.length - 1 ? c <= r.end : c < r.end - halfPx;
        expect(
          startOk && endOk,
          `band ${bandWidth}px: "${timeline[i].id}" centre ${c.toFixed(3)}% is not safely inside its hit range [${r.start.toFixed(3)}, ${r.end.toFixed(3)}]`,
        ).toBe(true);
      });
    }
  });

  it('puts the boundary between two roomy segments at the midpoint of their centres', () => {
    const [a, b] = allocateHitRanges([{ start: 0, end: 30 }, { start: 32, end: 100 }], MIN);
    expect(a.end).toBeCloseTo((15 + 66) / 2, 9);
    expect(b.start).toBeCloseTo(a.end, 9);
  });

  it('shares the shortfall when the domain cannot fit every minimum', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ start: i * 20, end: (i + 1) * 20 }));
    allocateHitRanges(five, 30, 0, 100).forEach((r) => expect(r.end - r.start).toBeCloseTo(20, 9));
  });

  it('returns an empty allocation for an empty timeline', () => {
    expect(allocateHitRanges([], MIN)).toEqual([]);
  });
});

describe('soloLeadIn', () => {
  it('names the prior relationship when one exists', () => {
    const timeline = mergedTimeline(rels, singles);
    expect(soloLeadIn(singles[0], timeline)).toBe('Just out of her relationship with Alex.');
  });

  it('falls back to an age-based lead-in for the very first solo period', () => {
    const first: SinglePeriod = { id: 's0', start: '2006-01-01', end: '2008-01-01', eraIds: ['debut'], note: '' };
    const timeline = mergedTimeline(rels, [first, ...singles]);
    expect(soloLeadIn(first, timeline)).toMatch(/^She was 16/);
  });
});

describe('solo-period editorial depth', () => {
  const deepIds = ['single-early', 'single-2008', 'single-2011', 'single-2013', 'single-2023'];

  it('gives every flagged solo chapter a 4-6 sentence sourced narrative', () => {
    for (const id of deepIds) {
      const period = SINGLE_PERIODS.find((entry) => entry.id === id);
      expect(period, `${id} is missing`).toBeDefined();

      const sentences = period!.context?.split(/(?<=[.!?])["']?\s+(?=[A-Z"])/) ?? [];
      expect(sentences.length, `${id} should read as a 4-6 sentence story`).toBeGreaterThanOrEqual(4);
      expect(sentences.length, `${id} should read as a 4-6 sentence story`).toBeLessThanOrEqual(6);

      const sources = period!.sources ?? [];
      expect(sources.length, `${id} needs at least two citations`).toBeGreaterThanOrEqual(2);
      expect(new Set(sources.map((source) => new URL(source.url).hostname.replace(/^www\./, ''))).size, `${id} needs independent outlets`).toBeGreaterThanOrEqual(2);
      for (const source of sources) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.reliability, `${id}: ${source.name} needs a reliability score`).toBeGreaterThanOrEqual(3);
        expect(source.type, `${id}: ${source.name} needs a source type`).toBeTruthy();
      }
    }
  });

  it('keeps the two short slivers as intentionally concise captions', () => {
    for (const id of ['single-2012', 'single-2016']) {
      const period = SINGLE_PERIODS.find((entry) => entry.id === id);
      expect(period?.context).toBeUndefined();
    }
  });
});

describe('relationship song links', () => {
  const songs = [...RELATIONSHIPS, ...SINGLE_PERIODS].flatMap((entry) => entry.songs ?? []);

  it('resolves every authored song id to a real track-guide entry', () => {
    for (const song of songs) {
      if (!song.relatedId) continue;
      expect(songTargetOf(song.relatedId), `${song.title} (${song.relatedId})`).not.toBeNull();
    }
  });

  it('leaves only songs absent from the track guide non-interactive', () => {
    expect(songs.filter((song) => !song.relatedId).map((song) => song.title)).toEqual([
      'This Is What You Came For',
    ]);
  });
});
