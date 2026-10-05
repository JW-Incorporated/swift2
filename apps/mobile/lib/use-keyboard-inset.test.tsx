// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
const rn = vi.hoisted(() => ({ os: 'android', screen: { width: 400, height: 900 }, win: { width: 400, height: 900 }, bottom: 0, handlers: new Map<string, (e?: unknown) => void>() }));
vi.mock('react-native', () => ({
  Keyboard: {
    addListener: (name: string, h: (e?: unknown) => void) => {
      rn.handlers.set(name, h);
      return { remove: () => rn.handlers.delete(name) };
    },
  },
  Platform: { get OS() { return rn.os; } },
  Dimensions: { get: () => rn.screen },
  useWindowDimensions: () => rn.win,
}));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, left: 0, bottom: rn.bottom }) }));

import { computeKeyboardInset, useKeyboardInset } from './use-keyboard-inset';

afterEach(() => {
  cleanup();
  rn.os = 'android';
  rn.win = { width: 400, height: 900 };
  rn.screen = { width: 400, height: 900 };
  rn.bottom = 0;
  rn.handlers.clear();
});


const phone = { width: 400, height: 900 };
const ipad = { width: 820, height: 1180 };

describe('computeKeyboardInset', () => {
  it('phone docked, android: height minus the padded nav bar', () => {
    expect(computeKeyboardInset({ screenY: 552, width: 400, height: 300 }, phone, phone, 48, 'android')).toBe(252);
  });
  it('phone docked, ios: frame includes the home indicator, so it is subtracted', () => {
    expect(computeKeyboardInset({ screenX: 0, screenY: 900 - 336, width: 400, height: 336 }, phone, phone, 34, 'ios')).toBe(302);
  });
  it('android split-screen bottom pane: screenY offset, same height, same inset', () => {
    const win = { width: 400, height: 450 };
    expect(computeKeyboardInset({ screenY: 600, width: 400, height: 300 }, win, phone, 0, 'android')).toBe(300);
    expect(computeKeyboardInset({ screenY: 150, width: 400, height: 300 }, win, phone, 0, 'android')).toBe(300);
  });
  it('hardware keyboard accessory bar is 0', () => {
    expect(computeKeyboardInset({ screenY: 900 - 89, width: 400, height: 89 }, phone, phone, 34, 'ios')).toBe(0);
    expect(computeKeyboardInset({ screenY: 900 - 89, width: 400, height: 89 }, phone, phone, 0, 'android')).toBe(0);
  });
  it('iPad floating keyboard in a full-screen app is 0', () => {
    expect(computeKeyboardInset({ screenX: 250, screenY: 500, width: 320, height: 260 }, ipad, ipad, 20, 'ios')).toBe(0);
    expect(computeKeyboardInset({ screenX: 0, screenY: 500, width: 820, height: 260 }, ipad, ipad, 20, 'ios')).toBe(0);
  });
  it('iPad Split View narrow window: floating kbd of window width at screenX 600 is 0', () => {
    expect(computeKeyboardInset({ screenX: 600, screenY: 900, width: 320, height: 260 }, { width: 320, height: 1180 }, ipad, 20, 'ios')).toBe(0);
  });
  it('iPad Split View docked keyboard (full screen width, full-height window) is nonzero', () => {
    expect(computeKeyboardInset({ screenX: 0, screenY: 1180 - 350, width: 820, height: 350 }, { width: 320, height: 1180 }, ipad, 20, 'ios')).toBe(330);
  });
  it('Slide Over docked (window shorter than screen) is 0', () => {
    expect(computeKeyboardInset({ screenX: 0, screenY: 1180 - 350, width: 820, height: 350 }, { width: 320, height: 1000 }, ipad, 20, 'ios')).toBe(0);
  });
  it('null frame is 0', () => {
    expect(computeKeyboardInset(null, phone, phone, 0, 'android')).toBe(0);
  });
});

describe('useKeyboardInset', () => {
  it('android: height on keyboardDidShow, 0 on keyboardDidHide, recomputed on frame change', () => {
    rn.bottom = 48;
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
    act(() => rn.handlers.get('keyboardDidShow')?.({ endCoordinates: { screenY: 552, width: 400, height: 300 } }));
    expect(result.current).toBe(252);
    act(() => rn.handlers.get('keyboardDidChangeFrame')?.({ endCoordinates: { screenY: 502, width: 400, height: 350 } }));
    expect(result.current).toBe(302);
    act(() => rn.handlers.get('keyboardDidHide')?.());
    expect(result.current).toBe(0);
  });
  it('ios: Will events incl. frame change (undock), unsubscribes on unmount', () => {
    rn.os = 'ios';
    rn.bottom = 34;
    const { result, unmount } = renderHook(() => useKeyboardInset());
    act(() => rn.handlers.get('keyboardWillShow')?.({ endCoordinates: { screenX: 0, screenY: 564, width: 400, height: 336 } }));
    expect(result.current).toBe(302);
    act(() => rn.handlers.get('keyboardWillChangeFrame')?.({ endCoordinates: { screenX: 50, screenY: 300, width: 300, height: 336 } }));
    expect(result.current).toBe(0);
    act(() => rn.handlers.get('keyboardWillHide')?.());
    expect(result.current).toBe(0);
    unmount();
    expect(rn.handlers.size).toBe(0);
  });
  it('rotation (window change) recomputes from the last frame', () => {
    rn.os = 'ios';
    const { result, rerender } = renderHook(() => useKeyboardInset());
    act(() => rn.handlers.get('keyboardWillShow')?.({ endCoordinates: { screenX: 0, screenY: 600, width: 400, height: 300 } }));
    expect(result.current).toBe(300);
    rn.win = { width: 900, height: 400 };
    rn.screen = { width: 900, height: 400 };
    rerender();
    expect(result.current).toBe(0);
  });
});
