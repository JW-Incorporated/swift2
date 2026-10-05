import { describe, expect, it, vi } from 'vitest';
import { READY_TIMEOUT_MS, RELOAD_WINDOW_MS, createAttemptMonitor } from './watchdog-monitor';

function fakeClock(active = true) {
  let t = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  let id = 0;
  const onReady = vi.fn();
  const onStrike = vi.fn();
  const m = createAttemptMonitor({
    now: () => t,
    active,
    onReady,
    onStrike,
    scheduler: {
      setTimeout: (fn, ms) => {
        timers.set(++id, { at: t + ms, fn });
        return id;
      },
      clearTimeout: (h) => void timers.delete(h as number),
    },
  });
  const advance = (ms: number) => {
    t += ms;
    for (const [k, v] of [...timers]) {
      if (v.at <= t) {
        timers.delete(k);
        v.fn();
      }
    }
  };
  return { m, advance, onReady, onStrike };
}

describe('attempt monitor', () => {
  it('ready timeout is 20 s: ready at 19_999 ms is clean, 20_000 ms strikes', () => {
    expect(READY_TIMEOUT_MS).toBe(20_000);
    const a = fakeClock();
    a.advance(19_999);
    a.m.ready();
    a.advance(10);
    expect(a.onStrike).not.toHaveBeenCalled();
    const b = fakeClock();
    b.advance(19_999);
    expect(b.onStrike).not.toHaveBeenCalled();
    b.advance(1);
    expect(b.onStrike).toHaveBeenCalledWith('ready-timeout');
  });

  it('strikes on ready-timeout', () => {
    const { m, advance, onStrike } = fakeClock();
    advance(READY_TIMEOUT_MS - 1);
    expect(onStrike).not.toHaveBeenCalled();
    advance(1);
    expect(onStrike).toHaveBeenCalledWith('ready-timeout');
    m.ready();
  });

  it('ready is idempotent and cancels the timeout', () => {
    const { m, advance, onReady, onStrike } = fakeClock();
    m.ready();
    m.ready();
    advance(READY_TIMEOUT_MS * 2);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onStrike).not.toHaveBeenCalled();
  });

  it('pauses the timeout while backgrounded and resumes with the remainder', () => {
    const { m, advance, onStrike } = fakeClock();
    advance(4_000);
    m.setActive(false);
    advance(60_000);
    expect(onStrike).not.toHaveBeenCalled();
    m.setActive(true);
    advance(READY_TIMEOUT_MS - 4_000 - 1);
    expect(onStrike).not.toHaveBeenCalled();
    advance(1);
    expect(onStrike).toHaveBeenCalledWith('ready-timeout');
  });

  it('counts a DOM error only before ready; a crash before ready strikes at the event', () => {
    const a = fakeClock();
    a.m.error('x'.repeat(300));
    expect(a.onStrike).toHaveBeenCalledTimes(1);
    expect(a.onStrike.mock.calls[0][0].length).toBeLessThanOrEqual(120);
    const b = fakeClock();
    b.m.ready();
    b.m.error('late');
    expect(b.onStrike).not.toHaveBeenCalled();
    const c = fakeClock();
    expect(c.m.crashed('terminated')).toBe('strike');
    expect(c.m.crashed('render-gone')).toBe('strike');
    expect(c.onStrike).toHaveBeenCalledTimes(1);
    expect(c.onStrike).toHaveBeenCalledWith('webview-terminated');
  });

  it('a first post-ready termination reloads without a strike; a repeat inside the window strikes', () => {
    const { m, advance, onReady, onStrike } = fakeClock();
    m.ready();
    advance(1_000);
    expect(m.crashed('terminated')).toBe('reload');
    expect(onStrike).not.toHaveBeenCalled();
    m.ready();
    expect(onReady).toHaveBeenCalledTimes(2);
    advance(RELOAD_WINDOW_MS - 1);
    expect(m.crashed('render-gone')).toBe('strike');
    expect(onStrike).toHaveBeenCalledTimes(1);
    expect(onStrike).toHaveBeenCalledWith('webview-render-gone');
  });

  it('a termination after the window reloads again', () => {
    const { m, advance, onStrike } = fakeClock();
    m.ready();
    expect(m.crashed('terminated')).toBe('reload');
    m.ready();
    advance(RELOAD_WINDOW_MS);
    expect(m.crashed('terminated')).toBe('reload');
    expect(onStrike).not.toHaveBeenCalled();
  });

  it('a reloaded page that never reaches ready times out, and one that crashes before ready strikes', () => {
    const a = fakeClock();
    a.m.ready();
    expect(a.m.crashed('terminated')).toBe('reload');
    a.advance(READY_TIMEOUT_MS);
    expect(a.onStrike).toHaveBeenCalledWith('ready-timeout');
    const b = fakeClock();
    b.m.ready();
    expect(b.m.crashed('terminated')).toBe('reload');
    expect(b.m.crashed('terminated')).toBe('strike');
    expect(b.onStrike).toHaveBeenCalledWith('webview-terminated');
  });

  it('starts paused when created while backgrounded', () => {
    const { m, advance, onStrike } = fakeClock(false);
    advance(READY_TIMEOUT_MS * 3);
    expect(onStrike).not.toHaveBeenCalled();
    m.setActive(true);
    advance(READY_TIMEOUT_MS);
    expect(onStrike).toHaveBeenCalledTimes(1);
  });
});

describe('planned reload (content adoption)', () => {
  it('re-arms the ready timeout: a replacement reader that never readies is a ready-timeout strike', () => {
    const { m, advance, onStrike } = fakeClock();
    m.ready();
    advance(READY_TIMEOUT_MS * 2);
    expect(m.plannedReload()).toBe(true);
    advance(READY_TIMEOUT_MS - 1);
    expect(onStrike).not.toHaveBeenCalled();
    advance(1);
    expect(onStrike).toHaveBeenCalledWith('ready-timeout');
  });

  it('a DOM error from the replacement reader strikes, and its ready clears the attempt without a strike', () => {
    const a = fakeClock();
    a.m.ready();
    a.m.plannedReload();
    a.m.error('boom');
    expect(a.onStrike).toHaveBeenCalledWith('dom-error: boom');
    const b = fakeClock();
    b.m.ready();
    b.m.plannedReload();
    b.m.ready();
    b.advance(READY_TIMEOUT_MS * 2);
    expect(b.onStrike).not.toHaveBeenCalled();
    expect(b.onReady).toHaveBeenCalledTimes(2);
  });

  it('is not itself a strike and does not count toward the crash repeat window', () => {
    const { m, advance, onStrike } = fakeClock();
    m.ready();
    expect(m.plannedReload()).toBe(true);
    expect(onStrike).not.toHaveBeenCalled();
    m.ready();
    advance(1000);
    expect(m.crashed('terminated')).toBe('reload');
    expect(onStrike).not.toHaveBeenCalled();
  });

  it('after a strike it is a no-op', () => {
    const { m, onStrike } = fakeClock();
    m.error('x');
    expect(m.plannedReload()).toBe(false);
    expect(onStrike).toHaveBeenCalledTimes(1);
  });
});
