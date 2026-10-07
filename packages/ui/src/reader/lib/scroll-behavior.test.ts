import { afterEach, describe, expect, it, vi } from 'vitest';
import { smoothScrollBehavior } from './scroll-behavior';

afterEach(() => vi.unstubAllGlobals());

const stub = (reduce: boolean) =>
  vi.stubGlobal('window', { matchMedia: (q: string) => ({ matches: reduce && q === '(prefers-reduced-motion: reduce)' }) });

describe('smoothScrollBehavior', () => {
  it('is smooth by default', () => {
    stub(false);
    expect(smoothScrollBehavior()).toBe('smooth');
  });
  it('is auto under prefers-reduced-motion: reduce', () => {
    stub(true);
    expect(smoothScrollBehavior()).toBe('auto');
  });
  it('is smooth with no window', () => {
    expect(smoothScrollBehavior()).toBe('smooth');
  });
});
