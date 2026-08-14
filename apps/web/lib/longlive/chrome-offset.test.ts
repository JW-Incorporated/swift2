import { describe, expect, it } from 'vitest';
import { measureChromeHeight, resolveChromeHeight } from './chrome-offset';

describe('resolveChromeHeight (pure)', () => {
  it('sums TopBar and FilterBar heights', () => {
    expect(resolveChromeHeight({ topBarHeight: 65, filterBarHeight: 44 })).toBe(109);
  });

  it('is just TopBar height when FilterBar is not mounted (Threads mode)', () => {
    expect(resolveChromeHeight({ topBarHeight: 65, filterBarHeight: 0 })).toBe(65);
  });

  it('is 0 when neither is mounted', () => {
    expect(resolveChromeHeight({ topBarHeight: 0, filterBarHeight: 0 })).toBe(0);
  });
});

describe('measureChromeHeight (DOM)', () => {
  // This suite runs environment: 'node' (vitest.config.ts) — no `document` —
  // so the only branch exercisable here is the SSR/no-DOM guard. The landing
  // math this feeds is covered by era-jump-landing.test.ts; the DOM query
  // itself is covered by the component's own runtime behavior.
  it('returns 0 when there is no document (SSR)', () => {
    expect(measureChromeHeight()).toBe(0);
  });
});
