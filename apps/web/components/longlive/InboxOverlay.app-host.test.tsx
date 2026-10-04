// @vitest-environment jsdom
// Render tests for the app DOM host's inbox overlay (apps/mobile/dom/slots/inbox-page.tsx, packages/ui InboxPage).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider, type HostNotifications } from '@swift2/ui';
import { createWebAdapter } from '@/lib/host-adapter';
import { InboxOverlay } from '../../../mobile/dom/slots/inbox-page';
import { inboxOverlay, resetInboxOverlayForTests } from '../../../mobile/dom/slots/inbox-store';

vi.mock('../../../mobile/node_modules/react', async () => await import('react'));
vi.mock('../../../mobile/node_modules/react/jsx-runtime', async () => await import('react/jsx-runtime'));
vi.mock('../../../mobile/node_modules/react/jsx-dev-runtime', async () => await import('react/jsx-dev-runtime'));

const ROW = { id: 'e1', category: 'new_release', tier: 1, title: 'A new drop', body: 'Out now', deep_link: 'https://www.longlivets.com/?item=abc', available_at: '2026-10-01T12:00:00Z' };
const notifications = {} as HostNotifications;

function mount(opts: { host?: HostNotifications; body?: unknown; status?: number }) {
  const navigate = vi.fn();
  const apiFetch = vi.fn().mockResolvedValue({ status: opts.status ?? 200, headers: {}, body: JSON.stringify(opts.body ?? { events: [ROW] }) });
  const adapter = { ...createWebAdapter({ push() {}, replace() {} }), navigate, apiFetch, notifications: opts.host };
  const view = render(
    <HostProvider adapter={adapter}>
      <InboxOverlay />
    </HostProvider>,
  );
  return { navigate, apiFetch, view };
}

afterEach(() => {
  resetInboxOverlayForTests();
  cleanup();
});

describe('InboxOverlay (app host)', () => {
  it('renders null while closed and never fetches', () => {
    const { view, apiFetch } = mount({ host: notifications });
    expect(view.container.innerHTML).toBe('');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('renders null without the notifications capability, even when open', () => {
    const { view, apiFetch } = mount({});
    act(() => inboxOverlay.open());
    expect(view.container.innerHTML).toBe('');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('loads the feed through host.apiFetch (GET) and a row navigates to its deep link (reader apply closes the inbox)', async () => {
    const { navigate, apiFetch } = mount({ host: notifications });
    act(() => inboxOverlay.open());
    fireEvent.click(await screen.findByRole('button', { name: /A new drop/ }));
    expect(apiFetch.mock.calls[0][0]).toMatchObject({ method: 'GET', path: '/api/notifications/inbox' });
    expect(inboxOverlay.isOpen()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/?item=abc');
  });

  it.each([
    ['https://longlivets.com/vault#x', '/vault#x'],
    ['/?item=rel', '/?item=rel'],
  ])('canonicalizes same-site link %s to %s', async (link, expected) => {
    const { navigate } = mount({ host: notifications, body: { events: [{ ...ROW, deep_link: link }] } });
    act(() => inboxOverlay.open());
    fireEvent.click(await screen.findByRole('button', { name: /A new drop/ }));
    expect(navigate).toHaveBeenCalledWith(expected);
    expect(inboxOverlay.isOpen()).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,hi',
    'https://evil.example/?song=abc',
    'https://www.longlivets.com.evil.example/',
    'http://www.longlivets.com/?song=abc',
    '//evil.example/x',
  ])('refuses hostile link %s: no navigation, inbox stays open', async (link) => {
    const { navigate } = mount({ host: notifications, body: { events: [{ ...ROW, deep_link: link }] } });
    act(() => inboxOverlay.open());
    fireEvent.click(await screen.findByRole('button', { name: /A new drop/ }));
    expect(navigate).not.toHaveBeenCalled();
    expect(inboxOverlay.isOpen()).toBe(true);
  });

  it('moves focus into the dialog, closes on Escape and restores focus', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    mount({ host: notifications });
    act(() => inboxOverlay.open());
    await screen.findByRole('button', { name: /A new drop/ });
    const dialog = screen.getByRole('dialog', { name: 'Notification inbox' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    fireEvent.keyDown(screen.getByRole('button', { name: /A new drop/ }), { key: 'Escape' });
    window.removeEventListener('keydown', spy);
    expect(spy).not.toHaveBeenCalled();
    expect(inboxOverlay.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('wraps Tab inside the dialog', async () => {
    mount({ host: notifications });
    act(() => inboxOverlay.open());
    const row = await screen.findByRole('button', { name: /A new drop/ });
    row.focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('shows the empty state, and Back closes', async () => {
    mount({ host: notifications, body: { events: [] } });
    act(() => inboxOverlay.open());
    await screen.findByText(/Nothing here yet/);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(inboxOverlay.isOpen()).toBe(false);
  });

  it('shows an alert with Retry when the request fails', async () => {
    mount({ host: notifications, status: 500 });
    act(() => inboxOverlay.open());
    expect((await screen.findByRole('alert')).textContent).toMatch(/HTTP 500/);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
