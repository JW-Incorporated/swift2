// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, type HostNotifications, type HostWebPush, type NotificationStatus } from '@swift2/ui';
import { WebNotificationSettings } from '@swift2/ui/reader/settings/WebNotificationSettings';
import { APP_DENIED_HINT } from '@swift2/ui/reader/settings/lib/driver';
import { createWebAdapter } from '@/lib/host-adapter';

const base = createWebAdapter({ push() {}, replace() {} });
const WEB_DENIED = /Notifications are blocked for this site in your browser settings\. Allow them there, then reload this page\./;
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
    expect(app).toBe(web);
  });

  it('denied: identical except the driver-supplied hint', async () => {
    vi.stubGlobal('Notification', { permission: 'denied' });
    const web = await html({ ...base, webPush: webHost() }, () => screen.getByText(WEB_DENIED));
    const app = await html({ ...base, notifications: appHost('denied') }, () => screen.getByText(APP_DENIED_HINT));
    expect(app.replace(APP_DENIED_HINT, 'HINT')).toBe(web.replace(/Notifications are blocked[^<]*/, 'HINT'));
  });

  it('unsupported: an unsupported browser and an app reporting unsupported render the same', async () => {
    const unsupported = () => screen.getByText(UNSUPPORTED);
    const web = await html({ ...base, webPush: { ...webHost(), isSupported: () => false } }, unsupported);
    const app = await html({ ...base, notifications: appHost('unsupported') }, unsupported);
    expect(app).toBe(web);
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
