import { describe, expect, it } from 'vitest';
import { createReturnPointStack } from './return-points';

describe('createReturnPointStack', () => {
  it('pushes and pops LIFO', () => {
    const rp = createReturnPointStack();
    rp.pushReturnPoint({ mode: 'era', eraId: 'a', itemId: null, scrollY: 10 });
    rp.pushReturnPoint({ mode: 'threads', eraId: 'b', itemId: null, scrollY: 20 });

    expect(rp.popReturnPoint()).toEqual({ mode: 'threads', eraId: 'b', itemId: null, scrollY: 20 });
    expect(rp.popReturnPoint()).toEqual({ mode: 'era', eraId: 'a', itemId: null, scrollY: 10 });
    expect(rp.popReturnPoint()).toBeNull();
  });

  it('consumeMatching pops only when mode+eraId match the restored snapshot', () => {
    const rp = createReturnPointStack();
    rp.pushReturnPoint({ mode: 'era', eraId: 'reputation', itemId: null, scrollY: 3256 });

    // Unrelated back navigation above the doorway's entry — must not consume it.
    expect(
      rp.consumeMatching({ mode: 'threads', eraId: 'reputation', lensId: null, crossing: null }),
    ).toBeNull();

    // The matching restore consumes it exactly once.
    expect(
      rp.consumeMatching({ mode: 'era', eraId: 'reputation', lensId: null, crossing: null }),
    ).toEqual({ mode: 'era', eraId: 'reputation', itemId: null, scrollY: 3256 });

    expect(
      rp.consumeMatching({ mode: 'era', eraId: 'reputation', lensId: null, crossing: null }),
    ).toBeNull();
  });

  it('a doorway opened from inside a doorway unwinds in order (nested LIFO)', () => {
    const rp = createReturnPointStack();
    rp.pushReturnPoint({ mode: 'era', eraId: 'reputation', itemId: null, scrollY: 1 });
    rp.pushReturnPoint({ mode: 'threads', eraId: 'reputation', itemId: null, scrollY: 2 });

    const inner = rp.consumeMatching({
      mode: 'threads',
      eraId: 'reputation' as never,
      lensId: null,
      crossing: null,
    });
    expect(inner).toEqual({ mode: 'threads', eraId: 'reputation', itemId: null, scrollY: 2 });

    const outer = rp.consumeMatching({
      mode: 'era',
      eraId: 'reputation' as never,
      lensId: null,
      crossing: null,
    });
    expect(outer).toEqual({ mode: 'era', eraId: 'reputation', itemId: null, scrollY: 1 });
  });
});
