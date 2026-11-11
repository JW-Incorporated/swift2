import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ os: 'android', fail: false, setChannel: vi.fn() }));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return h.os;
    },
  },
}));
vi.mock('expo-notifications', () => ({
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  setNotificationChannelAsync: (...a: unknown[]) => (h.fail ? Promise.reject(new Error('boom')) : h.setChannel(...a)),
}));

import { registerNotificationChannelsAtStartup } from './notification-channels';

describe('registerNotificationChannelsAtStartup', () => {
  beforeEach(() => {
    h.fail = false;
    h.setChannel.mockReset().mockResolvedValue(undefined);
  });

  it('creates the channels on android', async () => {
    h.os = 'android';
    registerNotificationChannelsAtStartup();
    await vi.waitFor(() => expect(h.setChannel).toHaveBeenCalled());
  });

  it('does nothing on ios', async () => {
    h.os = 'ios';
    registerNotificationChannelsAtStartup();
    await Promise.resolve();
    expect(h.setChannel).not.toHaveBeenCalled();
  });

  it('swallows a channel failure', async () => {
    h.os = 'android';
    h.fail = true;
    expect(() => registerNotificationChannelsAtStartup()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});
