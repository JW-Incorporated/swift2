import { describe, expect, it, vi } from 'vitest';
import { createDomHostHandlers } from './dom-host-handlers';
import { createAttemptMonitor } from './watchdog';

function setup() {
  const onSignal = vi.fn();
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() };
  return { h: createDomHostHandlers({ onSignal, watch }), onSignal, watch };
}

describe('createDomHostHandlers bridge forwarder', () => {
  it('forwards the envelope and resolves with the awaited reply; no bridge is a no-op', async () => {
    const bridge = vi.fn().mockResolvedValue({ reply: 1 });
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() };
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge });
    expect(await h.bridge({ kind: 'evt' })).toEqual({ reply: 1 });
    expect(bridge).toHaveBeenCalledWith({ kind: 'evt' });
    expect(await setup().h.bridge({})).toBeUndefined();
    expect(watch.ready).not.toHaveBeenCalled();
  });
});

describe('createDomHostHandlers', () => {
  it('reports ready and errors to the collector and the watchdog', async () => {
    const { h, onSignal, watch } = setup();
    await h.onReady();
    await h.reportError('x'.repeat(300));
    expect(onSignal).toHaveBeenCalledWith('dom-ready');
    expect(onSignal).toHaveBeenCalledWith('dom-error', 'x'.repeat(200));
    expect(watch.ready).toHaveBeenCalledTimes(1);
    expect(watch.error).toHaveBeenCalledWith('x'.repeat(300));
  });

  it('signals iOS termination and Android render-process-gone to the watchdog only', () => {
    const { h, onSignal, watch } = setup();
    h.onContentProcessDidTerminate();
    h.onRenderProcessGone();
    expect(onSignal).toHaveBeenCalledWith('dom-process-terminated');
    expect(onSignal).toHaveBeenCalledWith('dom-render-process-gone');
    expect(watch.crashed.mock.calls).toEqual([['terminated'], ['render-gone']]);
  });

  it('through the real watchdog: pre-ready strikes; post-ready reloads once, then strikes on a repeat', async () => {
    const make = () => {
      const onSignal = vi.fn();
      const onStrike = vi.fn();
      const reload = vi.fn();
      const m = createAttemptMonitor({ scheduler: { setTimeout: () => 0, clearTimeout: () => {} }, now: () => 0, active: true, onReady: () => {}, onStrike });
      const watch = { ready: () => m.ready(), error: (x: string) => m.error(x), crashed: (k: 'terminated' | 'render-gone') => m.crashed(k) };
      return { h: createDomHostHandlers({ onSignal, watch, reload }), onSignal, onStrike, reload, m };
    };
    const pre = make();
    await pre.h.onContentProcessDidTerminate();
    expect(pre.onStrike).toHaveBeenCalledWith('webview-terminated');
    expect(pre.reload).not.toHaveBeenCalled();
    expect(pre.onSignal).toHaveBeenCalledWith('dom-crash-strike', 'terminated');
    const post = make();
    post.m.ready();
    await post.h.onContentProcessDidTerminate();
    expect(post.reload).toHaveBeenCalledTimes(1);
    expect(post.onStrike).not.toHaveBeenCalled();
    expect(post.onSignal).toHaveBeenCalledWith('dom-reload-after-crash', 'terminated');
    post.m.ready();
    await post.h.onContentProcessDidTerminate();
    expect(post.reload).toHaveBeenCalledTimes(1);
    expect(post.onStrike).toHaveBeenCalledWith('webview-terminated');
    expect(post.onSignal).toHaveBeenCalledWith('dom-crash-strike', 'terminated');
  });
});

describe('epoch fence and deferred recovery', () => {
  function fenced(crashed: () => 'reload' | Promise<'reload'> = () => 'reload') {
    let epoch = 1;
    const onSignal = vi.fn();
    const watch = { ready: vi.fn(), error: vi.fn(), protocol: vi.fn(), crashed: vi.fn(crashed) };
    const reload = vi.fn();
    const h = createDomHostHandlers({ onSignal, watch, reload, bridge: vi.fn().mockResolvedValue(1), isCurrent: () => epoch === 1, invalidate: () => void (epoch += 1) });
    return { h, watch, reload, onSignal };
  }

  it('crash invalidates the epoch synchronously: a late ready/error/protocol/bridge from the dead webview is ignored', async () => {
    const f = fenced();
    const settled = f.h.onContentProcessDidTerminate();
    await f.h.onReady();
    await f.h.reportError('late');
    await f.h.reportProtocolFatal('late');
    await expect(f.h.bridge({})).rejects.toThrow('stale epoch');
    await settled;
    expect(f.watch.ready).not.toHaveBeenCalled();
    expect(f.watch.error).not.toHaveBeenCalled();
    expect(f.watch.protocol).not.toHaveBeenCalled();
    expect(f.reload).toHaveBeenCalledTimes(1);
  });

  it('a duplicate crash from the same dead epoch is ignored', async () => {
    const f = fenced();
    await f.h.onContentProcessDidTerminate();
    await f.h.onRenderProcessGone();
    expect(f.watch.crashed).toHaveBeenCalledTimes(1);
  });

  it('reload waits for the persistence the watchdog awaits', async () => {
    let release: (v: string) => void = () => {};
    const f = fenced(() => new Promise<'reload'>((r) => (release = r as (v: string) => void)));
    const settled = f.h.onContentProcessDidTerminate();
    await Promise.resolve();
    expect(f.reload).not.toHaveBeenCalled();
    release('reload');
    await settled;
    expect(f.reload).toHaveBeenCalledTimes(1);
  });

  it('render-process-gone defers the whole recovery through whenActive, the fence closes at once', async () => {
    let run: () => void = () => {};
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(() => 'reload' as const) };
    const reload = vi.fn();
    let live = true;
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch, reload, isCurrent: () => live, invalidate: () => void (live = false), whenActive: (fn) => (run = fn) });
    const settled = h.onRenderProcessGone();
    expect(live).toBe(false);
    expect(watch.crashed).not.toHaveBeenCalled();
    run();
    await settled;
    expect(watch.crashed).toHaveBeenCalledWith('render-gone');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

