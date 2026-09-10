import { describe, expect, it } from 'vitest';
import { resolveAnchor, type AnchorSource } from './anchor-date';

const ERA = { eraStart: '2019-01-01', eraEnd: '2019-12-31' };

describe('resolveAnchor', () => {
  it('uses the exact date, and only exact dates may render (via: exact)', () => {
    const anchor = resolveAnchor({ exactDate: '2019-08-23', ...ERA, id: 'm1' });
    expect(anchor).toEqual({ sortDate: '2019-08-23', displayDate: '2019-08-23', via: 'exact' });
  });

  it('falls back to a related item date when there is no exact date', () => {
    const anchor = resolveAnchor({ relatedItemDate: '2019-06-01', ...ERA, id: 'v1' });
    expect(anchor).toEqual({ sortDate: '2019-06-01', displayDate: null, via: 'related-item' });
  });

  it('falls back to a related song date when there is no exact or related-item date', () => {
    const anchor = resolveAnchor({ relatedSongDate: '2019-04-01', ...ERA, id: 'v2' });
    expect(anchor).toEqual({ sortDate: '2019-04-01', displayDate: null, via: 'related-song' });
  });

  it('falls back to a scattered position as the last resort', () => {
    const anchor = resolveAnchor({ ...ERA, id: 'v3' });
    expect(anchor).toEqual({ sortDate: '2019-08-23', displayDate: null, via: 'era-scatter' });
  });

  it('era-scatter collapses to eraStart when eraEnd is null', () => {
    const anchor = resolveAnchor({ eraStart: '2019-05-01', eraEnd: null, id: 'v4' });
    expect(anchor).toEqual({ sortDate: '2019-05-01', displayDate: null, via: 'era-scatter' });
  });

  it('prefers exact over every fallback when more than one signal is present', () => {
    const anchor = resolveAnchor({
      exactDate: '2019-08-23',
      relatedItemDate: '2019-06-01',
      relatedSongDate: '2019-04-01',
      ...ERA,
      id: 'm2',
    });
    expect(anchor.via).toBe('exact');
  });

  it('prefers related-item over related-song when both are present', () => {
    const anchor = resolveAnchor({
      relatedItemDate: '2019-06-01',
      relatedSongDate: '2019-04-01',
      ...ERA,
      id: 'v5',
    });
    expect(anchor.via).toBe('related-item');
  });

  it('is a pure function — same input, same output', () => {
    const input = { exactDate: null, relatedSongDate: '2019-04-01', ...ERA, id: 'v6' };
    expect(resolveAnchor(input)).toEqual(resolveAnchor(input));
  });

  describe('the honesty rule', () => {
    // NON-NEGOTIABLE: displayDate is null unless via === 'exact'. A synthetic
    // anchor positions a card and is NEVER printed as a date.
    const nonExactCases: Array<{ via: AnchorSource; input: Parameters<typeof resolveAnchor>[0] }> = [
      { via: 'related-item', input: { relatedItemDate: '2019-06-01', ...ERA, id: 'a' } },
      { via: 'related-song', input: { relatedSongDate: '2019-04-01', ...ERA, id: 'b' } },
      { via: 'era-scatter', input: { ...ERA, id: 'c' } },
    ];

    it.each(nonExactCases)('displayDate is null for via: $via', ({ via, input }) => {
      const anchor = resolveAnchor(input);
      expect(anchor.via).toBe(via);
      expect(anchor.displayDate).toBeNull();
    });
  });

  describe('era-scatter', () => {
    // Replaces the old 'era-midpoint' fallback (§ Plan amendments 2026-08-13
    // (2)): every undated item used to resolve to the SAME date and pile up
    // mid-era. era-scatter must instead be (a) stable per id, (b) different
    // across ids, (c) always inside the era's span, and (d) never displayed.

    it('(a) is stable: the same id always yields the same date — no Math.random, no Date.now', () => {
      const once = resolveAnchor({ ...ERA, id: 'stable-id' });
      const again = resolveAnchor({ ...ERA, id: 'stable-id' });
      expect(again).toEqual(once);
      expect(once.via).toBe('era-scatter');
    });

    it('(b) is different across ids — asserted over a realistic batch, not two items', () => {
      // 26 is the real count of undated video records the plan flags.
      const ids = Array.from({ length: 26 }, (_, i) => `video-${i}`);
      const dates = ids.map((id) => resolveAnchor({ ...ERA, id }).sortDate);
      expect(new Set(dates).size).toBe(ids.length); // no two ids clump together
    });

    it('(c) always falls inside [eraStart, eraEnd]', () => {
      const ids = Array.from({ length: 26 }, (_, i) => `video-${i}`);
      const startMs = Date.parse(`${ERA.eraStart}T00:00:00Z`);
      const endMs = Date.parse(`${ERA.eraEnd}T00:00:00Z`);
      for (const id of ids) {
        const { sortDate } = resolveAnchor({ ...ERA, id });
        const ms = Date.parse(`${sortDate}T00:00:00Z`);
        expect(ms).toBeGreaterThanOrEqual(startMs);
        expect(ms).toBeLessThanOrEqual(endMs);
      }
    });

    it('(d) displayDate stays null, as for every non-exact source', () => {
      const anchor = resolveAnchor({ ...ERA, id: 'video-honesty' });
      expect(anchor.via).toBe('era-scatter');
      expect(anchor.displayDate).toBeNull();
    });
  });
});
