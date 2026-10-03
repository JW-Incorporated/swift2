import { describe, expect, it, vi } from 'vitest';
import { createTapUnlock } from './diagnostics';
import {
  createHotCornerPress,
  domContentRect,
  HOT_CORNER_WIDTH,
  hotCornerRect,
  type HotCornerRect,
  shouldMountHotCorner,
} from './diag-hot-corner';

function intersects(a: HotCornerRect, b: HotCornerRect): boolean {
  return (
    a.left < b.left + b.width &&
    b.left < a.left + a.width &&
    a.top < b.top + b.height &&
    b.top < a.top + a.height
  );
}

describe('shouldMountHotCorner', () => {
  it('mounts only while the DOM host is mounted', () => {
    expect(shouldMountHotCorner('dom')).toBe(true);
    expect(shouldMountHotCorner('native')).toBe(false);
    expect(shouldMountHotCorner('pending')).toBe(false);
  });
});

describe('hotCornerRect', () => {
  const win = { width: 390, height: 844 };
  const cases: Array<[string, { top: number; bottom: number }, boolean]> = [
    ['iPhone notch 59/34', { top: 59, bottom: 34 }, true],
    ['Android edge-to-edge 24/0', { top: 24, bottom: 0 }, true],
    ['Android edge-to-edge 48/48', { top: 48, bottom: 48 }, true],
    ['bottom-only strip 0/34', { top: 0, bottom: 34 }, true],
    ['small insets 10/10', { top: 10, bottom: 10 }, false],
    ['zero insets', { top: 0, bottom: 0 }, false],
  ];
  for (const [name, i, expectRect] of cases) {
    it(`${name}: never intersects DOM content`, () => {
      const insets = { ...i, left: 0, right: 0 };
      const rect = hotCornerRect(insets, win);
      if (!expectRect) {
        expect(rect).toBeNull();
        return;
      }
      expect(rect).not.toBeNull();
      expect(rect!.width).toBe(HOT_CORNER_WIDTH);
      expect(rect!.left).toBe(0);
      expect(intersects(rect!, domContentRect(insets, win))).toBe(false);
    });
  }
  it('uses the top strip when both are usable', () => {
    expect(hotCornerRect({ top: 59, bottom: 34, left: 0, right: 0 }, win)).toEqual({
      left: 0,
      top: 0,
      width: 88,
      height: 59,
    });
  });
  it('falls back to the bottom strip when top is too small', () => {
    expect(hotCornerRect({ top: 0, bottom: 34, left: 0, right: 0 }, win)).toEqual({
      left: 0,
      top: 810,
      width: 88,
      height: 34,
    });
  });
  it('never intersects content with landscape side insets', () => {
    const insets = { top: 24, bottom: 21, left: 47, right: 47 };
    const land = { width: 844, height: 390 };
    expect(intersects(hotCornerRect(insets, land)!, domContentRect(insets, land))).toBe(false);
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
