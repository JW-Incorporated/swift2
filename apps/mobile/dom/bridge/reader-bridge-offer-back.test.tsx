// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, useState } from 'react';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

const h = vi.hoisted(() => ({ back: null as null | (() => 'handled' | 'exit'), closeItem: vi.fn(), item: null as string | null }));
vi.mock('@swift2/ui', async (orig) => ({ ...(await orig<typeof import('@swift2/ui')>()), useReader: () => ({}) }));
vi.mock('@swift2/ui/reader/settings/NotificationSettingsPage', () => ({ NotificationSettingsPage: () => createElement('p', null, 'settings') }));
vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppState: () => ({ mode: 'era', openItemId: h.item }),
  useAppActions: () => ({ closeItem: h.closeItem }),
}));
vi.mock('./reader-controls', () => ({
  useReaderControls: () => ({ registerBack: (fn: typeof h.back) => (h.back = fn), slottedModes: new Set(), lastSlotted: { current: null }, setApplier: () => {}, setRestorer: () => {} }),
}));

import { act, cleanup, render, screen } from '@testing-library/react';
import { HostProvider, type HostAdapter, type HostNotifications } from '@swift2/ui';
import { useBackDismiss } from '@swift2/ui/reader/lib/useBackDismiss';
import { ReaderBridge } from './reader-bridge';
import { OnboardingOverlay } from '../slots/onboarding-overlay';
import { SettingsPage } from '../slots/settings-page';
import { onboardingOverlay, resetOnboardingForTests } from '../slots/onboarding-store';
import { resetSettingsOverlayForTests, settingsOverlay } from '../slots/settings-store';

let setLate: (v: boolean) => void = () => {};
function LateOverlay() {
  const [open, setOpen] = useState(false);
  setLate = setOpen;
  useBackDismiss(open, () => setOpen(false));
  return open ? createElement('p', null, 'late-overlay') : null;
}

const notifications = {
  status: async () => 'undetermined',
  onboardingOffered: async () => false,
  markOnboardingOffered: async () => {},
} as unknown as HostNotifications;

const mount = () =>
  render(
    createElement(HostProvider, {
      adapter: { notifications, navigate: () => {} } as unknown as HostAdapter,
      children: createElement('div', null, createElement(ReaderBridge), createElement(SettingsPage), createElement(OnboardingOverlay), createElement(LateOverlay)),
    }),
  );
const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const press = () => {
  let r = '';
  act(() => void (r = h.back!()));
  return r;
};

afterEach(() => {
  cleanup();
  resetOnboardingForTests();
  resetSettingsOverlayForTests();
  h.item = null;
  h.closeItem.mockClear();
});

describe('one ordered back stack across settings, the push offer and the open item', () => {
  it('the offer (opened last) closes first, then Settings, then exit', async () => {
    mount();
    act(() => settingsOverlay.open());
    await flush();
    expect(onboardingOverlay.phase()).toBe('shown');
    expect(press()).toBe('handled');
    expect(onboardingOverlay.phase()).toBe('done');
    expect(settingsOverlay.isOpen()).toBe(true);
    expect(press()).toBe('handled');
    expect(settingsOverlay.isOpen()).toBe(false);
    expect(press()).toBe('exit');
  });

  it('a Back while the offer CTA is in flight is always handled and closes nothing', async () => {
    mount();
    act(() => settingsOverlay.open());
    await flush();
    act(() => onboardingOverlay.setBusy(true));
    for (let n = 0; n < 3; n++) expect(press()).toBe('handled');
    expect(onboardingOverlay.phase()).toBe('shown');
    expect(settingsOverlay.isOpen()).toBe(true);
    act(() => onboardingOverlay.setBusy(false));
    expect(press()).toBe('handled');
    expect(onboardingOverlay.phase()).toBe('done');
  });

  it('with an item open under Settings, Back closes Settings first and the item second', () => {
    h.item = 'x';
    mount();
    act(() => settingsOverlay.open());
    expect(screen.getByText('settings')).toBeTruthy();
    expect(press()).toBe('handled');
    expect(settingsOverlay.isOpen()).toBe(false);
    expect(h.closeItem).not.toHaveBeenCalled();
    expect(press()).toBe('handled');
    expect(h.closeItem).toHaveBeenCalledTimes(1);
  });

  it('an overlay registered after Settings closes first; Settings stays', () => {
    mount();
    act(() => settingsOverlay.open());
    act(() => setLate(true));
    expect(press()).toBe('handled');
    expect(screen.queryByText('late-overlay')).toBeNull();
    expect(settingsOverlay.isOpen()).toBe(true);
    expect(press()).toBe('handled');
    expect(settingsOverlay.isOpen()).toBe(false);
  });

  it('a rapid repeat Back answers handled twice with a single dismissal', () => {
    mount();
    act(() => settingsOverlay.open());
    act(() => setLate(true));
    let a = '';
    let b = '';
    act(() => {
      a = h.back!();
      b = h.back!();
    });
    expect([a, b]).toEqual(['handled', 'handled']);
    expect(screen.queryByText('late-overlay')).toBeNull();
    expect(settingsOverlay.isOpen()).toBe(true);
  });
});
