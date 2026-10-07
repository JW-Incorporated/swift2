// WP 2.12-D (AT RISK: built ahead of H4/D2, H3 and the iOS-1 gate). Notification
// settings page as a DOM overlay, imported directly from @swift2/ui (G10). Slot
// name follows the D2 convention (`overlay:<name>`); D2 decides what opens it.
import { register } from './instance';
import { SettingsPage } from './settings-page';

export const SETTINGS_SLICE = 'settings';

register({
  slice: SETTINGS_SLICE,
  slots: { 'overlay:settings': SettingsPage },
});
