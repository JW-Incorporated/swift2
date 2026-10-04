// WP 2.12-D native-safe half: Inbox and About stay native modals (About keeps the
// Diagnostics entry, G8). /settings/notifications is NOT listed: it renders in the DOM.
import { registerRoutes } from './routes-instance';

export const SETTINGS_ROUTES_SLICE = 'settings';

registerRoutes({
  slice: SETTINGS_ROUTES_SLICE,
  nativeRoutes: [
    { id: 'settings:inbox', match: '/inbox' },
    { id: 'settings:about', match: '/settings/about' },
  ],
});
