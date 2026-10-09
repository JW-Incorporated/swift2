// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, type HostNotifications, type HostWebPush, type NotificationStatus } from '@swift2/ui';
import { WebNotificationSettings } from '@swift2/ui/reader/settings/WebNotificationSettings';
import { APP_DENIED_HINT } from '@swift2/ui/reader/settings/lib/driver';
import { createWebAdapter } from '@/lib/host-adapter';

const base = createWebAdapter({ push() {}, replace() {} });
const WEB_DENIED = /Notifications are blocked for this site in your browser settings\. Allow them there, then reload this page\./;
const NATIVE_UNSUPPORTED = /Notifications aren.t available on this device/;
const UNSUPPORTED = /support web notifications/;
const PREFS = {
  settings: { masterEnabled: true, snoozeUntil: null, dailyCap: 3, quietStart: 22, quietEnd: 8, digestHour: 9 },
  prefs: [],
};

const webHost = (): HostWebPush => ({
  isSupported: () => true,
  getDeviceId: () => 'dev-1',
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  loadPrefs: vi.fn().mockResolvedValue(PREFS),
  savePrefs: vi.fn().mockResolvedValue(PREFS),
});
const appHost = (status: NotificationStatus): HostNotifications => ({
  status: vi.fn().mockResolvedValue(status),
  request: vi.fn(),
  register: vi.fn(),
  updatePrefs: vi.fn(),
  loadPrefs: vi.fn().mockResolvedValue(PREFS),
  savePrefs: vi.fn().mockResolvedValue(PREFS),
  unregister: vi.fn(),
  registered: vi.fn().mockResolvedValue(true),
});

async function html(adapter: Parameters<typeof HostProvider>[0]['adapter'], settled: () => unknown) {
  const { container, unmount } = render(
    <HostProvider adapter={adapter}>
      <WebNotificationSettings vapidPublicKey={null} />
    </HostProvider>,
  );
  await waitFor(settled);
  const out = container.innerHTML;
  unmount();
  return out;
}

describe('WebNotificationSettings: web driver vs app driver (same markup per state)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('not subscribed (default / undetermined)', async () => {
    vi.stubGlobal('Notification', { permission: 'default' });
    const enable = () => screen.getByRole('button', { name: /enable notifications/i });
    const web = await html({ ...base, webPush: webHost() }, enable);
    const app = await html({ ...base, notifications: appHost('undetermined') }, enable);
    expect(app).toBe(web);
  });

  it('subscribed with prefs loaded', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    const loaded = () => screen.getByRole('switch');
    const web = await html({ ...base, webPush: webHost() }, loaded);
    const app = await html({ ...base, notifications: appHost('granted') }, loaded);
    expect(app.replace('Turn off notifications on this device', 'X')).toBe(web.replace('Turn off web notifications for this browser', 'X'));
  });

  it('denied: identical except the driver-supplied hint', async () => {
    vi.stubGlobal('Notification', { permission: 'denied' });
    const web = await html({ ...base, webPush: webHost() }, () => screen.getByText(WEB_DENIED));
    const app = await html({ ...base, notifications: appHost('denied') }, () => screen.getByText(APP_DENIED_HINT));
    expect(app.replace(APP_DENIED_HINT, 'HINT')).toBe(web.replace(/Notifications are blocked[^<]*/, 'HINT'));
  });

  it('unsupported: browser keeps website copy; app shows device copy and no app-download nudge', async () => {
    const web = await html({ ...base, webPush: { ...webHost(), isSupported: () => false } }, () => screen.getByText(UNSUPPORTED));
    expect(web).toContain('Get the Long Live app');
    const app = await html({ ...base, notifications: appHost('unsupported') }, () => screen.getByText(NATIVE_UNSUPPORTED));
    expect(app).not.toContain('Get the Long Live app');
    expect(app).not.toContain('browser');
  });

  it('subscribed: turn-off action is per-driver', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    await html({ ...base, webPush: webHost() }, () => screen.getByRole('button', { name: 'Turn off web notifications for this browser' }));
    await html({ ...base, notifications: appHost('granted') }, () => screen.getByRole('button', { name: 'Turn off notifications on this device' }));
  });

  it('unsubscribed (app): shows the enable action, not the turn-off one', async () => {
    await html({ ...base, notifications: appHost('undetermined') }, () => screen.getByRole('button', { name: /enable notifications/i }));
    expect(screen.queryByText(/Turn off/)).toBeNull();
  });

  it('a host with neither webPush nor notifications is unsupported', async () => {
    const out = await html(base, () => screen.getByText(UNSUPPORTED));
    expect(out).toContain('support web notifications');
  });

  it('webPush wins when a host supplies both', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    const web = webHost();
    const app = appHost('granted');
    await html({ ...base, webPush: web, notifications: app }, () => screen.getByRole('switch'));
    expect(web.loadPrefs).toHaveBeenCalledWith('dev-1');
    expect(app.loadPrefs).not.toHaveBeenCalled();
  });

  it('the app path hands no device id to the host calls', async () => {
    const app = appHost('granted');
    await html({ ...base, notifications: app }, () => screen.getByRole('switch'));
    expect(app.loadPrefs).toHaveBeenCalledWith();
  });
});
