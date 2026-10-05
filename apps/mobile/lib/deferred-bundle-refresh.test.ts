import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeferredRefresh, REFRESH_DEFER_TIMEOUT_MS } from './deferred-bundle-refresh';

function setup(load: () => Promise<unknown> = () => Promise.resolve({ ok: 1 })) {
  const tasks: Array<{ fn: () => void; cancelled: boolean }> = [];
  const deps = {
    load: vi.fn(load),
    runAfterInteractions: vi.fn((fn: () => void) => {
      const t = { fn, cancelled: false };
      tasks.push(t);
      return { cancel: () => void (t.cancelled = true) };
    }),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>),
    mark: vi.fn(),
    onLoaded: vi.fn(),
    onError: vi.fn(),
  };
  return { deps, tasks, r: createDeferredRefresh(deps) };
}

describe('createDeferredRefresh', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('with a cache: no load before ready; loads once interactions settle; marks + onLoaded', async () => {
    const { deps, tasks, r } = setup();
    r.start(true);
    expect(deps.load).not.toHaveBeenCalled();
    r.domReady();
    expect(deps.load).not.toHaveBeenCalled();
    tasks[0]!.fn();
    expect(deps.load).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(deps.onLoaded).toHaveBeenCalledWith({ ok: 1 });
    expect(deps.mark).toHaveBeenCalledWith('bundle-refresh-start');
    expect(deps.mark).toHaveBeenCalledWith('bundle-refresh-done');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('without a cache: loads immediately, no timer', () => {
    const { deps, r } = setup();
    r.start(false);
    expect(deps.load).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never ready: runs at the timeout', () => {
    const { deps, r } = setup();
    r.start(true);
    vi.advanceTimersByTime(REFRESH_DEFER_TIMEOUT_MS - 1);
    expect(deps.load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(deps.load).toHaveBeenCalledTimes(1);
  });

  it('ready but interactions never settle: timeout runs it and cancels the task', () => {
    const { deps, tasks, r } = setup();
    r.start(true);
    r.domReady();
    vi.advanceTimersByTime(REFRESH_DEFER_TIMEOUT_MS);
    expect(deps.load).toHaveBeenCalledTimes(1);
    expect(tasks[0]!.cancelled).toBe(true);
  });

  it('timeout/ready race and a late interaction callback load once', () => {
    const { deps, tasks, r } = setup();
    r.start(true);
    r.domReady();
    vi.advanceTimersByTime(REFRESH_DEFER_TIMEOUT_MS);
    tasks[0]!.fn();
    r.domReady();
    expect(deps.load).toHaveBeenCalledTimes(1);
  });

  it('repeated handshakes schedule one task and load once', () => {
    const { deps, tasks, r } = setup();
    r.start(true);
    r.domReady();
    r.domReady();
    r.domReady();
    expect(tasks.length).toBe(1);
    tasks[0]!.fn();
    r.domReady();
    expect(deps.load).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dispose before anything flushes the refresh (a poisoned cache is still replaced), once, no leaked timer', () => {
    const { deps, r } = setup();
    r.start(true);
    r.dispose();
    expect(deps.load).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    r.dispose();
    vi.advanceTimersByTime(REFRESH_DEFER_TIMEOUT_MS);
    expect(deps.load).toHaveBeenCalledTimes(1);
  });

  it('dispose before start does nothing', () => {
    const { deps, r } = setup();
    r.dispose();
    expect(deps.load).not.toHaveBeenCalled();
  });

  it('reports errors', async () => {
    const { deps, r } = setup(() => Promise.reject(new Error('x')));
    r.start(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(deps.onError).toHaveBeenCalled();
    expect(deps.mark).toHaveBeenCalledWith('bundle-refresh-failed');
  });
});

describe('SharedUiHost startup path', () => {
  it('never calls the bundle loader directly; only via the deferred refresh, released on DOM ready', async () => {
    const { readFileSync } = await import('node:fs');
    const host = readFileSync(new URL('../components/SharedUiHost.tsx', import.meta.url), 'utf8');
    const hook = readFileSync(new URL('./use-deferred-bundle-refresh.ts', import.meta.url), 'utf8');
    expect(host).not.toMatch(/loadContentBundle/);
    expect(host).toMatch(/domReady(Ref\.current)?\(\)/);
    expect(hook).not.toContain('loadContentBundle()');
    expect(hook).toContain('load: loadContentBundle');
  });
});
