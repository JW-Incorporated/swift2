// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ERA_JUMP_GATE_ATTR, ERA_JUMP_GATE_TIMER, clearEraJumpGate, openWithEraJumpGate } from './era-jump-landing';

const timers = window as unknown as Record<string, number | undefined>;
const gated = () => document.documentElement.hasAttribute(ERA_JUMP_GATE_ATTR);

beforeEach(() => {
  vi.useFakeTimers();
  document.documentElement.setAttribute(ERA_JUMP_GATE_ATTR, '');
  timers[ERA_JUMP_GATE_TIMER] = window.setTimeout(() => clearEraJumpGate(), 12000);
});

afterEach(() => {
  vi.useRealTimers();
  timers[ERA_JUMP_GATE_TIMER] = undefined;
  document.documentElement.removeAttribute(ERA_JUMP_GATE_ATTR);
  document.body.innerHTML = '';
});

describe('openWithEraJumpGate (#6807)', () => {
  it('an era jump that dispatches takes over: fallback cancelled, gate left for EraStream', () => {
    const action = vi.fn();
    openWithEraJumpGate(action, true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(timers[ERA_JUMP_GATE_TIMER]).toBeUndefined();
    vi.advanceTimersByTime(20000);
    expect(gated()).toBe(true);
  });

  it('an action that throws releases the gate and rethrows, never stranding it', () => {
    const boom = new Error('boom');
    expect(() =>
      openWithEraJumpGate(() => {
        throw boom;
      }, true),
    ).toThrow(boom);
    expect(gated()).toBe(false);
  });

  it('a non-era open leaves the fallback timer alone', () => {
    const id = timers[ERA_JUMP_GATE_TIMER];
    openWithEraJumpGate(() => {}, false);
    expect(timers[ERA_JUMP_GATE_TIMER]).toBe(id);
  });
});

describe('clearEraJumpGate', () => {
  it('also drops aria-busy from <main>', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    main.setAttribute('aria-busy', 'true');
    document.body.appendChild(main);
    clearEraJumpGate();
    expect(gated()).toBe(false);
    expect(main.hasAttribute('aria-busy')).toBe(false);
  });
});
