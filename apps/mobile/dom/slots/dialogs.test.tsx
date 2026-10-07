// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

vi.mock('@swift2/ui/reader/settings/NotificationSettingsPage', () => ({
  NotificationSettingsPage: () => createElement('div', null, createElement('button', null, 'first'), createElement('button', null, 'last')),
}));
vi.mock('@swift2/ui/reader/settings/InboxPage', () => ({
  InboxPage: () => createElement('div', null, createElement('button', null, 'first'), createElement('button', null, 'last')),
}));

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HostProvider, type HostAdapter } from '@swift2/ui';
import { InboxOverlay } from './inbox-page';
import { inboxOverlay, resetInboxOverlayForTests } from './inbox-store';
import { SettingsPage } from './settings-page';
import { resetSettingsOverlayForTests, settingsOverlay } from './settings-store';

Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => document.body });

afterEach(() => {
  cleanup();
  resetSettingsOverlayForTests();
  resetInboxOverlayForTests();
});

const notifications = { status: vi.fn(async () => 'granted') };
const mount = () =>
  render(
    createElement(HostProvider, {
      adapter: { notifications } as unknown as HostAdapter,
      children: createElement('div', null, createElement('button', { id: 'opener' }, 'opener'), createElement(SettingsPage), createElement(InboxOverlay)),
    }),
  );

const cases = [
  { name: 'Notification settings', open: () => settingsOverlay.open(), isOpen: () => settingsOverlay.isOpen() },
  { name: 'Notification inbox', open: () => inboxOverlay.open(), isOpen: () => inboxOverlay.isOpen() },
];

describe.each(cases)('$name dialog', ({ name, open, isOpen }) => {
  it('moves focus in, wraps Tab, closes on Escape and restores focus', async () => {
    mount();
    const opener = document.getElementById('opener')!;
    opener.focus();
    act(() => open());
    await act(async () => void (await Promise.resolve()));
    const dialog = screen.getByRole('dialog', { name });
    const buttons = Array.from(dialog.querySelectorAll('button'));
    expect(dialog.contains(document.activeElement)).toBe(true);
    buttons[buttons.length - 1]!.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(isOpen()).toBe(false);
    expect(screen.queryByRole('dialog', { name })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
