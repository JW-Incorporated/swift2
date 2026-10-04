// WP 2.12-D: the settings rows that leave the DOM for a native modal. Paths must match `host.routes.ts`
// (a test pins that) so navigate() presents natively. There is no About row: the app has no native About
// screen yet, so a row would open an empty modal (tracked by a GitHub issue, refs #4788).
export const SETTINGS_NATIVE_ROWS = [{ id: 'inbox', label: 'Notification inbox', path: '/inbox' }] as const;
