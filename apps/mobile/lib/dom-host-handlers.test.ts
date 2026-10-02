import { describe, expect, it, vi } from 'vitest';
import { MAX_CRASH_RELOADS, createDomHostHandlers, sharedUiActive } from './dom-host-handlers';

function setup(active = true) {
  const onSignal = vi.fn();
  const reload = vi.fn();
  const onGiveUp = vi.fn();
  let focusCb: (() => void) | null = null;
  const h = createDomHostHandlers({
    onSignal,
    reload,
    onGiveUp,
    isAppActive: () => active,
    onceFocused: (fn) => {
      focusCb = fn;
    },
  });
  return { h, onSignal, reload, onGiveUp, focus: () => focusCb?.() };
}

describe('createDomHostHandlers', () => {
  it('reports ready and errors to the collector', async () => {
    const { h, onSignal } = setup();
    await h.onReady();
    await h.reportError('x'.repeat(300));
    expect(onSignal).toHaveBeenCalledWith('dom-ready');
    expect(onSignal).toHaveBeenCalledWith('dom-error', 'x'.repeat(200));
  });

  it('records iOS termination and reloads', () => {
    const { h, onSignal, reload } = setup();
    h.onContentProcessDidTerminate();
    expect(onSignal).toHaveBeenCalledWith('dom-process-terminated');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('records Android render-process-gone and reloads when active', () => {
    const { h, onSignal, reload } = setup(true);
    h.onRenderProcessGone();
    expect(onSignal).toHaveBeenCalledWith('dom-render-process-gone');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('defers the Android reload until the app is focused', () => {
    const { h, reload, focus } = setup(false);
    h.onRenderProcessGone();
    expect(reload).not.toHaveBeenCalled();
    focus();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('caps crash reloads and then gives up instead of looping', () => {
    const { h, reload, onGiveUp, onSignal } = setup();
    for (let i = 0; i < MAX_CRASH_RELOADS + 2; i += 1) h.onContentProcessDidTerminate();
    expect(reload).toHaveBeenCalledTimes(MAX_CRASH_RELOADS);
    expect(onGiveUp).toHaveBeenCalledTimes(2);
    expect(onSignal).toHaveBeenCalledWith('dom-reload-cap-reached');
  });
});

describe('sharedUiActive', () => {
  it('mounts only when the flag or the device override is on', () => {
    expect(sharedUiActive(false, false)).toBe(false);
    expect(sharedUiActive(true, false)).toBe(true);
    expect(sharedUiActive(false, true)).toBe(true);
  });
});

describe("watchdog forwarding", () => {
  it("forwards ready, error and crash events to the watch sink", async () => {
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() };
    const h = createDomHostHandlers({
      onSignal: vi.fn(),
      reload: vi.fn(),
      onGiveUp: vi.fn(),
      isAppActive: () => true,
      onceFocused: () => {},
      watch,
    });
    await h.onReady();
    await h.reportError("bad");
    h.onContentProcessDidTerminate();
    h.onRenderProcessGone();
    expect(watch.ready).toHaveBeenCalledTimes(1);
    expect(watch.error).toHaveBeenCalledWith("bad");
    expect(watch.crashed.mock.calls).toEqual([["terminated"], ["render-gone"]]);
  });
});
