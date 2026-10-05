// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
const rn = vi.hoisted(() => ({ os: 'android', handlers: new Map<string, (e?: unknown) => void>() }));
vi.mock('react-native', () => ({
  Keyboard: {
    addListener: (name: string, h: (e?: unknown) => void) => {
      rn.handlers.set(name, h);
      return { remove: () => rn.handlers.delete(name) };
    },
  },
  Platform: { get OS() { return rn.os; } },
}));

import { useKeyboardInset } from './use-keyboard-inset';

afterEach(() => {
  cleanup();
  rn.os = 'android';
  rn.handlers.clear();
});

describe('useKeyboardInset', () => {
  it('android: height on keyboardDidShow, 0 on keyboardDidHide', () => {
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
    act(() => rn.handlers.get('keyboardDidShow')?.({ endCoordinates: { height: 312.4 } }));
    expect(result.current).toBe(312);
    act(() => rn.handlers.get('keyboardDidHide')?.());
    expect(result.current).toBe(0);
  });
  it('ios: uses the Will events', () => {
    rn.os = 'ios';
    const { result, unmount } = renderHook(() => useKeyboardInset());
    act(() => rn.handlers.get('keyboardWillShow')?.({ endCoordinates: { height: 336 } }));
    expect(result.current).toBe(336);
    act(() => rn.handlers.get('keyboardWillHide')?.());
    expect(result.current).toBe(0);
    unmount();
    expect(rn.handlers.size).toBe(0);
  });
});
