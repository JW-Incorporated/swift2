import { SETTINGS_CATEGORY_DEFS } from '@swift2/shared';
import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-notifications';
import { PREFS_FIXTURE } from './bridge-host.test-kit';

const ctx = { signal: new AbortController().signal };
const deps = (over: Record<string, unknown> = {}) => ({
  status: vi.fn(),
  request: vi.fn(),
  register: vi.fn(),
  updatePrefs: vi.fn(),
  getPrefs: vi.fn().mockResolvedValue(PREFS_FIXTURE),
  savePrefs: vi.fn().mockResolvedValue(PREFS_FIXTURE),
  unregister: vi.fn().mockResolvedValue(undefined),
  registered: vi.fn().mockResolvedValue(true),
  ...over,
});
const FAILED = { ok: false, error: { code: 'failed', message: 'notification operation failed' } };
const CANCELLED = { ok: false, error: { code: 'cancelled', message: 'cancelled' } };

describe('savePrefs physical queue: deadline at execution, abort before the tail advances', () => {
  it('a queued write is not timed out while it waits behind a slow one', async () => {
    vi.useFakeTimers();
    try {
      const gates: Array<() => void> = [];
      const savePrefs = vi.fn(() => new Promise((resolve) => gates.push(() => resolve(PREFS_FIXTURE))));
      const h = createHandlers(deps({ savePrefs }) as never, { opTimeoutMs: 1000 });
      const a = h['notifications.savePrefs']({ settings: { dailyCap: 1 } }, ctx);
      const b = h['notifications.savePrefs']({ settings: { dailyCap: 2 } }, ctx);
      await vi.advanceTimersByTimeAsync(900);
      gates[0]();
      await vi.advanceTimersByTimeAsync(900); // b has waited 1800ms in total but only run 900ms
      expect(savePrefs).toHaveBeenCalledTimes(2);
      gates[1]();
      expect((await a).ok).toBe(true);
      expect((await b).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a timed-out write is aborted and settles before the next write starts (no overtaking)', async () => {
    vi.useFakeTimers();
    try {
      const events: string[] = [];
      const savePrefs = vi.fn((body: { settings?: { dailyCap?: number } }, signal?: AbortSignal) => {
        const n = body.settings?.dailyCap;
        events.push(`start:${n}`);
        return new Promise((resolve, reject) => {
          if (n === 1) {
            // slow: only settles when aborted, after a late tick
            signal?.addEventListener('abort', () => setTimeout(() => (events.push('aborted:1'), reject(new Error('aborted'))), 300));
          } else {
            resolve(PREFS_FIXTURE);
          }
        });
      });
      const h = createHandlers(deps({ savePrefs }) as never, { opTimeoutMs: 1000, abortGraceMs: 2000 });
      const a = h['notifications.savePrefs']({ settings: { dailyCap: 1 } }, ctx);
      const b = h['notifications.savePrefs']({ settings: { dailyCap: 2 } }, ctx);
      await vi.advanceTimersByTimeAsync(1000);
      expect(events).toEqual(['start:1']);
      await vi.advanceTimersByTimeAsync(400);
      expect(await a).toEqual(FAILED);
      expect((await b).ok).toBe(true);
      expect(events).toEqual(['start:1', 'aborted:1', 'start:2']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a request that ignores abort cannot wedge the queue past the grace period', async () => {
    vi.useFakeTimers();
    try {
      const savePrefs = vi.fn().mockImplementationOnce(() => new Promise(() => undefined)).mockResolvedValue(PREFS_FIXTURE);
      const h = createHandlers(deps({ savePrefs }) as never, { opTimeoutMs: 100, abortGraceMs: 200 });
      const a = h['notifications.savePrefs']({ settings: {} }, ctx);
      const b = h['notifications.savePrefs']({ settings: {} }, ctx);
      await vi.advanceTimersByTimeAsync(400);
      expect(await a).toEqual(FAILED);
      expect((await b).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a caller cancel aborts the running write and skips a queued one', async () => {
    const seen: AbortSignal[] = [];
    const savePrefs = vi.fn((_b: unknown, signal?: AbortSignal) => {
      seen.push(signal!);
      return new Promise((_r, reject) => signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    });
    const c1 = new AbortController();
    const c2 = new AbortController();
    const h = createHandlers(deps({ savePrefs }) as never);
    const a = h['notifications.savePrefs']({ settings: {} }, { signal: c1.signal });
    const b = h['notifications.savePrefs']({ settings: {} }, { signal: c2.signal });
    await vi.waitFor(() => expect(seen).toHaveLength(1));
    c2.abort();
    expect(await b).toEqual(CANCELLED);
    c1.abort();
    expect(await a).toEqual(CANCELLED);
    await new Promise((r) => setTimeout(r, 10));
    expect(savePrefs).toHaveBeenCalledTimes(1);
    expect(seen[0].aborted).toBe(true);
  });

  it('a full queue answers a fixed failure instead of growing', async () => {
    const savePrefs = vi.fn(() => new Promise(() => undefined));
    const h = createHandlers(deps({ savePrefs }) as never, { opTimeoutMs: 60_000 });
    const results = Array.from({ length: 18 }, () => h['notifications.savePrefs']({ settings: {} }, ctx));
    expect(await results[17]).toEqual(FAILED);
  });
});

describe('prefs responses are projected natively', () => {
  const row = SETTINGS_CATEGORY_DEFS[0].id;
  const dirty = {
    settings: { ...PREFS_FIXTURE.settings, deviceId: 'dev-secret', pushToken: 'ExponentPushToken[x]' },
    prefs: [{ category: row, cadence: 'off', deviceId: 'dev-secret' }],
    deviceId: 'dev-secret',
    pushToken: 'tok',
  };

  it('getPrefs and savePrefs drop every unknown key before resOk', async () => {
    const h = createHandlers(deps({ getPrefs: vi.fn().mockResolvedValue(dirty), savePrefs: vi.fn().mockResolvedValue(dirty) }) as never);
    for (const r of [await h['notifications.getPrefs']({}, ctx), await h['notifications.savePrefs']({}, ctx)]) {
      expect(JSON.stringify(r)).not.toMatch(/dev-secret|pushToken|ExponentPushToken|deviceId/);
      expect(r).toEqual({ ok: true, value: { settings: PREFS_FIXTURE.settings, prefs: [{ category: row, cadence: 'off' }] } });
    }
  });

  it('a malformed response fails with the fixed message', async () => {
    const h = createHandlers(deps({ getPrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }) }) as never);
    expect(await h['notifications.getPrefs']({}, ctx)).toEqual(FAILED);
  });
});

describe('notifications.registration', () => {
  it('answers a token-free boolean only', async () => {
    const h = createHandlers(deps({ registered: vi.fn().mockResolvedValue(false) }) as never);
    expect(await h['notifications.registration']({}, ctx)).toEqual({ ok: true, value: { registered: false } });
  });
});
