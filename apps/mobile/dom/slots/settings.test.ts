import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNavigateDom } from '../bridge/reader-nav';
import { resetSlotsForTests, slots } from './instance';
import { inboxOverlay, resetInboxOverlayForTests } from './inbox-store';
import { isNativeRoute, resetRoutesForTests } from './routes-instance';
import { SettingsPage } from './settings-page';
import { isSettingsPath, resetSettingsOverlayForTests, settingsOverlay } from './settings-store';

afterEach(() => {
  resetSlotsForTests();
  resetRoutesForTests();
  resetSettingsOverlayForTests();
  resetInboxOverlayForTests();
});

describe('settings slice', () => {
  it('registers the settings overlay under the D2 slot name', async () => {
    await import('./settings');
    expect(slots()['overlay:settings']).toBe(SettingsPage);
  });

  it('no settings or inbox path is a native route (host.routes.ts registers none)', () => {
    for (const p of ['/inbox', '/settings', '/settings/notifications', '/settings/about']) expect(isNativeRoute(p)).toBe(false);
  });
});

describe('navigateDom opens and closes the overlay', () => {
  const nav = () => {
    const openNative = vi.fn();
    const replaceUrl = vi.fn();
    const apply = vi.fn().mockResolvedValue(true);
    return { openNative, replaceUrl, apply, go: createNavigateDom({ replaceUrl, applier: () => apply, openNative, setPath: vi.fn() }) };
  };

  it('/settings/notifications and /settings open the overlay in the DOM, never native', () => {
    for (const p of ['/settings/notifications', '/settings']) {
      resetSettingsOverlayForTests();
      const n = nav();
      n.go(p);
      expect(settingsOverlay.isOpen()).toBe(true);
      expect(n.openNative).not.toHaveBeenCalled();
      expect(isSettingsPath(p)).toBe(true);
    }
  });

  it('navigating back to a reader path closes it', () => {
    const n = nav();
    settingsOverlay.open();
    n.go('/');
    expect(settingsOverlay.isOpen()).toBe(false);
    expect(n.apply).toHaveBeenCalled();
  });

  it('/inbox opens the inbox over settings, never native; another path closes both', () => {
    const n = nav();
    settingsOverlay.open();
    n.go('/inbox');
    expect(inboxOverlay.isOpen()).toBe(true);
    expect(settingsOverlay.isOpen()).toBe(true);
    expect(n.openNative).not.toHaveBeenCalled();
    n.go('/');
    expect(inboxOverlay.isOpen()).toBe(false);
    expect(settingsOverlay.isOpen()).toBe(false);
  });

  it('open then close notifies subscribers once each', () => {
    const fn = vi.fn();
    settingsOverlay.subscribe(fn);
    settingsOverlay.open();
    settingsOverlay.open();
    settingsOverlay.close();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
