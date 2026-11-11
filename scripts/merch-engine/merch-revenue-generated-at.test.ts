import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { preserveGeneratedAt } from './merch-revenue-generated-at.mjs';

describe('merch revenue timestamps', () => {
  it('keeps generatedAt when the report data is unchanged', () => {
    const previous = {
      generatedAt: '2026-10-01T00:00:00.000Z',
      sources: [{ network: 'awin', status: 'unavailable' }],
      totals: { clicks: 0, revenue: 0 },
    };
    const current = {
      ...previous,
      generatedAt: '2026-10-14T00:00:00.000Z',
    };

    expect(preserveGeneratedAt(previous, current)).toEqual(previous);
  });

  it('uses the new generatedAt when report data changes', () => {
    const previous = { generatedAt: 'old', totals: { clicks: 0, revenue: 0 } };
    const current = { generatedAt: 'new', totals: { clicks: 1, revenue: 0 } };

    expect(preserveGeneratedAt(previous, current)).toEqual(current);
  });
});
