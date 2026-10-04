// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

vi.mock('@swift2/ui/reader/settings/NotificationSettingsPage', () => ({ NotificationSettingsPage: () => createElement('button', null, 'settings-btn') }));

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HostProvider, type HostAdapter, type HostNotifications } from '@swift2/ui';
import { ONBOARDING_PRESETS } from '@swift2/shared';
import { resetSlotsForTests, slots } from './instance';
import { OnboardingOverlay } from './onboarding-overlay';
import { onboardingOverlay, resetOnboardingForTests } from './onboarding-store';
import { SettingsPage } from './settings-page';
import { resetSettingsOverlayForTests, settingsOverlay } from './settings-store';

afterEach(() => {
  cleanup();
  resetSlotsForTests();
  resetSettingsOverlayForTests();
  resetOnboardingForTests();
});

const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

function fake(over: Partial<HostNotifications> = {}) {
  const calls: string[] = [];
  const n = {
    status: vi.fn(async () => 'undetermined'),
    request: vi.fn(async () => (calls.push('request'), 'granted')),
    register: vi.fn(async () => void calls.push('register')),
    updatePrefs: vi.fn(),
    loadPrefs: vi.fn(),
    savePrefs: vi.fn(async () => void calls.push('savePrefs')),
    unregister: vi.fn(),
    registered: vi.fn(),
    onboardingOffered: vi.fn(async () => false),
    markOnboardingOffered: vi.fn(async () => void calls.push('mark')),
    ...over,
  } as unknown as HostNotifications;
  return { n, calls };
}

const navigate = vi.fn();
const mount = (notifications?: HostNotifications, children = createElement(OnboardingOverlay)) =>
  render(createElement(HostProvider, { adapter: { notifications, navigate } as unknown as HostAdapter, children }));

