import { describe, expect, it } from 'vitest';
import { ASPECTS, isAspect } from './index';

describe('aspects', () => {
  it('recognizes known aspects', () => {
    for (const a of ASPECTS) {
      expect(isAspect(a)).toBe(true);
    }
  });

  it('rejects unknown aspects', () => {
    expect(isAspect('gossip')).toBe(false);
    expect(isAspect('')).toBe(false);
  });
});
