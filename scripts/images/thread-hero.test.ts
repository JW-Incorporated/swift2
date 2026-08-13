import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs script without types; only its pure helpers are tested.
import { coverWindow, parsePosition } from './thread-hero.mjs';

// The preview command is only worth trusting if it crops the way the browser
// does. These pin the two rules of `object-fit: cover` + `object-position`:
// the box is filled by the larger scale factor, and the leftover is split by
// the position percentage.
describe('coverWindow', () => {
  it('crops a tall photo to the card by height, keeping full width', () => {
    const win = coverWindow(1200, 1830, 700, 524, 50, 50);
    expect(win.width).toBe(1200);
    expect(win.height).toBe(Math.round((524 / 700) * 1200));
    expect(win.left).toBe(0);
  });

  it('crops a wide photo by width, keeping full height', () => {
    const win = coverWindow(1200, 600, 700, 524, 50, 50);
    expect(win.height).toBe(600);
    expect(win.width).toBe(Math.round((700 / 524) * 600));
    expect(win.top).toBe(0);
  });

  // The Clue Web hero is 1200x903 against a 700x524 card — nearly the same
  // aspect, so it loses a sliver of height rather than nothing at all. Worth
  // pinning: "close enough to the card ratio" is where an off-by-one in the
  // cover maths would hide.
  it('trims the short axis even when the photo nearly matches the card', () => {
    const win = coverWindow(1200, 903, 700, 524, 50, 50);
    expect(win.width).toBe(1200);
    expect(win.height).toBe(898);
    expect(win.top).toBe(3); // 5px of slack, centred and rounded up
  });

  it('slides the window with the position, 0% flush to the top and 100% to the bottom', () => {
    const box = [700, 524] as const;
    const top = coverWindow(1200, 1830, ...box, 50, 0);
    const bottom = coverWindow(1200, 1830, ...box, 50, 100);
    expect(top.top).toBe(0);
    expect(bottom.top).toBe(1830 - bottom.height);
    // The measured heroPosition values land strictly between the extremes.
    const measured = coverWindow(1200, 1830, ...box, 50, 26);
    expect(measured.top).toBeGreaterThan(top.top);
    expect(measured.top).toBeLessThan(bottom.top);
  });

  // CSS clamps an out-of-range object-position to the edge. Without the same
  // clamp here the extract window walks off the image and sharp dies with
  // "bad extract area" instead of rendering the edge crop.
  it('clamps an out-of-range position to the edge instead of walking off the image', () => {
    const over = coverWindow(1200, 1830, 700, 524, 50, 120);
    const edge = coverWindow(1200, 1830, 700, 524, 50, 100);
    expect(over).toEqual(edge);
    expect(over.top + over.height).toBeLessThanOrEqual(1830);
    expect(coverWindow(1200, 1830, 700, 524, -40, -10).top).toBe(0);
  });

  it('never asks for a window bigger than the source', () => {
    for (const [w, h] of [
      [1200, 1830],
      [1200, 903],
      [1200, 1600],
      [400, 400],
    ]) {
      const win = coverWindow(w, h, 700, 524, 50, 82);
      expect(win.width).toBeLessThanOrEqual(w);
      expect(win.height).toBeLessThanOrEqual(h);
      expect(win.left + win.width).toBeLessThanOrEqual(w);
      expect(win.top + win.height).toBeLessThanOrEqual(h);
    }
  });
});

describe('parsePosition', () => {
  it('reads the CSS values stored in heroPosition', () => {
    expect(parsePosition('50% 82%')).toEqual([50, 82]);
    expect(parsePosition('50%')).toEqual([50, 50]);
    expect(parsePosition(undefined)).toEqual([50, 50]);
  });

  it('refuses a value it cannot measure with, rather than centring silently', () => {
    expect(() => parsePosition('centre top')).toThrow();
  });
});
