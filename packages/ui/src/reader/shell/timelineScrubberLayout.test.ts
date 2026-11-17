import { describe, expect, it } from 'vitest';
import { dropDisplacedAnchors } from './timelineScrubberLayout';

const a = (date: number, top: number) => ({ date, top, exact: true });

describe('dropDisplacedAnchors', () => {
  it('keeps a monotone (date-descending) list unchanged', () => {
    const list = [a(9, 0), a(7, 100), a(7, 200), a(3, 300)];
    expect(dropDisplacedAnchors(list)).toEqual(list);
  });

  it('drops an older card lifted above newer ones (interleaved video)', () => {
    const list = [a(10, 0), a(9, 100), a(5, 200), a(8, 300), a(7, 400), a(1, 500)];
    const kept = dropDisplacedAnchors(list);
    expect(kept.map((x) => x.date)).toEqual([10, 9, 8, 7, 1]);
    for (let i = 1; i < kept.length; i++) expect(kept[i]!.date).toBeLessThanOrEqual(kept[i - 1]!.date);
  });

  it('handles empty and single lists', () => {
    expect(dropDisplacedAnchors([])).toEqual([]);
    expect(dropDisplacedAnchors([a(1, 0)])).toEqual([a(1, 0)]);
  });
});
