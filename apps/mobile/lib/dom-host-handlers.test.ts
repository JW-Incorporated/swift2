import { describe, expect, it, vi } from 'vitest';
import { createDomHostHandlers, sharedUiActive } from './dom-host-handlers';

function setup() {
  const onSignal = vi.fn();
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() };
  return { h: createDomHostHandlers({ onSignal, watch }), onSignal, watch };
}

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
});

describe('sharedUiActive', () => {
  it('mounts only when the flag or the device override is on', () => {
    expect(sharedUiActive(false, false)).toBe(false);
    expect(sharedUiActive(true, false)).toBe(true);
    expect(sharedUiActive(false, true)).toBe(true);
  });
});
