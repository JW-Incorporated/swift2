import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createAppHandlers } from './app-handlers';

const ctx = { signal: new AbortController().signal };

function fakeDeps() {
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
  };
  const fetchFake = vi.fn(async (..._a: unknown[]) => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
  const api = { fetch: fetchFake as unknown as typeof fetch, baseUrl: () => 'https://example.test' };
  return { ui, notifications, api, fetchFake };
}

describe('createAppHandlers', () => {
  it('exposes exactly the DOM commands except cancel', () => {
    const { ui, notifications, api } = fakeDeps();
    expect(Object.keys(createAppHandlers({ ui, notifications, api })).sort()).toEqual(
      [
        'api',
        'haptic',
        'navigate',
        'notifications.register',
        'notifications.request',
        'notifications.status',
        'notifications.updatePrefs',
        'openExternal',
        'share',
      ].sort(),
    );
  });

  it('routes each family to its own deps', async () => {
    const d = fakeDeps();
    const h = createAppHandlers({ ui: d.ui, notifications: d.notifications, api: d.api });
    expect(await h.navigate({ path: '/songs' } as never, ctx)).toEqual({ ok: true, value: null });
    expect(d.ui.navigate).toHaveBeenCalledWith('/songs', false);
    expect(await h.openExternal({ url: 'https://example.com/x' } as never, ctx)).toEqual({ ok: true, value: null });
    expect(d.ui.openURL).toHaveBeenCalledWith('https://example.com/x');
    expect(await h['notifications.status']({}, ctx)).toEqual({ ok: true, value: 'granted' });
    expect(d.notifications.status).toHaveBeenCalledTimes(1);
    const r = await h.api({ req: { method: 'POST', path: '/api/mood', body: '{}' } }, ctx);
    expect(r).toMatchObject({ ok: true, value: { status: 200 } });
    expect(d.fetchFake).toHaveBeenCalledTimes(1);
    expect((d.fetchFake.mock.calls as unknown as string[][])[0]?.[0]).toBe('https://example.test/api/mood');
  });

  it('keeps each family validation (no cross-talk)', async () => {
    const d = fakeDeps();
    const h = createAppHandlers({ ui: d.ui, notifications: d.notifications, api: d.api });
    expect(await h.navigate({ path: 'https://evil.test' } as never, ctx)).toMatchObject({ ok: false });
    expect(await h.api({ req: { method: 'GET', path: '/api/other' } } as never, ctx)).toMatchObject({ ok: false });
    expect(d.ui.navigate).not.toHaveBeenCalled();
    expect(d.fetchFake).not.toHaveBeenCalled();
  });

  it('passes notification opts through', async () => {
    const d = fakeDeps();
    d.notifications.status.mockReturnValue(new Promise(() => {}));
    const h = createAppHandlers({ ui: d.ui, notifications: d.notifications, api: d.api, notificationOpts: { opTimeoutMs: 5 } });
    expect(await h['notifications.status']({}, ctx)).toMatchObject({ ok: false });
  });

  it('is transport-neutral: composer source imports no host/transport', () => {
    const src = readFileSync(new URL('./app-handlers.ts', import.meta.url), 'utf8');
    const banned = ['expo/' + 'dom', 'Shared' + 'UiHost', 'transport-' + 'expo', "from 'react", "from 'expo"];
    for (const b of banned) expect(src).not.toContain(b);
  });
});
