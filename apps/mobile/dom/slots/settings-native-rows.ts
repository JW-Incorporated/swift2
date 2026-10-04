// WP 2.12-D: the settings rows that leave the DOM for a native modal. Paths must match `host.routes.ts`
// (a test pins that) so navigate() presents natively. The About row opens the native About + Diagnostics
// screen (refs #4992); it is host-gated like the rest (the list only renders once the native bridge answers).
export const SETTINGS_NATIVE_ROWS = [
  { id: 'inbox', label: 'Notification inbox', path: '/inbox' },
  { id: 'about', label: 'About', path: '/settings/about' },
] as const;
