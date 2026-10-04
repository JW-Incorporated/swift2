import { describe, expect, it, vi } from 'vitest';
import { createTapUnlock } from './diagnostics';
import {
  createHotCornerPress,
  domContentRect,
  HOT_CORNER_WIDTH,
  hotCornerRects,
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

describe('hotCornerRects', () => {
  const win = { width: 390, height: 844 };
  const ins = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 0 });
  it('mounts both strips when both insets are usable', () => {
    const rects = hotCornerRects(ins(59, 34), win);
    expect(rects).toEqual([
      { left: 0, top: 0, width: 88, height: 59 },
      { left: 0, top: 810, width: 88, height: 34 },
    ]);
  });
  it('mounts only the top strip when bottom is too small', () => {
    expect(hotCornerRects(ins(24, 10), win)).toEqual([
      { left: 0, top: 0, width: 88, height: 24 },
    ]);
  });
  it('mounts only the bottom strip when top is too small', () => {
    const rects = hotCornerRects(ins(10, 34), win);
    expect(rects).toEqual([
      { left: 0, top: win.height - 34, width: 88, height: 34 },
    ]);
  });
  it('mounts nothing when both insets are too small', () => {
    expect(hotCornerRects(ins(10, 10), win)).toEqual([]);
    expect(hotCornerRects(ins(0, 0), win)).toEqual([]);
  });
  it('never intersects DOM content', () => {
    for (const [t, b] of [
      [59, 34],
      [24, 0],
      [48, 48],
      [0, 34],
    ]) {
      const insets = ins(t, b);
      for (const rect of hotCornerRects(insets, win)) {
        expect(rect.width).toBe(HOT_CORNER_WIDTH);
        expect(intersects(rect, domContentRect(insets, win))).toBe(false);
      }
    }
  });
  it('never intersects content with landscape side insets', () => {
    const insets = { top: 24, bottom: 21, left: 47, right: 47 };
    const land = { width: 844, height: 390 };
    const rects = hotCornerRects(insets, land);
    expect(rects).toHaveLength(2);
    for (const rect of rects) expect(intersects(rect, domContentRect(insets, land))).toBe(false);
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
  it('shares one counter across handlers wired to the same unlock', () => {
    let t = 0;
    const onUnlock = vi.fn();
    const unlock = createTapUnlock({ now: () => (t += 100) });
    const top = createHotCornerPress(onUnlock, unlock);
    const bottom = createHotCornerPress(onUnlock, unlock);
    for (let i = 0; i < 4; i++) top();
    for (let i = 0; i < 3; i++) bottom();
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
