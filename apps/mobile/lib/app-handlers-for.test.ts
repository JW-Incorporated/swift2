import { describe, expect, it, vi } from 'vitest';
import { createAppHandlersFor, createUnwiredHandlers } from './app-handlers';

const ctx = { signal: new AbortController().signal };

function deps() {
  const ui = {
    navigate: vi.fn().mockResolvedValue(undefined),
    isNativeRoute: vi.fn().mockReturnValue(true),
    log: vi.fn(),
    openURL: vi.fn().mockResolvedValue(undefined),
    share: vi.fn().mockResolvedValue(undefined),
    haptic: vi.fn(),
  };
  const notifications = {
    status: vi.fn().mockResolvedValue('granted'),
    request: vi.fn().mockResolvedValue('denied'),
    register: vi.fn().mockResolvedValue(undefined),
    updatePrefs: vi.fn().mockResolvedValue(undefined),
    getPrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }),
    savePrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }),
    unregister: vi.fn().mockResolvedValue(undefined),
  };
  const fetchFake = vi.fn(async (..._a: unknown[]) => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
  const api = { fetch: fetchFake as unknown as typeof fetch, baseUrl: () => 'https://example.test' };
  return { ui, notifications, api, fetchFake };
}

describe('createAppHandlersFor (W2-I composition)', () => {
  it('has every command key exactly once, same set as the unwired map', () => {
    const d = deps();
    const full = createAppHandlersFor(vi.fn(), { ui: d.ui, api: d.api, notifications: d.notifications });
    const keys = Object.keys(full);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(Object.keys(createUnwiredHandlers(vi.fn())).sort());
  });

  it('routes each domain to its own handler and none to the others', async () => {
    const d = deps();
    const log = vi.fn();
    const h = createAppHandlersFor(log, { ui: d.ui, api: d.api, notifications: d.notifications });
    expect(await h.navigate({ path: '/songs' } as never, ctx)).toEqual({ ok: true, value: null });
    expect(await h['notifications.status']({}, ctx)).toEqual({ ok: true, value: 'granted' });
    expect(await h.api({ req: { method: 'POST', path: '/api/mood', body: '{}' } }, ctx)).toMatchObject({ ok: true });
    expect(d.ui.navigate).toHaveBeenCalledTimes(1);
    expect(d.notifications.status).toHaveBeenCalledTimes(1);
    expect(d.notifications.request).not.toHaveBeenCalled();
    expect(d.fetchFake).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  });

  it('non-wired domains still fail closed and log', async () => {
    const d = deps();
    const log = vi.fn();
    const h = createAppHandlersFor(log, { ui: d.ui });
    expect(await h.navigate({ path: '/songs' } as never, ctx)).toEqual({ ok: true, value: null });
    expect(await h['notifications.request']({}, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(await h.api({ req: { method: 'GET', path: '/api/x' } } as never, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(log).toHaveBeenCalledWith('bridge-unwired', 'notifications.request');
    expect(log).toHaveBeenCalledWith('bridge-unwired', 'api');
    expect(d.fetchFake).not.toHaveBeenCalled();
  });

  it('with nothing wired it is the unwired map', () => {
    expect(Object.keys(createAppHandlersFor(vi.fn(), {})).sort()).toEqual(Object.keys(createUnwiredHandlers(vi.fn())).sort());
  });
});
