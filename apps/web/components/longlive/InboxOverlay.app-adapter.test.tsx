// @vitest-environment jsdom
// Inbox row taps through the REAL app adapter (createAppAdapter) and the real createNavigateDom; only the bridge
// client and the reader applier are recorders.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider, resOk, type HostNotifications } from '@swift2/ui';
import { createAppAdapter } from '../../../mobile/dom/bridge/app-adapter';
import { createNavigateDom } from '../../../mobile/dom/bridge/reader-nav';
import { InboxOverlay } from '../../../mobile/dom/slots/inbox-page';
import { inboxOverlay, resetInboxOverlayForTests } from '../../../mobile/dom/slots/inbox-store';
import { isNativeRoute } from '../../../mobile/dom/slots/routes';
import { resetSettingsOverlayForTests, settingsOverlay } from '../../../mobile/dom/slots/settings-store';

vi.mock('../../../mobile/node_modules/react', async () => await import('react'));
vi.mock('../../../mobile/node_modules/react/jsx-runtime', async () => await import('react/jsx-runtime'));
vi.mock('../../../mobile/node_modules/react/jsx-dev-runtime', async () => await import('react/jsx-dev-runtime'));

const ROW = { id: 'e1', category: 'new_release', tier: 1, title: 'A new drop', body: 'Out now', available_at: '2026-10-01T12:00:00Z' };

function mount(deepLink: string) {
  const call = vi.fn(async (..._a: unknown[]) => resOk(null));
  const apply = vi.fn(async (_search: string) => true);
  const adapter = createAppAdapter({
    client: { call: call as never },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute,
    navigateDom: createNavigateDom({ replaceUrl: vi.fn(), applier: () => apply, openNative: vi.fn(), setPath: vi.fn() }),
    getPath: () => '/',
    apiFetch: (async () => ({ status: 200, headers: {}, body: JSON.stringify({ events: [{ ...ROW, deep_link: deepLink }] }) })) as never,
    onBack: () => () => {},
  });
  render(
    <HostProvider adapter={{ ...adapter, notifications: {} as HostNotifications }}>
      <InboxOverlay />
    </HostProvider>,
  );
  return { call, apply };
}

async function tap() {
  act(() => inboxOverlay.open());
  fireEvent.click(await screen.findByRole('button', { name: /A new drop/ }));
}

afterEach(() => {
  resetInboxOverlayForTests();
  resetSettingsOverlayForTests();
  cleanup();
});

describe('inbox row through the real app adapter', () => {
  it('a native, non-host destination (/vault) opens externally; nothing navigates; the inbox stays open', async () => {
    const { call, apply } = mount('https://www.longlivets.com/vault');
    await tap();
    expect(call).toHaveBeenCalledWith('openExternal', { url: 'https://www.longlivets.com/vault' });
    expect(call.mock.calls.some((c) => c[0] === 'navigate')).toBe(false);
    expect(apply).not.toHaveBeenCalled();
    expect(inboxOverlay.isOpen()).toBe(true);
  });

  it('a composite ?song= reaches the reader applier with the exact trackKey', async () => {
    const key = 'era::1::Title';
    const { apply } = mount(`https://www.longlivets.com/?song=${encodeURIComponent(key)}`);
    await tap();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(new URLSearchParams(apply.mock.calls[0][0]).get('song')).toBe(key);
  });

  it('legacy ?screen=settings opens the settings overlay', async () => {
    mount('https://www.longlivets.com/?screen=settings');
    await tap();
    expect(settingsOverlay.isOpen()).toBe(true);
  });
});
