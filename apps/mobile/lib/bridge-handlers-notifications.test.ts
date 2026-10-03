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
      { song_drop: 'yes' },
      { '': true },
      { unknown_key: true },
      { song_drop: true, bogus: true },
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

  it('accepts every known category key and rejects an unknown one', async () => {
    const d = deps();
    const h = createHandlers(d);
    const known = { song_drop: true, lyric_of_day: false, countdowns: true };
    expect(await h['notifications.updatePrefs']({ prefs: known }, ctx)).toEqual({ ok: true, value: null });
    expect(d.updatePrefs).toHaveBeenCalledWith(known);
    expect(await h['notifications.updatePrefs']({ prefs: { song_drop: true, nope: true } }, ctx)).toMatchObject({
      ok: false,
      error: { code: 'invalid' },
    });
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
      await h['notifications.updatePrefs']({ prefs: { song_drop: true } }, ctx),
    ];
    for (const r of results) {
      expect(r).toEqual({ ok: false, error: { code: 'failed', message: 'notification operation failed' } });
    }
  });

  it('skips native work when already aborted', async () => {
    const d = deps();
    const h = createHandlers(d);
    const ac = new AbortController();
    ac.abort();
    const c = { signal: ac.signal };
    for (const r of [
      await h['notifications.status']({}, c),
      await h['notifications.request']({}, c),
      await h['notifications.register']({}, c),
      await h['notifications.updatePrefs']({ prefs: { song_drop: true } }, c),
    ]) {
      expect(r).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    }
    expect(d.status).not.toHaveBeenCalled();
    expect(d.request).not.toHaveBeenCalled();
    expect(d.register).not.toHaveBeenCalled();
    expect(d.updatePrefs).not.toHaveBeenCalled();
  });

  it('discards a result when aborted mid-call', async () => {
    const d = deps();
    const ac = new AbortController();
    d.request.mockImplementation(async () => {
      ac.abort();
      return 'granted';
    });
    const r = await createHandlers(d)['notifications.request']({}, { signal: ac.signal });
    expect(r).toMatchObject({ ok: false, error: { code: 'cancelled' } });
  });

  it('serializes pref updates latest-wins: an older queued update never overwrites a newer one', async () => {
    const d = deps();
    const applied: Array<Record<string, boolean>> = [];
    let release!: () => void;
    d.updatePrefs.mockImplementationOnce(
      (p: Record<string, boolean>) =>
        new Promise<void>((r) => {
          release = () => (applied.push(p), r());
        }),
    );
    d.updatePrefs.mockImplementation(async (p: Record<string, boolean>) => void applied.push(p));
    const h = createHandlers(d);
    const one = h['notifications.updatePrefs']({ prefs: { song_drop: true } }, ctx);
    await new Promise((r) => setTimeout(r, 0));
    const two = h['notifications.updatePrefs']({ prefs: { song_drop: false } }, ctx);
    const three = h['notifications.updatePrefs']({ prefs: { song_drop: true, easter_egg: true } }, ctx);
    release();
    expect(await one).toEqual({ ok: true, value: null });
    expect(await two).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(await three).toEqual({ ok: true, value: null });
    expect(applied).toEqual([{ song_drop: true }, { song_drop: true, easter_egg: true }]);
  });

  it('an abort unblocks the next pref update behind a hung one', async () => {
    const d = deps();
    const ac = new AbortController();
    d.updatePrefs.mockImplementationOnce(() => new Promise<void>(() => {}));
    const h = createHandlers(d);
    const one = h['notifications.updatePrefs']({ prefs: { song_drop: true } }, { signal: ac.signal });
    await new Promise((r) => setTimeout(r, 0));
    const two = h['notifications.updatePrefs']({ prefs: { song_drop: false } }, ctx);
    ac.abort();
    expect(await one).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(await two).toEqual({ ok: true, value: null });
    expect(d.updatePrefs).toHaveBeenLastCalledWith({ song_drop: false });
  });

  it('a hung native call times out as failed and releases the chain', async () => {
    const d = deps();
    d.status.mockImplementation(() => new Promise<never>(() => {}));
    const r = await createHandlers(d, { opTimeoutMs: 10 })['notifications.status']({}, ctx);
    expect(r).toEqual({ ok: false, error: { code: 'failed', message: 'notification operation failed' } });
  });
});
