// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
const rn = vi.hoisted(() => ({ os: 'android', win: { width: 400, height: 900 }, bottom: 0, handlers: new Map<string, (e?: unknown) => void>() }));
vi.mock('react-native', () => ({
  Keyboard: {
    addListener: (name: string, h: (e?: unknown) => void) => {
      rn.handlers.set(name, h);
      return { remove: () => rn.handlers.delete(name) };
    },
  },
  Platform: { get OS() { return rn.os; } },
  useWindowDimensions: () => rn.win,
}));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, left: 0, bottom: rn.bottom }) }));

import { computeKeyboardInset, useKeyboardInset } from './use-keyboard-inset';

afterEach(() => {
  cleanup();
  rn.os = 'android';
  rn.win = { width: 400, height: 900 };
  rn.bottom = 0;
  rn.handlers.clear();
});

const win = { width: 400, height: 900 };

describe('computeKeyboardInset', () => {
  it('android with a nav bar: the frame sits above the bar, the DOM already pads it', () => {
    expect(computeKeyboardInset({ screenY: 900 - 48 - 300, width: 400, height: 300 }, win, 48)).toBe(300);
  });
  it('ios: frame includes the home-indicator area, so it is subtracted', () => {
    expect(computeKeyboardInset({ screenY: 900 - 336, width: 400, height: 336 }, win, 34)).toBe(302);
  });
  it('floating iPad keyboard is 0', () => {
    expect(computeKeyboardInset({ screenY: 500, width: 320, height: 260 }, { width: 820, height: 1180 }, 20)).toBe(0);
    expect(computeKeyboardInset({ screenY: 500, width: 820, height: 260 }, { width: 820, height: 1180 }, 20)).toBe(0);
  });
  it('hardware keyboard accessory bar is 0', () => {
    expect(computeKeyboardInset({ screenY: 900 - 89, width: 400, height: 89 }, win, 34)).toBe(0);
  });
  it('split-screen uses the window, not the screen', () => {
    expect(computeKeyboardInset({ screenY: 450 - 250, width: 400, height: 250 }, { width: 400, height: 450 }, 0)).toBe(250);
  });
  it('null frame is 0', () => {
    expect(computeKeyboardInset(null, win, 0)).toBe(0);
  });
});

describe('useKeyboardInset', () => {
  it('android: height on keyboardDidShow, 0 on keyboardDidHide, recomputed on frame change', () => {
    rn.bottom = 48;
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
    act(() => rn.handlers.get('keyboardDidShow')?.({ endCoordinates: { screenY: 552, width: 400, height: 300 } }));
    expect(result.current).toBe(300);
    act(() => rn.handlers.get('keyboardDidChangeFrame')?.({ endCoordinates: { screenY: 502, width: 400, height: 350 } }));
    expect(result.current).toBe(350);
    act(() => rn.handlers.get('keyboardDidHide')?.());
    expect(result.current).toBe(0);
  });
  it('ios: Will events incl. frame change (undock), unsubscribes on unmount', () => {
    rn.os = 'ios';
    rn.bottom = 34;
    const { result, unmount } = renderHook(() => useKeyboardInset());
    act(() => rn.handlers.get('keyboardWillShow')?.({ endCoordinates: { screenY: 564, width: 400, height: 336 } }));
    expect(result.current).toBe(302);
    act(() => rn.handlers.get('keyboardWillChangeFrame')?.({ endCoordinates: { screenY: 300, width: 300, height: 336 } }));
    expect(result.current).toBe(0);
    act(() => rn.handlers.get('keyboardWillHide')?.());
    expect(result.current).toBe(0);
    unmount();
    expect(rn.handlers.size).toBe(0);
  });
  it('rotation (window change) recomputes from the last frame', () => {
    const { result, rerender } = renderHook(() => useKeyboardInset());
    act(() => rn.handlers.get('keyboardDidShow')?.({ endCoordinates: { screenY: 600, width: 400, height: 300 } }));
    expect(result.current).toBe(300);
    rn.win = { width: 900, height: 400 };
    rerender();
    expect(result.current).toBe(0);
  });
});
