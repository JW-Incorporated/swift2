import { SETTINGS_CATEGORY_DEFS } from '@swift2/shared';
import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-notifications';
import { validateCommand } from './bridge-host-validate';
import { PREFS_FIXTURE } from './bridge-host.test-kit';
import { createNotificationHostDeps, type NotificationPorts } from './notification-host-deps';

const ctx = { signal: new AbortController().signal };
const deps = (over: Record<string, unknown> = {}) => ({
  status: vi.fn(),
  request: vi.fn(),
  register: vi.fn(),
  updatePrefs: vi.fn(),
  getPrefs: vi.fn().mockResolvedValue(PREFS_FIXTURE),
  savePrefs: vi.fn().mockResolvedValue(PREFS_FIXTURE),
  unregister: vi.fn().mockResolvedValue(undefined),
  ...over,
});
const update = { prefs: [{ category: SETTINGS_CATEGORY_DEFS[0].id, cadence: 'off' }] };

describe('notifications.getPrefs / savePrefs / unregister handlers', () => {
  it('getPrefs returns the prefs state and nothing else; unregister returns null', async () => {
    const h = createHandlers(deps() as never);
    expect(await h['notifications.getPrefs']({}, ctx)).toEqual({ ok: true, value: PREFS_FIXTURE });
    expect(await h['notifications.unregister']({}, ctx)).toEqual({ ok: true, value: null });
  });

  it('failures answer a fixed message, never the native text', async () => {
    const boom = vi.fn().mockRejectedValue(new Error('push token ExponentPushToken[abc] leaked'));
    const h = createHandlers(deps({ getPrefs: boom, savePrefs: boom, unregister: boom }) as never);
    for (const r of [await h['notifications.getPrefs']({}, ctx), await h['notifications.savePrefs']({ settings: {} }, ctx), await h['notifications.unregister']({}, ctx)]) {
      expect(r).toEqual({ ok: false, error: { code: 'failed', message: 'notification operation failed' } });
    }
  });

  it('savePrefs runs strictly FIFO, one at a time (no latest-wins skipping)', async () => {
    const order: string[] = [];
    const gates: Array<() => void> = [];
    const savePrefs = vi.fn((body: { settings?: { dailyCap?: number } }) => {
      order.push(`start:${body.settings?.dailyCap}`);
      return new Promise((resolve) => gates.push(() => (order.push(`end:${body.settings?.dailyCap}`), resolve(PREFS_FIXTURE))));
    });
    const h = createHandlers(deps({ savePrefs }) as never);
    const a = h['notifications.savePrefs']({ settings: { dailyCap: 1 } }, ctx);
    const b = h['notifications.savePrefs']({ settings: { dailyCap: 2 } }, ctx);
    const c = h['notifications.savePrefs']({ settings: { dailyCap: 3 } }, ctx);
    await vi.waitFor(() => expect(order).toEqual(['start:1']));
    gates[0]();
    await a;
    await vi.waitFor(() => expect(order).toContain('start:2'));
    gates[1]();
    await b;
    await vi.waitFor(() => expect(order).toContain('start:3'));
    gates[2]();
    await c;
    expect(order).toEqual(['start:1', 'end:1', 'start:2', 'end:2', 'start:3', 'end:3']);
  });

  it('a failed write does not wedge the queue', async () => {
    const savePrefs = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(PREFS_FIXTURE);
    const h = createHandlers(deps({ savePrefs }) as never);
    const first = await h['notifications.savePrefs']({ settings: {} }, ctx);
    const second = await h['notifications.savePrefs']({ settings: {} }, ctx);
    expect(first.ok).toBe(false);
    expect(second).toEqual({ ok: true, value: PREFS_FIXTURE });
  });

  it('rejects an invalid update without calling the dep', async () => {
    const d = deps();
    const h = createHandlers(d as never);
    const r = await h['notifications.savePrefs']({ prefs: [{ category: 'nope', cadence: 'daily' }] } as never, ctx);
    expect(r.ok).toBe(false);
    expect(d.savePrefs).not.toHaveBeenCalled();
  });
});

describe('notifications.savePrefs validator (bounded)', () => {
  const v = (p: unknown) => validateCommand('notifications.savePrefs', p as never);
  it('accepts the prefs-API shapes and strips nothing it allows', () => {
    expect(v({})).toEqual({});
    expect(v({ settings: { masterEnabled: false, dailyCap: 2, snoozeUntil: null } })).toEqual({ settings: { masterEnabled: false, dailyCap: 2, snoozeUntil: null } });
    expect(v(update)).toEqual(update);
  });
  it('rejects unknown keys, bad types, unknown categories, bad cadences and oversize lists', () => {
    expect(v({ deviceId: 'x' })).toBeNull();
    expect(v({ settings: { deviceId: 'x' } })).toBeNull();
    expect(v({ settings: { masterEnabled: 'yes' } })).toBeNull();
    expect(v({ settings: { dailyCap: Number.NaN } })).toBeNull();
    expect(v({ settings: [] })).toBeNull();
    expect(v({ prefs: [{ category: 'nope', cadence: 'daily' }] })).toBeNull();
    expect(v({ prefs: [{ category: SETTINGS_CATEGORY_DEFS[0].id, cadence: 'sometimes' }] })).toBeNull();
    expect(v({ prefs: [{ ...update.prefs[0], extra: 1 }] })).toBeNull();
    expect(v({ prefs: Array.from({ length: 65 }, () => update.prefs[0]) })).toBeNull();
  });
});

describe('notification host deps: prefs ports', () => {
  it('route getPrefs/savePrefs/unregister to the ports without an id in or out', async () => {
    const ports: NotificationPorts = {
      getPermission: vi.fn(),
      requestPermission: vi.fn(),
      registerDevice: vi.fn(),
      savePrefs: vi.fn(),
      fetchPrefs: vi.fn().mockResolvedValue(PREFS_FIXTURE),
      writePrefs: vi.fn().mockResolvedValue(PREFS_FIXTURE),
      clearPushToken: vi.fn().mockResolvedValue(undefined),
      isRegistered: vi.fn().mockResolvedValue(true),
    };
    const d = createNotificationHostDeps(ports);
    expect(await d.getPrefs()).toBe(PREFS_FIXTURE);
    expect(await d.savePrefs(update as never)).toBe(PREFS_FIXTURE);
    await d.unregister();
    expect(ports.writePrefs).toHaveBeenCalledWith(update, undefined);
    expect(ports.clearPushToken).toHaveBeenCalledTimes(1);
  });
});
