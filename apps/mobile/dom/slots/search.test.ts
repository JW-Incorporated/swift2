import { SearchOverlay } from '@swift2/ui/reader/search/SearchOverlay';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('search slice', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('registers overlay:search as the packages/ui SearchOverlay (G10, no shim)', async () => {
    const { resetSlotsForTests, slots } = await import('./instance');
    resetSlotsForTests();
    await import('./search');
    const all = slots();
    expect(Object.keys(all)).toEqual(['overlay:search']);
    const { SearchOverlay: again } = await import('@swift2/ui/reader/search/SearchOverlay');
    expect(all['overlay:search']).toBe(again);
    expect(typeof SearchOverlay).toBe('function');
  });

  it('does not collide with another slice and re-import is a no-op', async () => {
    const { register, resetSlotsForTests, slots } = await import('./instance');
    resetSlotsForTests();
    register({ slice: 'other', slots: { 'overlay:moment': () => null } });
    await import('./search');
    expect(Object.keys(slots()).sort()).toEqual(['overlay:moment', 'overlay:search']);
  });
});
