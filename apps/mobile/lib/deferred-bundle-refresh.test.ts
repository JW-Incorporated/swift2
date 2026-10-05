import { describe, expect, it, vi } from 'vitest';
import { createDeferredRefresh } from './deferred-bundle-refresh';

function setup(load: () => Promise<unknown> = () => Promise.resolve({ ok: 1 })) {
  const queued: Array<() => void> = [];
  const deps = {
    load: vi.fn(load),
    runAfterInteractions: vi.fn((fn: () => void) => void queued.push(fn)),
    mark: vi.fn(),
    onLoaded: vi.fn(),
    onError: vi.fn(),
  };
  return { deps, queued, r: createDeferredRefresh(deps) };
}

describe('createDeferredRefresh', () => {
  it('with a cache: no load before ready, load after ready + interactions', async () => {
    const { deps, queued, r } = setup();
    r.start(true);
    expect(deps.load).not.toHaveBeenCalled();
    r.domReady();
    expect(deps.load).not.toHaveBeenCalled();
    queued[0]!();
    expect(deps.load).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(deps.onLoaded).toHaveBeenCalledWith({ ok: 1 });
    expect(deps.mark).toHaveBeenCalledWith('bundle-refresh-start');
    expect(deps.mark).toHaveBeenCalledWith('bundle-refresh-done');
  });

  it('without a cache: loads immediately, no ready needed', () => {
    const { deps, r } = setup();
    r.start(false);
    expect(deps.load).toHaveBeenCalledTimes(1);
    expect(deps.runAfterInteractions).not.toHaveBeenCalled();
  });

  it('ready is idempotent and a second ready does not reload', () => {
    const { queued, r } = setup();
    r.start(true);
    r.domReady();
    r.domReady();
    expect(queued.length).toBe(1);
  });

  it('reports errors', async () => {
    const { deps, r } = setup(() => Promise.reject(new Error('x')));
    r.start(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(deps.onError).toHaveBeenCalled();
    expect(deps.mark).toHaveBeenCalledWith('bundle-refresh-failed');
  });

  it('cancel before ready or before interactions prevents the load', () => {
    const { deps, queued, r } = setup();
    r.start(true);
    r.domReady();
    r.cancel();
    queued[0]!();
    expect(deps.load).not.toHaveBeenCalled();
  });
});

describe('SharedUiHost startup path', () => {
  it('never calls the bundle loader directly; only via the deferred refresh, released on DOM ready', async () => {
    const { readFileSync } = await import('node:fs');
    const host = readFileSync(new URL('../components/SharedUiHost.tsx', import.meta.url), 'utf8');
    const hook = readFileSync(new URL('./use-deferred-bundle-refresh.ts', import.meta.url), 'utf8');
    expect(host).not.toMatch(/loadContentBundle/);
    expect(host).toContain('domReady();');
    expect(hook).not.toContain('loadContentBundle()');
    expect(hook).toContain('load: loadContentBundle');
    expect(hook).toContain('refreshRef.current?.domReady()');
  });
});
