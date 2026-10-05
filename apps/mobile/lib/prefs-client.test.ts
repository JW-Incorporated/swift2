import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensure = vi.hoisted(() => vi.fn());
vi.mock('./ensure-device-registered', () => ({ ensureDeviceRegistered: ensure }));
vi.mock('./api-base', () => ({ apiBaseUrl: () => 'https://api.test' }));

import { fetchDevicePrefs, saveDevicePrefs } from './prefs-client';

const fetchMock = vi.fn();
beforeEach(() => {
  ensure.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('prefs-client waits for device registration', () => {
  it('holds the PUT until registration resolves, then succeeds', async () => {
    let done!: (id: string) => void;
    ensure.mockReturnValue(new Promise<string>((r) => (done = r)));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: 1 }) });
    const p = saveDevicePrefs({ prefs: [] });
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    done('dev-9');
    await expect(p).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/devices/dev-9/prefs');
  });

  it('rejects without any prefs request when registration fails', async () => {
    ensure.mockRejectedValue(new Error('devices/register: HTTP 500'));
    await expect(fetchDevicePrefs()).rejects.toThrow('devices/register');
    await expect(saveDevicePrefs({ prefs: [] })).rejects.toThrow('devices/register');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('already registered: one prefs request, no extra work', async () => {
    ensure.mockResolvedValue('dev-1');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    await fetchDevicePrefs();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
