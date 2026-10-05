import { describe, expect, it } from 'vitest';
import { buildReaderSnap } from './useReportSnapshot';

const base = { mode: 'era' as const, eraId: 'lover' as never, lensId: null, openItemId: null };

describe('buildReaderSnap', () => {
  it('captures mode/era, the open item and the era-stream position; drops nothing else in', () => {
    expect(buildReaderSnap({ ...base, openItemId: 'm1' }, { anchorId: 'lover' as never, count: 3, scrollY: 800 }, 812.7)).toEqual({
      v: 1, mode: 'era', eraId: 'lover', itemId: 'm1', anchorId: 'lover', count: 3, scrollY: 812,
    });
  });

  it('omits unset optionals, clamps scrollY/count and drops over-long ids', () => {
    expect(buildReaderSnap(base, null, -5)).toEqual({ v: 1, mode: 'era', eraId: 'lover', scrollY: 0 });
    expect(buildReaderSnap(base, { anchorId: 'lover' as never, count: 9999, scrollY: 0 }, 9e9)).toMatchObject({ count: 200, scrollY: 1_000_000 });
    expect(buildReaderSnap({ ...base, lensId: 'x'.repeat(65) as never, openItemId: 'y'.repeat(65) }, null, 0)).toEqual({ v: 1, mode: 'era', eraId: 'lover', scrollY: 0 });
  });
});
