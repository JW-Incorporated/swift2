import { describe, expect, it } from 'vitest';
import { takeMatchingReturnPoint } from './return-point-stack';

describe('takeMatchingReturnPoint', () => {
  it('preserves a doorway return point across an unrelated back navigation', () => {
    const doorway = { mode: 'era', eraId: 'reputation', itemId: null, scrollY: 3256 };
    let stack = [doorway];

    const unrelatedBack = takeMatchingReturnPoint(stack, {
      mode: 'threads',
      eraId: 'reputation',
    });
    stack = [...unrelatedBack.stack];

    expect(unrelatedBack.returnPoint).toBeNull();
    expect(stack).toEqual([doorway]);

    const doorwayBack = takeMatchingReturnPoint(stack, {
      mode: 'era',
      eraId: 'reputation',
    });

    expect(doorwayBack.returnPoint).toBe(doorway);
    expect(doorwayBack.stack).toEqual([]);
  });
});
