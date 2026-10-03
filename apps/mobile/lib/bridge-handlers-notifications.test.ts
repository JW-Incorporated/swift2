import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-notifications';

const ctx = { signal: new AbortController().signal };
const deps = () => ({
  status: vi.fn().mockResolvedValue('granted'),
  request: vi.fn().mockResolvedValue('denied'),
  register: vi.fn().mockResolvedValue(undefined),
  updatePrefs: vi.fn().mockResolvedValue(undefined),
});

describe('notification bridge handlers', () => {
  it('status and request return the permission string only', async () => {
    const d = deps();
    const h = createHandlers(d);
    expect(await h['notifications.status']({}, ctx)).toEqual({ ok: true, value: 'granted' });
    expect(await h['notifications.request']({}, ctx)).toEqual({ ok: true, value: 'denied' });
  });

  it('register resolves null and never returns a token', async () => {
    const d = deps();
    d.register.mockResolvedValue('ExponentPushToken[secret]');
    const r = await createHandlers(d)['notifications.register']({}, ctx);
    expect(r).toEqual({ ok: true, value: null });
  });

  it('updatePrefs forwards a cleaned boolean map', async () => {
    const d = deps();
    const r = await createHandlers(d)['notifications.updatePrefs']({ prefs: { song_drop: false } }, ctx);
    expect(r).toEqual({ ok: true, value: null });
    expect(d.updatePrefs).toHaveBeenCalledWith({ song_drop: false });
  });

  it('updatePrefs answers invalid for bad prefs without calling native', async () => {
    const d = deps();
    const h = createHandlers(d);
    const bad = [
      undefined,
      null,
      [],
      { a: 'yes' },
      { '': true },
      { ['x'.repeat(65)]: true },
      Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`k${i}`, true])),
      JSON.parse('{"__proto__": true}'),
    ];
    for (const prefs of bad) {
      const r = await h['notifications.updatePrefs']({ prefs } as never, ctx);
      expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    }
    expect(await h['notifications.updatePrefs'](undefined as never, ctx)).toMatchObject({ ok: false });
    expect(d.updatePrefs).not.toHaveBeenCalled();
  });

  it('maps native failures to failed with a fixed message (no leak)', async () => {
    const d = deps();
    const boom = new Error('token ExponentPushToken[secret] rejected');
    d.status.mockRejectedValue(boom);
    d.request.mockRejectedValue(boom);
    d.register.mockRejectedValue(boom);
    d.updatePrefs.mockRejectedValue(boom);
    const h = createHandlers(d);
    const results = [
      await h['notifications.status']({}, ctx),
      await h['notifications.request']({}, ctx),
      await h['notifications.register']({}, ctx),
      await h['notifications.updatePrefs']({ prefs: { a: true } }, ctx),
    ];
    for (const r of results) {
      expect(r).toEqual({ ok: false, error: { code: 'failed', message: 'notification operation failed' } });
    }
  });
});
