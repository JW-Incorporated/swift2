import { describe, expect, it, vi } from 'vitest';
import { createDomHostHandlers } from './dom-host-handlers';
import { createAttemptMonitor } from './watchdog';

const T = 'tok-0123456789abcdef0123456789ab';

function setup() {
  const onSignal = vi.fn();
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() };
  return { h: createDomHostHandlers({ onSignal, watch, token: T }), onSignal, watch };
}

describe('createDomHostHandlers bridge forwarder', () => {
  it('forwards the envelope and resolves with the awaited reply; no bridge is a no-op', async () => {
    const bridge = vi.fn().mockResolvedValue({ reply: 1 });
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() };
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge, token: T });
    expect(await h.bridge({ kind: 'evt' }, T)).toEqual({ reply: 1 });
    expect(bridge).toHaveBeenCalledWith({ kind: 'evt' });
    expect(await setup().h.bridge({}, T)).toBeUndefined();
    expect(watch.ready).not.toHaveBeenCalled();
  });
});

describe('createDomHostHandlers', () => {
  it('reports ready and errors to the collector and the watchdog', async () => {
    const { h, onSignal, watch } = setup();
    await h.onReady(T);
    await h.reportError('x'.repeat(300), T);
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
      return { h: createDomHostHandlers({ onSignal, watch, reload, token: T }), onSignal, onStrike, reload, m };
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
    const h = createDomHostHandlers({ onSignal, watch, reload, token: T, bridge: vi.fn().mockResolvedValue(1), isCurrent: () => epoch === 1, invalidate: () => void (epoch += 1) });
    return { h, watch, reload, onSignal };
  }

  it('crash invalidates the epoch synchronously: a late ready/error/protocol/bridge from the dead webview is ignored', async () => {
    const f = fenced();
    const settled = f.h.onContentProcessDidTerminate();
    await f.h.onReady(T);
    await f.h.reportError('late', T);
    await f.h.reportProtocolFatal('late', T);
    await expect(f.h.bridge({}, T)).rejects.toThrow('stale epoch');
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
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch, reload, token: T, isCurrent: () => live, invalidate: () => void (live = false), whenActive: (fn) => (run = fn) });
    const settled = h.onRenderProcessGone();
    expect(live).toBe(false);
    expect(watch.crashed).not.toHaveBeenCalled();
    run();
    await settled;
    expect(watch.crashed).toHaveBeenCalledWith('render-gone');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});


describe('per-epoch bridge token', () => {
  const calls = (h: ReturnType<typeof setup>['h'], bad?: string) => [
    () => h.onReady(bad as string),
    () => h.reportError('x', bad as string),
    () => h.bridge({ kind: 'evt' }, bad as string),
    () => h.reportProtocolFatal('x', bad as string),
    () => h.reportProbe('{}', bad as string),
    () => h.reportImageLoad(true, bad as string),
  ];

  it.each([undefined, '', 'wrong'])('a missing or wrong token (%s) only signals: no watchdog, bridge, probe or image effect', async (bad) => {
    const onSignal = vi.fn();
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
    const bridge = vi.fn();
    const onProbe = vi.fn();
    const onImageLoad = vi.fn();
    const h = createDomHostHandlers({ onSignal, watch, bridge, token: T, onProbe, onImageLoad });
    for (const call of calls(h as never, bad)) await expect(call()).rejects.toThrow('bridge unauthorized');
    expect(onSignal.mock.calls.map((c) => c[0])).toEqual(Array(6).fill('bridge-unauth'));
    expect(onSignal.mock.calls.map((c) => c[1])).toEqual(['onReady', 'reportError', 'bridge', 'reportProtocolFatal', 'reportProbe', 'reportImageLoad']);
    for (const fn of [watch.ready, watch.error, watch.crashed, watch.protocol, bridge, onProbe, onImageLoad]) expect(fn).not.toHaveBeenCalled();
  });

  it('the right token is accepted and reaches every effect', async () => {
    const onProbe = vi.fn();
    const onImageLoad = vi.fn();
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
    const bridge = vi.fn().mockResolvedValue(1);
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge, token: T, onProbe, onImageLoad });
    await h.onReady(T);
    await h.reportError('e', T);
    await h.bridge({ a: 1 }, T);
    await h.reportProtocolFatal('p', T);
    await h.reportProbe('{}', T);
    await h.reportImageLoad(false, T);
    expect([watch.ready, watch.error, bridge, watch.protocol, onProbe, onImageLoad].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('bridgeHello needs no token, is idempotent, and rejects once the epoch is stale', async () => {
    let live = true;
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch: { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() }, token: T, isCurrent: () => live });
    expect(await h.bridgeHello()).toBe(T);
    expect(await h.bridgeHello()).toBe(T);
    live = false;
    await expect(h.bridgeHello()).rejects.toThrow('stale epoch');
  });
});
