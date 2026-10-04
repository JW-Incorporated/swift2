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

  it('through the real watchdog: pre-ready strikes; post-ready reloads once, then strikes on a repeat', () => {
    const make = () => {
      const onSignal = vi.fn();
      const onStrike = vi.fn();
      const reload = vi.fn();
      const m = createAttemptMonitor({ scheduler: { setTimeout: () => 0, clearTimeout: () => {} }, now: () => 0, active: true, onReady: () => {}, onStrike });
      const watch = { ready: () => m.ready(), error: (x: string) => m.error(x), crashed: (k: 'terminated' | 'render-gone') => m.crashed(k) };
      return { h: createDomHostHandlers({ onSignal, watch, reload }), onSignal, onStrike, reload, m };
    };
    const pre = make();
    pre.h.onContentProcessDidTerminate();
    expect(pre.onStrike).toHaveBeenCalledWith('webview-terminated');
    expect(pre.reload).not.toHaveBeenCalled();
    expect(pre.onSignal).toHaveBeenCalledWith('dom-crash-strike', 'terminated');
    const post = make();
    post.m.ready();
    post.h.onContentProcessDidTerminate();
    expect(post.reload).toHaveBeenCalledTimes(1);
    expect(post.onStrike).not.toHaveBeenCalled();
    expect(post.onSignal).toHaveBeenCalledWith('dom-reload-after-crash', 'terminated');
    post.m.ready();
    post.h.onContentProcessDidTerminate();
    expect(post.reload).toHaveBeenCalledTimes(1);
    expect(post.onStrike).toHaveBeenCalledWith('webview-terminated');
    expect(post.onSignal).toHaveBeenCalledWith('dom-crash-strike', 'terminated');
  });
});
