// @vitest-environment jsdom
// Notification tap -> DOM inbox, end to end through the real pieces: tap gate -> queue -> (bridge-shaped host)
// -> navigate subscriber -> InboxOverlay; plus the native fallback, and Settings going inert under the inbox.
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider, type HostNotifications } from '@swift2/ui';
import { createWebAdapter } from '@/lib/host-adapter';
import { createTapGate, type TapHost } from '../../../mobile/lib/notification-tap-gate';
import { applyNavigateEvent } from '../../../mobile/dom/bridge/navigate-subscriber';
import { InboxOverlay } from '../../../mobile/dom/slots/inbox-page';
import { SettingsPage } from '../../../mobile/dom/slots/settings-page';
import { inboxOverlay, resetInboxOverlayForTests } from '../../../mobile/dom/slots/inbox-store';
import { resetSettingsOverlayForTests, settingsOverlay } from '../../../mobile/dom/slots/settings-store';

vi.mock('../../../mobile/node_modules/react', async () => await import('react'));
vi.mock('../../../mobile/node_modules/react/jsx-runtime', async () => await import('react/jsx-runtime'));
vi.mock('../../../mobile/node_modules/react/jsx-dev-runtime', async () => await import('react/jsx-dev-runtime'));

const PREFS = { settings: { masterEnabled: true, snoozeUntil: null, dailyCap: 3, quietStart: 22, quietEnd: 8, digestHour: 9 }, prefs: [] };
const notifications = {
  status: vi.fn().mockResolvedValue('granted'),
  loadPrefs: vi.fn().mockResolvedValue(PREFS),
  registered: vi.fn().mockResolvedValue(true),
} as unknown as HostNotifications;

function mountOverlays() {
  const apiFetch = vi.fn().mockResolvedValue({ status: 200, headers: {}, body: JSON.stringify({ events: [] }) });
  const adapter = { ...createWebAdapter({ push() {}, replace() {} }), apiFetch, notifications };
  return render(
    <HostProvider adapter={adapter}>
      <SettingsPage />
      <InboxOverlay />
    </HostProvider>,
  );
}

// A bridge-shaped host: emit delivers the navigate payload to the DOM subscriber and acks with its answer.
function domHost(seen: string[]): TapHost {
  const results = new Map<number, boolean>();
  let seq = 0;
  return {
    emit(_t, payload) {
      const n = ++seq;
      seen.push(payload.path as string);
      void applyNavigateEvent({ path: payload.path }, { replaceUrl() {}, apply: async () => false }).then((ok) => results.set(n, ok));
      return { epoch: 1, seq: n };
    },
    onAcked(ref, cb) {
      const t = setInterval(() => {
        if (results.has(ref.seq)) {
          clearInterval(t);
          cb(results.get(ref.seq)!);
        }
      }, 1);
      return () => clearInterval(t);
    },
  };
}

afterEach(() => {
  resetInboxOverlayForTests();
  resetSettingsOverlayForTests();
  cleanup();
});

describe.each([
  ['/inbox form', 'https://www.longlivets.com/inbox', '/inbox'],
  ['legacy ?current=inbox form', 'https://www.longlivets.com/?current=inbox', '/inbox'],
])('inbox notification tap, %s', (_n, deepLink, emitted) => {
  it('reaches the DOM inbox overlay through gate, queue and subscriber', async () => {
    mountOverlays();
    const seen: string[] = [];
    const gate = createTapGate({ siteUrl: 'https://www.longlivets.com' });
    expect(gate.enqueue({ id: 'n1', deepLink })).toBe('queued');
    await act(async () => {
      gate.bindHost(domHost(seen));
      await vi.waitFor(() => expect(gate.size()).toBe(0));
    });
    expect(seen).toEqual([emitted]);
    expect(inboxOverlay.isOpen()).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Notification inbox' })).toBeTruthy();
  });

  it('reaches the native inbox screen when the DOM host is not mounted', async () => {
    const go = vi.fn();
    const gate = createTapGate({ siteUrl: 'https://www.longlivets.com' });
    gate.setNativeNavigator(go);
    expect(gate.enqueue({ id: 'n2', deepLink })).toBe('queued');
    await vi.waitFor(() => expect(go).toHaveBeenCalled());
    expect(go).toHaveBeenCalledWith('https://www.longlivets.com/?current=inbox');
  });
});

describe('stacked dialogs', () => {
  it('makes Settings inert while the inbox is open and live again after', async () => {
    mountOverlays();
    act(() => settingsOverlay.open());
    const settings = await screen.findByRole('dialog', { name: 'Notification settings' });
    expect(settings.hasAttribute('inert')).toBe(false);
    act(() => inboxOverlay.open());
    expect(settings.hasAttribute('inert')).toBe(true);
    act(() => inboxOverlay.close());
    expect(settings.hasAttribute('inert')).toBe(false);
  });
});
