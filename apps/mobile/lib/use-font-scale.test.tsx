// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));

const state = vi.hoisted(() => ({
  scale: 1,
  handlers: { app: [] as Array<(s: string) => void>, dims: [] as Array<() => void> },
  removed: 0,
}));

vi.mock('react-native', () => ({
  PixelRatio: { getFontScale: () => state.scale },
  AppState: {
    addEventListener: (_: string, cb: (s: string) => void) => {
      state.handlers.app.push(cb);
      return { remove: () => void state.removed++ };
    },
  },
  Dimensions: {
    addEventListener: (_: string, cb: () => void) => {
      state.handlers.dims.push(cb);
      return { remove: () => void state.removed++ };
    },
  },
}));

import { useFontScale } from './use-font-scale';

afterEach(cleanup);

describe('useFontScale', () => {
  beforeEach(() => {
    state.scale = 1;
    state.handlers.app = [];
    state.handlers.dims = [];
    state.removed = 0;
  });

  it('starts at the OS scale and re-reads on AppState active only', () => {
    const { result } = renderHook(() => useFontScale());
    expect(result.current).toBe(1);
    state.scale = 1.3;
    act(() => state.handlers.app[0]('background'));
    expect(result.current).toBe(1);
    act(() => state.handlers.app[0]('active'));
    expect(result.current).toBe(1.3);
  });

  it('re-reads on a Dimensions change and removes both listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useFontScale());
    state.scale = 0.9;
    act(() => state.handlers.dims[0]());
    expect(result.current).toBe(0.9);
    unmount();
    expect(state.removed).toBe(2);
  });
});
