import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNavigateDom } from '../bridge/reader-nav';
import { resetSlotsForTests, register, slots } from './instance';
import { isNativeRoute, registerRoutes, resetRoutesForTests } from './routes-instance';
import { SETTINGS_NATIVE_ROWS } from './settings-native-rows';
import { SettingsPage } from './settings-page';
import { SETTINGS_SLICE } from './settings';
import { isSettingsPath, resetSettingsOverlayForTests, settingsOverlay } from './settings-store';

// Registers what settings.ts registers (the native /inbox route is host.routes.ts), against registries reset after each test.
function registerSettings() {
  register({ slice: SETTINGS_SLICE, slots: { 'overlay:settings': SettingsPage } });
  registerRoutes({ slice: 'host', nativeRoutes: [{ id: 'host:inbox', match: '/inbox' }] });
}

afterEach(() => {
  resetSlotsForTests();
  resetRoutesForTests();
  resetSettingsOverlayForTests();
});

describe('settings slice', () => {
  it('registers the settings overlay under the D2 slot name', async () => {
    await import('./settings');
    expect(slots()['overlay:settings']).toBe(SettingsPage);
  });

  it('lists only the Inbox row (no About under the app host)', () => {
    expect(SETTINGS_NATIVE_ROWS.map((r) => r.path)).toEqual(['/inbox']);
  });

  it('keeps /inbox native; /settings, /settings/notifications and /settings/about are not native', () => {
    registerSettings();
    expect(isNativeRoute('/inbox')).toBe(true);
    for (const p of ['/settings', '/settings/notifications', '/settings/about']) expect(isNativeRoute(p)).toBe(false);
  });

  it('every row path is a registered native route', () => {
    registerSettings();
    for (const row of SETTINGS_NATIVE_ROWS) expect(isNativeRoute(row.path)).toBe(true);
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

  it('open then close notifies subscribers once each', () => {
    const fn = vi.fn();
    settingsOverlay.subscribe(fn);
    settingsOverlay.open();
    settingsOverlay.open();
    settingsOverlay.close();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
