// WP 2.12-D native-safe half: only /inbox stays a native modal. /settings, /settings/notifications render in
// the DOM overlay, and /settings/about is not claimed (no native About screen yet; see settings-native-rows.ts).
import { registerRoutes } from './routes-instance';

export const SETTINGS_ROUTES_SLICE = 'settings';

registerRoutes({
  slice: SETTINGS_ROUTES_SLICE,
  nativeRoutes: [{ id: 'settings:inbox', match: '/inbox' }],
});
