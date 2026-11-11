import { describe, expect, it, vi } from 'vitest';
import { PENDING_MAX_MS } from './watchdog-policy';
import { SPLASH_SAFETY_MS, createSplashHandoff, splashCanHideWithoutDom, type SplashModule } from './splash-handoff';

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

function fakeTimers() {
  const pending = new Map<number, () => void>();
  let next = 1;
  return {
    setTimeout: (fn: () => void) => {
      pending.set(next, fn);
      return next++;
    },
    clearTimeout: (h: unknown) => void pending.delete(h as number),
    fire: () => [...pending.values()].forEach((fn) => fn()),
    size: () => pending.size,
  };
}

const mod = (over: Partial<SplashModule> = {}) => ({
  preventAutoHideAsync: vi.fn(async () => true),
  hideAsync: vi.fn(async () => undefined),
  ...over,
});

describe('createSplashHandoff', () => {
  it('holds the splash at creation and hides once on DOM ready, however often it is called', async () => {
    const m = mod();
    const t = fakeTimers();
    const h = createSplashHandoff(() => m, t);
    expect(m.preventAutoHideAsync).toHaveBeenCalledTimes(1);
    expect(m.hideAsync).not.toHaveBeenCalled();
    h.hide();
    h.hide();
    await flush();
    expect(m.hideAsync).toHaveBeenCalledTimes(1);
    expect(t.size()).toBe(0);
    t.fire();
    await flush();
    expect(m.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('hides when the safety timer fires and a late ready does not hide again', async () => {
    const m = mod();
    const t = fakeTimers();
    const h = createSplashHandoff(() => m, t);
    t.fire();
    await flush();
    expect(m.hideAsync).toHaveBeenCalledTimes(1);
    h.hide();
    await flush();
    expect(m.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('safety bound is derived from the pending bound', () => {
    expect(SPLASH_SAFETY_MS).toBe(PENDING_MAX_MS * 2);
  });

  it('waits for preventAutoHideAsync before hiding', async () => {
    let release: () => void = () => undefined;
    const m = mod({ preventAutoHideAsync: vi.fn(() => new Promise<boolean>((r) => (release = () => r(true)))) });
    const h = createSplashHandoff(() => m, fakeTimers());
    h.hide();
    await flush();
    expect(m.hideAsync).not.toHaveBeenCalled();
    release();
    await flush();
    expect(m.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('module absent (load throws or returns null): hide is a safe no-op and no timer is armed', async () => {
    const t = fakeTimers();
    const a = createSplashHandoff(() => {
      throw new Error('native module missing');
    }, t);
    const b = createSplashHandoff(() => null, t);
    expect(t.size()).toBe(0);
    expect(() => {
      a.hide();
      b.hide();
    }).not.toThrow();
    await flush();
  });

  it('hideAsync rejecting or throwing is swallowed, called once', async () => {
    const rejecting = mod({ hideAsync: vi.fn(async () => Promise.reject(new Error('no splash'))) });
    const throwing = mod({
      hideAsync: vi.fn(() => {
        throw new Error('sync');
      }),
    });
    const a = createSplashHandoff(() => rejecting, fakeTimers());
    const b = createSplashHandoff(() => throwing, fakeTimers());
    a.hide();
    b.hide();
    await flush();
    expect(rejecting.hideAsync).toHaveBeenCalledTimes(1);
    expect(throwing.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('preventAutoHideAsync rejecting still lets the splash hide', async () => {
    const m = mod({ preventAutoHideAsync: vi.fn(async () => Promise.reject(new Error('already hidden'))) });
    const h = createSplashHandoff(() => m, fakeTimers());
    h.hide();
    await flush();
    expect(m.hideAsync).toHaveBeenCalledTimes(1);
  });
});

describe('splashCanHideWithoutDom', () => {
  it('UpdateRequired, FirstLaunch (awaiting-content) and Recovery (native) release the splash', () => {
    expect(splashCanHideWithoutDom('pending', true)).toBe(true);
    expect(splashCanHideWithoutDom('dom', true)).toBe(true);
    expect(splashCanHideWithoutDom('awaiting-content', false)).toBe(true);
    expect(splashCanHideWithoutDom('native', false)).toBe(true);
  });

  it('pending and dom keep holding: the DOM path hides on its ready signal', () => {
    expect(splashCanHideWithoutDom('pending', false)).toBe(false);
    expect(splashCanHideWithoutDom('dom', false)).toBe(false);
  });
});
