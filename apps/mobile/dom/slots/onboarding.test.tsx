// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HostProvider, type HostAdapter, type HostNotifications } from '@swift2/ui';
import { ONBOARDING_PRESETS } from '@swift2/shared';
import { resetSlotsForTests, slots } from './instance';
import { OnboardingOverlay } from './onboarding-overlay';
import { resetSettingsOverlayForTests, settingsOverlay } from './settings-store';

afterEach(() => {
  cleanup();
  resetSlotsForTests();
  resetSettingsOverlayForTests();
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

const mount = (notifications?: HostNotifications) =>
  render(createElement(HostProvider, { adapter: { notifications } as unknown as HostAdapter, children: createElement(OnboardingOverlay) }));

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
