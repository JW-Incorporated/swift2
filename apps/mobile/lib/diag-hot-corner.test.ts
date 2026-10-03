import { describe, expect, it, vi } from 'vitest';
import { createTapUnlock } from './diagnostics';
import { createHotCornerPress, HOT_CORNER_SIZE, shouldMountHotCorner } from './diag-hot-corner';

describe('shouldMountHotCorner', () => {
  it('mounts only while the DOM host is mounted', () => {
    expect(shouldMountHotCorner('dom')).toBe(true);
    expect(shouldMountHotCorner('native')).toBe(false);
    expect(shouldMountHotCorner('pending')).toBe(false);
  });
  it('is a 44pt box', () => {
    expect(HOT_CORNER_SIZE).toBe(44);
  });
});

describe('createHotCornerPress', () => {
  it('opens only on the 7th rapid tap', () => {
    let t = 0;
    const onUnlock = vi.fn();
    const press = createHotCornerPress(onUnlock, createTapUnlock({ now: () => (t += 100) }));
    for (let i = 0; i < 6; i++) press();
    expect(onUnlock).not.toHaveBeenCalled();
    press();
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
  it('does not open when taps are too slow', () => {
    let t = 0;
    const onUnlock = vi.fn();
    const press = createHotCornerPress(onUnlock, createTapUnlock({ now: () => (t += 3000) }));
    for (let i = 0; i < 10; i++) press();
    expect(onUnlock).not.toHaveBeenCalled();
  });
});
