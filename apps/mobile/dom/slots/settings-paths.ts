// Pure (no React): the web paths the DOM settings overlay owns. Imported by the native host (tap routing) as well
// as the DOM side, so it must stay free of slot components and React.
export const SETTINGS_PATHS: readonly string[] = ['/settings', '/settings/notifications'];
export const isSettingsPath = (pathname: string): boolean => SETTINGS_PATHS.includes(pathname);
/** The path the DOM inbox overlay owns (inbox-store.ts); a DOM path for tap routing, never a native route. */
export const INBOX_PATH = '/inbox';
export const isInboxPath = (pathname: string): boolean => pathname === INBOX_PATH;
/** The pre-DOM inbox deep link (`/?current=inbox`, still produced by the digest); the DOM and the queue treat it as `/inbox`. */
export const isLegacyInboxLink = (path: string): boolean => {
  try {
    const u = new URL(path, 'http://site.invalid');
    return u.pathname === '/' && u.searchParams.get('current') === 'inbox';
  } catch {
    return false;
  }
};
/** DOM-bound form of a tap path: the legacy inbox link becomes `/inbox`. */
export const toDomTapPath = (path: string): string => (isLegacyInboxLink(path) ? INBOX_PATH : path);
/** Native-fallback form: `/inbox` becomes the legacy link the native router resolves to NotificationInboxScreen. */
export const toNativeTapPath = (path: string): string => {
  try {
    return isInboxPath(new URL(path, 'http://site.invalid').pathname) ? '/?current=inbox' : path;
  } catch {
    return path;
  }
};
