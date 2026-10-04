// WP 2.12-D: the settings rows that leave the DOM for a native modal. Paths must
// match `settings.routes.ts` (a test pins that) so navigate() presents natively.
export const SETTINGS_NATIVE_ROWS = [
  { id: 'inbox', label: 'Notification inbox', path: '/inbox' },
  { id: 'about', label: 'About Long Live', path: '/settings/about' },
] as const;
