// Pure (no React): the web paths the DOM settings overlay owns. Imported by the native host (tap routing) as well
// as the DOM side, so it must stay free of slot components and React.
export const SETTINGS_PATHS: readonly string[] = ['/settings', '/settings/notifications'];
export const isSettingsPath = (pathname: string): boolean => SETTINGS_PATHS.includes(pathname);
/** The path the DOM inbox overlay owns (inbox-store.ts); a DOM path for tap routing, never a native route. */
export const INBOX_PATH = '/inbox';
export const isInboxPath = (pathname: string): boolean => pathname === INBOX_PATH;
