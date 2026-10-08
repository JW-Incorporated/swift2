import { describe, expect, it, vi } from 'vitest';
import type { HostNotifications, HostWebPush } from '../../../host/types';
import { APP_DENIED_HINT, fromNotifications, fromWebPush, selectDriver } from './driver';

const PREFS = { settings: { masterEnabled: true, snoozeUntil: null, dailyCap: 3, quietStart: 22, quietEnd: 8, digestHour: 9 }, prefs: [] };
const notif = (over: Partial<HostNotifications> = {}): HostNotifications => ({
  status: vi.fn().mockResolvedValue('granted'),
  request: vi.fn().mockResolvedValue('granted'),
  register: vi.fn().mockResolvedValue(undefined),
  updatePrefs: vi.fn(),
  loadPrefs: vi.fn().mockResolvedValue(PREFS),
  savePrefs: vi.fn().mockResolvedValue(PREFS),
  unregister: vi.fn().mockResolvedValue(undefined),
  registered: vi.fn().mockResolvedValue(true),
  ...over,
});
const webPush = (over: Partial<HostWebPush> = {}): HostWebPush => ({
  isSupported: () => true,
  getDeviceId: () => 'd',
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  loadPrefs: vi.fn(),
  savePrefs: vi.fn(),
  ...over,
});

describe('fromNotifications', () => {
  it('maps status to a driver permission', async () => {
    for (const [s, p] of [['granted', 'granted'], ['denied', 'denied'], ['undetermined', 'default'], ['unsupported', 'unsupported']] as const) {
      expect(await fromNotifications(notif({ status: vi.fn().mockResolvedValue(s) })).permission()).toBe(p);
    }
  });

  it('subscribe: granted registers; denied and unsupported do not', async () => {
    const n = notif();
    expect(await fromNotifications(n).subscribe()).toEqual({ status: 'subscribed' });
    expect(n.register).toHaveBeenCalledTimes(1);
    const d = notif({ request: vi.fn().mockResolvedValue('denied') });
    expect(await fromNotifications(d).subscribe()).toEqual({ status: 'permission_denied' });
    expect(d.register).not.toHaveBeenCalled();
    expect(await fromNotifications(notif({ request: vi.fn().mockResolvedValue('unsupported') })).subscribe()).toEqual({ status: 'unsupported' });
  });

  it('failures surface fixed text only, never the native message', async () => {
    const boom = vi.fn().mockRejectedValue(new Error('token abc123 leaked'));
    const d = fromNotifications(notif({ register: boom, loadPrefs: boom, savePrefs: boom, unregister: boom }));
    expect(await d.subscribe()).toEqual({ status: 'error', error: 'Could not enable notifications. Try again.' });
    await expect(d.loadPrefs()).rejects.toThrow(/^Could not load your settings\.$/);
    await expect(d.savePrefs({})).rejects.toThrow(/^Could not save your settings\.$/);
    expect(await d.unsubscribe()).toEqual({ ok: false, error: 'Could not turn off notifications.' });
  });

  it('carries the app denied hint; the web driver has none', () => {
    expect(fromNotifications(notif()).deniedHint).toBe(APP_DENIED_HINT);
    expect(fromWebPush(webPush(), null).deniedHint).toBeUndefined();
  });
});

describe('fromWebPush keeps the device id in its closure', () => {
  it('uses the id from subscribe for later reads and writes', async () => {
    const web = webPush({
      getDeviceId: () => 'first',
      subscribe: vi.fn().mockResolvedValue({ status: 'subscribed', deviceId: 'second' }),
      loadPrefs: vi.fn().mockResolvedValue(PREFS),
      savePrefs: vi.fn().mockResolvedValue(PREFS),
    });
    const d = fromWebPush(web, 'KEY');
    expect(await d.subscribe()).toEqual({ status: 'subscribed' });
    expect(web.subscribe).toHaveBeenCalledWith('KEY');
    await d.loadPrefs();
    await d.savePrefs({ settings: {} });
    expect(web.loadPrefs).toHaveBeenCalledWith('second');
    expect(web.savePrefs).toHaveBeenCalledWith('second', { settings: {} });
  });
});

describe('selectDriver', () => {
  it('webPush, then notifications, then unsupported', () => {
    expect(selectDriver({ webPush: webPush(), notifications: notif() }, null)?.deniedHint).toBeUndefined();
    expect(selectDriver({ notifications: notif() }, null)?.deniedHint).toBe(APP_DENIED_HINT);
    expect(selectDriver({}, null)).toBeNull();
  });
});
