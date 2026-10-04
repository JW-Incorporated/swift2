import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { apiBaseUrl } from './api-base';
import { createAppHandlers, createLiveAppHandlers, createUnwiredHandlers, createWiredHandlers, mergeHandlerGroups } from './app-handlers';

const expoFetch = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ token: 'tok-1' as string | null, enabled: true, set: vi.fn() }));
vi.mock('./expo-fetch-deps', () => ({
  createExpoApiDeps: () => ({
    fetch: expoFetch,
    baseUrl: () => 'https://api.test',
    clownSession: session.enabled ? { get: async () => session.token, set: session.set } : undefined,
  }),
}));

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
    getPrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }),
    savePrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }),
    unregister: vi.fn().mockResolvedValue(undefined),
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
        'notifications.getPrefs',
        'notifications.savePrefs',
        'notifications.unregister',
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

  it('throws on a colliding handler key, naming the key and both sources', () => {
    const a = { navigate: () => 1 };
    const b = { navigate: () => 2, share: () => 3 };
    expect(() => mergeHandlerGroups([['ui', a], ['other', b]])).toThrow(/duplicate handler "navigate" \(from ui and other\)/);
    expect(Object.keys(mergeHandlerGroups([['ui', a], ['other', { share: () => 3 }]])).sort()).toEqual(['navigate', 'share']);
  });

  it('passes notification opts through', async () => {
    const d = fakeDeps();
    d.notifications.status.mockReturnValue(new Promise(() => {}));
    const h = createAppHandlers({ ui: d.ui, notifications: d.notifications, api: d.api, notificationOpts: { opTimeoutMs: 5 } });
    expect(await h['notifications.status']({}, ctx)).toMatchObject({ ok: false });
  });

  it('createWiredHandlers replaces only the ui entries of the unwired map', async () => {
    const d = fakeDeps();
    const wired = createWiredHandlers(vi.fn(), { ui: d.ui });
    const unwired = createUnwiredHandlers(vi.fn());
    expect(Object.keys(wired).sort()).toEqual(Object.keys(unwired).sort());
    expect(await wired.haptic({ kind: 'light' }, ctx)).toEqual({ ok: true, value: null });
    expect(d.ui.haptic).toHaveBeenCalledWith('light');
    expect(await wired.share({}, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(await wired.api({} as never, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(await wired['notifications.status']({}, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('is transport-neutral: composer source imports no host/transport', () => {
    const src = readFileSync(new URL('./app-handlers.ts', import.meta.url), 'utf8');
    const banned = ['expo/' + 'dom', 'Shared' + 'UiHost', 'transport-' + 'expo', "from 'react", "from 'expo"];
    for (const b of banned) expect(src).not.toContain(b);
  });
});

describe('createLiveAppHandlers (H2)', () => {
  const streamed = (text: string, headers: Record<string, string> = {}) =>
    new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }), { status: 200, headers });

  it('registers the real api handler over the expo/fetch deps and leaves the rest unwired', async () => {
    expoFetch.mockResolvedValueOnce(streamed('{"ok":true}'));
    const log = vi.fn();
    const h = createLiveAppHandlers(log) as unknown as Record<string, (p: unknown, c: typeof ctx) => Promise<unknown>>;
    const r = await h.api({ req: { method: 'POST', path: '/api/intake', body: '{}' } }, ctx);
    expect(r).toMatchObject({ ok: true, value: { status: 200, body: '{"ok":true}' } });
    expect(expoFetch.mock.calls[0][0]).toBe(`${apiBaseUrl()}/api/intake`);
    expect(await h.api({ req: { method: 'POST', path: '/api/devices/register' } }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(await h.haptic({ kind: 'light' }, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(log).toHaveBeenCalledWith('bridge-unwired', 'haptic');
  });

  it('attaches the native clown session and persists a refreshed one', async () => {
    expoFetch.mockResolvedValueOnce(streamed('hi', { 'x-clown-session': 'tok-2' }));
    const h = createLiveAppHandlers(vi.fn()) as unknown as Record<string, (p: unknown, c: typeof ctx) => Promise<unknown>>;
    await h.api({ req: { method: 'POST', path: '/api/clown', body: '{}' } }, ctx);
    expect(expoFetch.mock.calls.at(-1)?.[1].headers.authorization).toBe('Bearer tok-1');
    expect(session.set).toHaveBeenCalledWith('tok-2');
  });
  it('works when the expo deps carry no clownSession (no authorization, nothing persisted)', async () => {
    session.enabled = false;
    try {
      expoFetch.mockResolvedValueOnce(streamed('hi', { 'x-clown-session': 'tok-3' }));
      const h = createLiveAppHandlers(vi.fn()) as unknown as Record<string, (p: unknown, c: typeof ctx) => Promise<unknown>>;
      const r = await h.api({ req: { method: 'POST', path: '/api/clown', body: '{}' } }, ctx);
      expect(r).toMatchObject({ ok: true, value: { status: 200, body: 'hi' } });
      expect(expoFetch.mock.calls.at(-1)?.[1].headers.authorization).toBeUndefined();
      expect(session.set).not.toHaveBeenCalledWith('tok-3');
    } finally {
      session.enabled = true;
    }
  });
});
