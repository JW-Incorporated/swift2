// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ERA_JUMP_GATE_ATTR } from './era-jump-landing';
import { JUMP_SCROLL_MAX_MS, JUMP_SCROLL_SETTLE_MS, startEraJumpScroll, useEraJumpGateRelease } from './era-jump-scroll';

const gated = () => document.documentElement.hasAttribute(ERA_JUMP_GATE_ATTR);

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16));
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  document.documentElement.setAttribute(ERA_JUMP_GATE_ATTR, '');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ERA_JUMP_GATE_ATTR);
});

function addSection(id: string) {
  const el = document.createElement('section');
  el.dataset.llSection = id;
  document.body.appendChild(el);
}

describe('startEraJumpScroll ends (#6807)', () => {
  it('finishes once the settle window after first landing has passed', () => {
    addSection('debut');
    const onFinish = vi.fn();
    startEraJumpScroll('debut', onFinish);
    expect(window.scrollTo).toHaveBeenCalled();
    vi.advanceTimersByTime(JUMP_SCROLL_SETTLE_MS - 200);
    expect(onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('finishes at the deadline when the target never renders', () => {
    const onFinish = vi.fn();
    startEraJumpScroll('debut', onFinish);
    vi.advanceTimersByTime(JUMP_SCROLL_MAX_MS - 200);
    expect(onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it.each(['wheel', 'touchstart'])('finishes immediately on a user %s', (type) => {
    const onFinish = vi.fn();
    startEraJumpScroll('debut', onFinish);
    window.dispatchEvent(new Event(type));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('the returned cleanup finishes (unmount / superseded jump), and only once', () => {
    const onFinish = vi.fn();
    const cleanup = startEraJumpScroll('debut', onFinish);
    cleanup();
    cleanup();
    vi.advanceTimersByTime(JUMP_SCROLL_MAX_MS * 2);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

describe('useEraJumpGateRelease', () => {
  it('a restore mount releases the gate (no jump will run)', () => {
    renderHook(() => useEraJumpGateRelease(true));
    expect(gated()).toBe(false);
  });

  it('a fresh front-door mount keeps the gate for the pending deep-link jump', () => {
    renderHook(() => useEraJumpGateRelease(false));
    expect(gated()).toBe(true);
  });

  it('unmount releases the gate', () => {
    const { unmount } = renderHook(() => useEraJumpGateRelease(false));
    unmount();
    expect(gated()).toBe(false);
  });
});
