import type { SettingsDriver } from './driver';

/** Native (app) vs browser wording for the states that name where notifications live. */
export function settingsCopy(kind: SettingsDriver['kind'] | undefined) {
  const native = kind === 'native';
  return {
    unsupported: native
      ? 'Notifications aren’t available on this device.'
      : 'This browser doesn’t support web notifications. Get the Long Live app instead, or try a different browser.',
    turnOff: native ? 'Turn off notifications on this device' : 'Turn off web notifications for this browser',
  };
}
