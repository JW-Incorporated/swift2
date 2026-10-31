// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef, useLayoutEffect } from 'react';
import { useStopWhenHidden, claimPlayback } from './use-stop-when-hidden';
import { useEmbedGate } from './use-embed-gate';

// ---------------------------------------------------------------------------
// IO mock
// ---------------------------------------------------------------------------

type IOMockCallback = (entries: Array<{ intersectionRatio: number }>) => void;
let ioCallback: IOMockCallback | null = null;
const ioDisconnect = vi.fn();

class MockIntersectionObserver {
  constructor(cb: IOMockCallback) {
    ioCallback = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {
    ioDisconnect();
  }
  takeRecords() {
    return [];
  }
}

// ---------------------------------------------------------------------------
// elementFromPoint mock
// ---------------------------------------------------------------------------

let efMock: ((x: number, y: number) => Element | null) | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEl() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  el.getBoundingClientRect = () => ({
    left: 100,
    top: 100,
    width: 200,
    height: 200,
    right: 300,
    bottom: 300,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  });
  return el;
}

/**
 * Wrapper hook that sets the ref synchronously (useLayoutEffect runs before
 * useEffect, so the ref is available when useStopWhenHidden's effect fires).
 */
function TestHook({ active, stop, el }: { active: boolean; stop: () => void; el: HTMLElement | null }) {
  const ref = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    ref.current = el;
  }, [el]);
  useStopWhenHidden(active, ref, stop);
  return { ref };
}

/** Wrapper hook for useEmbedGate. */
function GateHook({ startPlaying }: { startPlaying: boolean }) {
  return useEmbedGate(startPlaying, undefined);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  ioCallback = null;
  ioDisconnect.mockClear();
  efMock = null;
  (global as unknown as Record<string, unknown>).IntersectionObserver =
    MockIntersectionObserver;
  Object.defineProperty(document, 'elementFromPoint', {
    value: (x: number, y: number) => efMock?.(x, y) ?? null,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  delete (global as unknown as Record<string, unknown>).IntersectionObserver;
});

// ---------------------------------------------------------------------------
// useStopWhenHidden tests
// ---------------------------------------------------------------------------

describe('useStopWhenHidden', () => {
  it('calls stop when visibilitychange fires with hidden', () => {
    const stop = vi.fn();
    const el = makeEl();

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('does NOT call stop when visibilitychange fires with visible', () => {
    const stop = vi.fn();
    const el = makeEl();

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(stop).not.toHaveBeenCalled();
  });

  it('does NOT call stop when IO first reports ratio 0.2 (never seen in view)', () => {
    const stop = vi.fn();
    const el = makeEl();

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    // IO was registered with the element during the effect
    expect(ioCallback).not.toBeNull();

    act(() => {
      ioCallback!([{ intersectionRatio: 0.2 }]);
    });

    expect(stop).not.toHaveBeenCalled();
  });

  it('calls stop when IO reports 0.9 then 0.2 (seen in view, then off-screen)', () => {
    const stop = vi.fn();
    const el = makeEl();

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    act(() => {
      ioCallback!([{ intersectionRatio: 0.9 }]);
    });

    expect(stop).not.toHaveBeenCalled();

    act(() => {
      ioCallback!([{ intersectionRatio: 0.2 }]);
    });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('calls stop when elementFromPoint returns an unrelated element after a self hit', () => {
    const stop = vi.fn();
    const el = makeEl();
    const unrelated = document.createElement('div');

    efMock = () => el;

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    // First tick: element is uncovered — marks seenUncovered
    act(() => {
      vi.advanceTimersByTime(750);
    });

    expect(stop).not.toHaveBeenCalled();

    // Second tick: element is covered — stops because seenUncovered is true
    efMock = () => unrelated;
    act(() => {
      vi.advanceTimersByTime(750);
    });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('does NOT call stop when elementFromPoint first returns an unrelated element (never seen uncovered)', () => {
    const stop = vi.fn();
    const el = makeEl();
    const unrelated = document.createElement('div');

    efMock = () => unrelated;

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    act(() => {
      vi.advanceTimersByTime(750);
    });

    expect(stop).not.toHaveBeenCalled();
  });

  it('does NOT call stop when elementFromPoint returns the iframe itself', () => {
    const stop = vi.fn();
    const el = makeEl();

    efMock = () => el;

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    act(() => {
      vi.advanceTimersByTime(750);
    });

    expect(stop).not.toHaveBeenCalled();
  });

  it('does not register listeners when not active', () => {
    const stop = vi.fn();
    const el = makeEl();

    renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: false, stop, el } },
    );

    // No IO callback should have been registered
    expect(ioCallback).toBeNull();

    // No listeners registered — visibilitychange should not trigger stop
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(stop).not.toHaveBeenCalled();

    // No interval registered — advancing timers should not trigger stop
    act(() => {
      vi.advanceTimersByTime(750);
    });

    expect(stop).not.toHaveBeenCalled();
  });

  it('cleans up on deactivate', () => {
    const stop = vi.fn();
    const el = makeEl();

    const { rerender } = renderHook(
      ({ active, stop, el }) => TestHook({ active, stop, el }),
      { initialProps: { active: true, stop, el } },
    );

    // IO was registered
    expect(ioCallback).not.toBeNull();

    // Deactivate
    rerender({ active: false, stop, el });

    // IO should be disconnected
    expect(ioDisconnect).toHaveBeenCalled();

    // After deactivation, visibilitychange should not trigger stop
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(stop).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// claimPlayback tests
// ---------------------------------------------------------------------------

describe('claimPlayback', () => {
  it('calls every OTHER registered stop when a new stop is claimed', () => {
    const stopA = vi.fn();
    const stopB = vi.fn();

    claimPlayback(stopA);
    claimPlayback(stopB);

    expect(stopA).toHaveBeenCalledTimes(1);
    expect(stopB).not.toHaveBeenCalled();
  });

  it('does not call itself', () => {
    const stopA = vi.fn();
    claimPlayback(stopA);
    expect(stopA).not.toHaveBeenCalled();
  });

  it('tracks multiple stops and calls all others on new claim', () => {
    const stopA = vi.fn();
    const stopB = vi.fn();
    const stopC = vi.fn();

    claimPlayback(stopA);
    claimPlayback(stopB);
    expect(stopA).toHaveBeenCalledTimes(1);

    claimPlayback(stopC);
    expect(stopA).toHaveBeenCalledTimes(2);
    expect(stopB).toHaveBeenCalledTimes(1);
    expect(stopC).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useEmbedGate integration tests
// ---------------------------------------------------------------------------

describe('useEmbedGate', () => {
  it('calls stop (setPlaying false) when visibility goes hidden', () => {
    const el = makeEl();

    const { result } = renderHook(
      ({ startPlaying }) => GateHook({ startPlaying }),
      { initialProps: { startPlaying: true } },
    );

    act(() => {
      result.current.iframeRef.current = el as unknown as HTMLIFrameElement;
    });

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.playing).toBe(false);
  });
});
