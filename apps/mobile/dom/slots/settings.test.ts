import { describe, expect, it } from 'vitest';
import { slots } from './instance';
import { isNativeRoute } from './routes-instance';
import { SETTINGS_NATIVE_ROWS } from './settings-native-rows';
import { SettingsPage } from './settings-page';
import './settings';
import './settings.routes';

describe('settings slice', () => {
  it('registers the settings overlay', () => {
    expect(slots()['overlay:settings']).toBe(SettingsPage);
  });

  it('keeps /inbox and /settings/about native, notification settings in the DOM', () => {
    expect(isNativeRoute('/inbox')).toBe(true);
    expect(isNativeRoute('/settings/about')).toBe(true);
    expect(isNativeRoute('/settings/notifications')).toBe(false);
  });

  it('every settings row path is a registered native route', () => {
    for (const row of SETTINGS_NATIVE_ROWS) expect(isNativeRoute(row.path)).toBe(true);
  });
});