describe('onboarding overlay (DOM push offer)', () => {
  it('registers under the overlay:onboarding slot', async () => {
    await import('./onboarding');
    expect(slots()['overlay:onboarding']).toBe(OnboardingOverlay);
  });

  it('shows once at the first settings open, not before and not again', async () => {
    const { n } = fake();
    mount(n);
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.getByRole('dialog', { name: 'Stay in the loop' })).toBeTruthy();
    fireEvent.click(screen.getByText('Not now'));
    await flush();
    act(() => (settingsOverlay.close(), settingsOverlay.open()));
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(n.status).toHaveBeenCalledTimes(1);
  });

  it('never shows on web (no host.notifications) or without the offered-flag capability', async () => {
    mount(undefined);
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    const { n } = fake({ onboardingOffered: undefined, markOnboardingOffered: undefined });
    mount(n);
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(n.status).not.toHaveBeenCalled();
  });

  it.each([['granted'], ['denied'], ['unsupported']])('never shows when permission is %s', async (status) => {
    const { n } = fake({ status: vi.fn(async () => status) as never });
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('never shows when already offered, or when the flag read fails', async () => {
    mount(fake({ onboardingOffered: vi.fn(async () => true) }).n);
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    resetSettingsOverlayForTests();
    resetOnboardingForTests();
    mount(fake({ onboardingOffered: vi.fn(async () => Promise.reject(new Error('x'))) }).n);
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('accepting a preset saves prefs, asks the OS, registers, marks offered, then closes', async () => {
    const { n, calls } = fake();
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    fireEvent.click(screen.getByText(ONBOARDING_PRESETS[1]!.title));
    await flush();
    expect(calls).toEqual(['savePrefs', 'request', 'register', 'mark']);
    expect(n.savePrefs).toHaveBeenCalledWith({ prefs: [...ONBOARDING_PRESETS[1]!.prefs] });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a denied OS answer keeps the prefs, skips register, still marks offered', async () => {
    const { n, calls } = fake({ request: vi.fn(async () => 'denied') as never });
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    fireEvent.click(screen.getByText(ONBOARDING_PRESETS[0]!.title));
    await flush();
    expect(calls).toEqual(['savePrefs', 'mark']);
    expect(n.register).not.toHaveBeenCalled();
  });

  it('a failure shows an error, does not mark offered, and keeps the offer open', async () => {
    const { n } = fake({ savePrefs: vi.fn(async () => Promise.reject(new Error('x'))) as never });
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    fireEvent.click(screen.getByText(ONBOARDING_PRESETS[0]!.title));
    await flush();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(n.markOnboardingOffered).not.toHaveBeenCalled();
    expect(n.request).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('Not now persists the flag without asking the OS', async () => {
    const { n } = fake();
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    fireEvent.click(screen.getByText('Not now'));
    await flush();
    expect(n.markOnboardingOffered).toHaveBeenCalledTimes(1);
    expect(n.request).not.toHaveBeenCalled();
    expect(n.savePrefs).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each([['Not now'], ['Customize']])('%s does not complete until the seen flag persists; the error is fixed and retryable', async (label) => {
    let fail = true;
    const { n } = fake({ markOnboardingOffered: vi.fn(async () => (fail ? Promise.reject(new Error('secret')) : undefined)) as never });
    navigate.mockClear();
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    fireEvent.click(screen.getByText(label));
    await flush();
    expect(screen.getByRole('alert').textContent).toBe("Couldn't save that. Try again.");
    expect(screen.getByRole('dialog', { name: 'Stay in the loop' })).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
    fail = false;
    fireEvent.click(screen.getByText(label));
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onboardingOverlay.phase()).toBe('done');
  });

  it('Customize marks seen AND opens notification settings; Not now only marks seen', async () => {
    navigate.mockClear();
    mount(fake().n);
    act(() => settingsOverlay.open());
    await flush();
    fireEvent.click(screen.getByText('Customize'));
    await flush();
    expect(navigate).toHaveBeenCalledWith('/settings/notifications');
    cleanup();
    resetOnboardingForTests();
    navigate.mockClear();
    mount(fake().n);
    await flush();
    fireEvent.click(screen.getByText('Not now'));
    await flush();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('closing Settings while the offer shows withdraws it, and reopening re-checks', async () => {
    const { n } = fake();
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() => settingsOverlay.close());
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.getByRole('dialog', { name: 'Stay in the loop' })).toBeTruthy();
  });

  it('a check cancelled by closing Settings does not skip the offer for the epoch, and never reads concurrently', async () => {
    let release!: (v: string) => void;
    const status = vi.fn(() => new Promise<string>((r) => (release = r)));
    const { n } = fake({ status: status as never });
    mount(n);
    act(() => settingsOverlay.open());
    await flush();
    act(() => (settingsOverlay.close(), settingsOverlay.open()));
    await flush();
    expect(status).toHaveBeenCalledTimes(1);
    act(() => settingsOverlay.close());
    await act(async () => release('undetermined'));
    await flush();
    expect(onboardingOverlay.phase()).toBe('idle');
    expect(screen.queryByRole('dialog')).toBeNull();
    status.mockImplementation(async () => 'undetermined');
    act(() => settingsOverlay.open());
    await flush();
    expect(screen.getByRole('dialog', { name: 'Stay in the loop' })).toBeTruthy();
    expect(status).toHaveBeenCalledTimes(2);
  });

  it('is a focus-trapped modal: focus moves in, Tab/Shift+Tab cycle, focus is restored, Settings is inert behind it', async () => {
    const { n } = fake();
    mount(n, createElement('div', null, createElement(SettingsPage), createElement('button', { id: 'opener' }, 'opener'), createElement(OnboardingOverlay)) as never);
    const opener = document.getElementById('opener')!;
    opener.focus();
    act(() => settingsOverlay.open());
    await flush();
    const dialog = screen.getByRole('dialog', { name: 'Stay in the loop' });
    const buttons = Array.from(dialog.querySelectorAll('button'));
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => document.body });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Notification settings', hidden: true }).hasAttribute('inert')).toBe(true);
    buttons[buttons.length - 1]!.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    fireEvent.click(screen.getByText('Not now'));
    await flush();
    expect(document.activeElement).toBe(opener);
    expect(screen.getByRole('dialog', { name: 'Notification settings' }).hasAttribute('inert')).toBe(false);
  });

  it('Customize only navigates if Settings is still open when the flag write resolves', async () => {
    for (const closeFirst of [true, false]) {
      cleanup();
      resetOnboardingForTests();
      resetSettingsOverlayForTests();
      navigate.mockClear();
      let release!: () => void;
      const { n } = fake({ markOnboardingOffered: vi.fn(() => new Promise<void>((r) => (release = r))) as never });
      mount(n);
      act(() => settingsOverlay.open());
      await flush();
      fireEvent.click(screen.getByText('Customize'));
      await flush();
      if (closeFirst) act(() => settingsOverlay.close());
      await act(async () => release());
      await flush();
      expect(navigate).toHaveBeenCalledTimes(closeFirst ? 0 : 1);
    }
  });

  // Structural guard: the only route to the native OnboardingScreen is NativeScreenRouter (App.tsx renders it only
  // for the native mount), so nothing the DOM host mounts may reference it. Deleted with the screen at WP5.2.
  it('the native onboarding screen is unreachable while the DOM host is mounted', () => {
    const root = resolve(__dirname, '../..');
    for (const f of ['components/DomHostMount.tsx', 'components/NativeOverlayHost.tsx', 'components/SharedUiHost.tsx', 'lib/use-native-overlay.ts']) {
      expect(readFileSync(resolve(root, f), 'utf8'), f).not.toMatch(/onboarding/i);
    }
    const app = readFileSync(resolve(root, 'App.tsx'), 'utf8');
    expect(app.indexOf('<DomHostMount')).toBeLessThan(app.indexOf('<NativeScreenRouter'));
    expect(app.slice(app.indexOf('<DomHostMount'), app.indexOf('<NativeScreenRouter'))).not.toMatch(/openSettings|onboarding/i);
  });
});
