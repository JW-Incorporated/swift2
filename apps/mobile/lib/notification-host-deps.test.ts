import { describe, expect, it, vi } from 'vitest';
import { cadenceFor, createNotificationHostDeps, type NotificationPorts } from './notification-host-deps';

const ports = (over: Partial<NotificationPorts> = {}): NotificationPorts => ({
  getPermission: vi.fn().mockResolvedValue('undetermined'),
  requestPermission: vi.fn().mockResolvedValue('granted'),
  registerDevice: vi.fn().mockResolvedValue(undefined),
  savePrefs: vi.fn().mockResolvedValue(undefined),
  fetchPrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }),
  writePrefs: vi.fn().mockResolvedValue({ settings: {}, prefs: [] }),
  clearPushToken: vi.fn().mockResolvedValue(undefined),
  isRegistered: vi.fn().mockResolvedValue(true),
  ...over,
});

describe('notification host deps', () => {
  it('status reads the permission port', async () => {
    expect(await createNotificationHostDeps(ports()).status()).toBe('undetermined');
  });

  it('request prompts only when undecided', async () => {
    const p = ports();
    expect(await createNotificationHostDeps(p).request()).toBe('granted');
    expect(p.requestPermission).toHaveBeenCalledTimes(1);
    const denied = ports({ getPermission: vi.fn().mockResolvedValue('denied') });
    expect(await createNotificationHostDeps(denied).request()).toBe('denied');
    expect(denied.requestPermission).not.toHaveBeenCalled();
  });

  it('register delegates and propagates failure', async () => {
    const p = ports({ registerDevice: vi.fn().mockRejectedValue(new Error('boom')) });
    await expect(createNotificationHostDeps(p).register()).rejects.toThrow('boom');
  });

  it('updatePrefs maps booleans to cadences', async () => {
    const p = ports();
    await createNotificationHostDeps(p).updatePrefs({ song_drop: true, official_merch: false, lyric_of_day: true });
    const saved = (p.savePrefs as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(saved).toEqual([
      { category: 'song_drop', cadence: 'instant' },
      { category: 'official_merch', cadence: 'off' },
      { category: 'lyric_of_day', cadence: expect.not.stringMatching(/^(off|instant)$/) },
    ]);
  });

  it('rejects an unknown category without saving, and skips an empty update', async () => {
    const p = ports();
    await expect(createNotificationHostDeps(p).updatePrefs({ nope: true })).rejects.toThrow();
    await createNotificationHostDeps(p).updatePrefs({});
    expect(p.savePrefs).not.toHaveBeenCalled();
  });

  it('cadenceFor gives event categories "on"', () => {
    expect(cadenceFor('countdowns', true)).toBe('on');
  });
});
