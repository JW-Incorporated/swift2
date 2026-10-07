// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, type HostNotifications } from '@swift2/ui';
import { WebNotificationSettings } from '@swift2/ui/reader/settings/WebNotificationSettings';
import { createWebAdapter } from '@/lib/host-adapter';

const base = createWebAdapter({ push() {}, replace() {} });

function notifications(unregister: () => Promise<void>, optOutPending?: () => Promise<boolean>): HostNotifications {
  return {
    status: async () => 'granted',
    request: async () => 'granted',
    register: async () => undefined,
    updatePrefs: async () => undefined,
    loadPrefs: async () => ({ settings: { masterEnabled: true }, prefs: [] }) as never,
    savePrefs: vi.fn(),
    unregister,
    registered: async () => true,
    optOutPending,
  };
}

describe('native opt-out while offline', () => {
  afterEach(cleanup);

  it('keeps the local opt-out and shows a non-blocking notice when the server write fails', async () => {
    const unregister = vi.fn().mockRejectedValue(new Error('offline'));
    render(
      <HostProvider adapter={{ ...base, notifications: notifications(unregister, async () => true) }}>
        <WebNotificationSettings vapidPublicKey={null} />
      </HostProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /turn off/i }));
    await waitFor(() => expect(screen.getByText(/finish turning off notifications when you.re back online/i)).toBeTruthy());
    expect(screen.getByRole('button', { name: /enable notifications/i })).toBeTruthy();
  });

  it('a failure with no durable marker (storage failure) is surfaced honestly: still on, error shown, no notice', async () => {
    render(
      <HostProvider adapter={{ ...base, notifications: notifications(vi.fn().mockRejectedValue(new Error('x')), async () => false) }}>
        <WebNotificationSettings vapidPublicKey={null} />
      </HostProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /turn off/i }));
    await waitFor(() => expect(screen.getByText(/could not turn off notifications/i)).toBeTruthy());
    expect(screen.queryByText(/back online/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /enable notifications/i })).toBeNull();
  });

  it('the notice is derived from the persisted flag on mount', async () => {
    render(
      <HostProvider adapter={{ ...base, notifications: { ...notifications(async () => undefined, async () => true), registered: async () => false } }}>
        <WebNotificationSettings vapidPublicKey={null} />
      </HostProvider>,
    );
    await waitFor(() => expect(screen.getByText(/back online/i)).toBeTruthy());
  });

  it('shows no notice when the server write succeeds', async () => {
    render(
      <HostProvider adapter={{ ...base, notifications: notifications(async () => undefined, async () => false) }}>
        <WebNotificationSettings vapidPublicKey={null} />
      </HostProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /turn off/i }));
    await screen.findByRole('button', { name: /enable notifications/i });
    expect(screen.queryByText(/back online/i)).toBeNull();
  });
});
