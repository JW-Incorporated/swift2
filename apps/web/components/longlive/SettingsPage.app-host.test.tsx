// @vitest-environment jsdom
// Render tests for the app DOM host's settings overlay (apps/mobile/dom/slots). They live here because only
// apps/web runs .tsx tests under the React copy the shared packages resolve.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider, type HostNotifications } from '@swift2/ui';
import { createWebAdapter } from '@/lib/host-adapter';
import { SettingsPage } from '../../../mobile/dom/slots/settings-page';
import { inboxOverlay, resetInboxOverlayForTests } from '../../../mobile/dom/slots/inbox-store';
import { resetSettingsOverlayForTests, settingsOverlay } from '../../../mobile/dom/slots/settings-store';

// apps/mobile resolves its own pinned React copy; send its specifiers to the one apps/web renders with.
vi.mock('../../../mobile/node_modules/react', async () => await import('react'));
vi.mock('../../../mobile/node_modules/react/jsx-runtime', async () => await import('react/jsx-runtime'));
vi.mock('../../../mobile/node_modules/react/jsx-dev-runtime', async () => await import('react/jsx-dev-runtime'));

const PREFS = {
  settings: { masterEnabled: true, snoozeUntil: null, dailyCap: 3, quietStart: 22, quietEnd: 8, digestHour: 9 },
  prefs: [],
};
const notifications = (status: 'granted' | 'undetermined' = 'granted'): HostNotifications => ({
  status: vi.fn().mockResolvedValue(status),
  request: vi.fn(),
  register: vi.fn(),
  updatePrefs: vi.fn(),
  loadPrefs: vi.fn().mockResolvedValue(PREFS),
  savePrefs: vi.fn().mockResolvedValue(PREFS),
  unregister: vi.fn(),
  registered: vi.fn().mockResolvedValue(true),
});

function mount(n: HostNotifications) {
  const navigate = vi.fn();
  const adapter = { ...createWebAdapter({ push() {}, replace() {} }), navigate, notifications: n };
  const view = render(
    <HostProvider adapter={adapter}>
      <SettingsPage />
    </HostProvider>,
  );
  return { navigate, view };
}

afterEach(() => {
  resetSettingsOverlayForTests();
  resetInboxOverlayForTests();
  cleanup();
});

describe('SettingsPage (app host overlay)', () => {
  it('renders null while closed and does not touch the host', () => {
    const n = notifications();
    const { view } = mount(n);
    expect(view.container.innerHTML).toBe('');
    expect(n.status).not.toHaveBeenCalled();
  });

  it('opens on /settings/notifications state, loads prefs through host.notifications, closes to null', async () => {
    const n = notifications();
    const { view } = mount(n);
    act(() => settingsOverlay.open());
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('switch')).toBeTruthy());
    expect(n.loadPrefs).toHaveBeenCalledWith();
    act(() => settingsOverlay.close());
    expect(view.container.innerHTML).toBe('');
  });

  it('re-reads the permission on each open', async () => {
    const n = notifications();
    mount(n);
    act(() => settingsOverlay.open());
    await waitFor(() => expect(n.status).toHaveBeenCalled());
    const first = vi.mocked(n.status).mock.calls.length;
    act(() => settingsOverlay.close());
    act(() => settingsOverlay.open());
    await waitFor(() => expect(vi.mocked(n.status).mock.calls.length).toBeGreaterThan(first));
  });

  it('granted permission without a registration (after turn-off) shows not subscribed, not the controls', async () => {
    const n = notifications('granted');
    n.registered = vi.fn().mockResolvedValue(false);
    mount(n);
    act(() => settingsOverlay.open());
    await screen.findByRole('button', { name: /enable notifications/i });
    expect(screen.queryByRole('switch')).toBeNull();
    expect(n.loadPrefs).not.toHaveBeenCalled();
  });

  it('returning from phone Settings (foreground) re-reads the permission', async () => {
    const n = notifications('granted');
    n.status = vi.fn().mockResolvedValueOnce('denied').mockResolvedValue('granted');
    mount(n);
    act(() => settingsOverlay.open());
    await screen.findByText(/Notifications are turned off for Long Live/);
    act(() => void window.dispatchEvent(new Event('focus')));
    await waitFor(() => expect(screen.getByRole('switch')).toBeTruthy());
  });

  it('hides the inbox row when the bridge does not answer', async () => {
    const n = notifications();
    n.status = vi.fn().mockRejectedValue(new Error('no bridge'));
    mount(n);
    act(() => settingsOverlay.open());
    await screen.findByRole('button', { name: /enable notifications/i });
    expect(screen.queryByRole('button', { name: 'Notification inbox' })).toBeNull();
  });

  it('shows the Inbox row (no About row) and it opens the DOM inbox overlay, not a native route', async () => {
    const { navigate } = mount(notifications());
    act(() => settingsOverlay.open());
    expect(screen.queryByRole('button', { name: 'About' })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Notification inbox' }));
    expect(inboxOverlay.isOpen()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
