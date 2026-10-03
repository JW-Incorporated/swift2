// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, type HostWebPush } from '@swift2/ui';
import { WebNotificationSettings } from '@swift2/ui/reader/settings/WebNotificationSettings';
import { createWebAdapter, webPushHost } from '@/lib/host-adapter';
import { TestHostProvider } from '@/lib/test-host';
import * as client from '@/lib/web-push-client';

const base = createWebAdapter({ push() {}, replace() {} });

describe('web adapter webPush (WP2.12 A2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('delegates to the existing web-push-client functions', () => {
    expect(webPushHost.isSupported).toBe(client.isWebPushSupported);
    expect(webPushHost.getDeviceId).toBe(client.getOrCreateWebDeviceId);
    expect(webPushHost.subscribe).toBe(client.subscribeToWebPush);
    expect(webPushHost.unsubscribe).toBe(client.unsubscribeFromWebPush);
    expect(base.webPush).toBe(webPushHost);
  });

  it('loads and saves prefs through the same /api/devices endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ a: 1 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ b: 2 })))
      .mockResolvedValueOnce(new Response('x', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await webPushHost.loadPrefs('d1')).toEqual({ a: 1 });
    expect(await webPushHost.savePrefs('d1', { settings: { masterEnabled: true } })).toEqual({ b: 2 });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/devices/d1/prefs');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/devices/d1/prefs', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ settings: { masterEnabled: true } }),
    });
    await expect(webPushHost.loadPrefs('d1')).rejects.toThrow('HTTP 500');
  });

  it('renders under TestHostProvider (unsupported in jsdom)', async () => {
    render(
      <TestHostProvider>
        <WebNotificationSettings vapidPublicKey={null} />
      </TestHostProvider>,
    );
    await waitFor(() => expect(screen.getByText(/doesn.t support web notifications/)).toBeTruthy());
  });

  it('subscribes through the host and shows the unsubscribed state afterwards', async () => {
    const webPush: HostWebPush = {
      isSupported: () => true,
      getDeviceId: () => 'dev',
      subscribe: vi.fn().mockResolvedValue({ status: 'permission_denied', deviceId: 'dev' }),
      unsubscribe: vi.fn().mockResolvedValue({ ok: true }),
      loadPrefs: vi.fn(),
      savePrefs: vi.fn(),
    };
    render(
      <HostProvider adapter={{ ...base, webPush }}>
        <WebNotificationSettings vapidPublicKey="KEY" />
      </HostProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /enable notifications/i }));
    await waitFor(() => expect(webPush.subscribe).toHaveBeenCalledWith('KEY'));
    await waitFor(() => expect(screen.getByText(/blocked for this site/)).toBeTruthy());
  });
});
