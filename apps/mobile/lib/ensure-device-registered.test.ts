import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerDevice = vi.hoisted(() => vi.fn());
vi.mock('./push-registration', () => ({ registerDevice }));

import { ensureDeviceRegistered, resetEnsureDeviceRegisteredForTests } from './ensure-device-registered';

beforeEach(() => {
  registerDevice.mockReset();
  resetEnsureDeviceRegisteredForTests();
});

describe('ensureDeviceRegistered', () => {
  it('memoizes: concurrent and later callers share one registration', async () => {
    registerDevice.mockResolvedValue({ status: 'registered_no_token', deviceId: 'd1' });
    const [a, b] = await Promise.all([ensureDeviceRegistered(), ensureDeviceRegistered()]);
    expect([a, b]).toEqual(['d1', 'd1']);
    expect(await ensureDeviceRegistered()).toBe('d1');
    expect(registerDevice).toHaveBeenCalledTimes(1);
  });

  it('re-attempts after a failure', async () => {
    registerDevice.mockRejectedValueOnce(new Error('net'));
    await expect(ensureDeviceRegistered()).rejects.toThrow('net');
    registerDevice.mockResolvedValueOnce({ status: 'registered_no_token', deviceId: 'd2' });
    expect(await ensureDeviceRegistered()).toBe('d2');
    expect(registerDevice).toHaveBeenCalledTimes(2);
  });
});
