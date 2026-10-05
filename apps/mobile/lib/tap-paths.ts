// Which notification-tap paths the DOM reader handles itself (everything else opens natively). Pure.
import { isInboxPath, isSettingsPath } from '../dom/slots/settings-paths';

/** The reader route (pathname `/`), a DOM settings page or the DOM inbox, and not claimed by a native route. */
export function isDomOwnedTapPath(path: string, isNativeRoute: (p: string) => boolean, base = 'http://site.invalid'): boolean {
  if (isNativeRoute(path)) return false;
  const pathname = new URL(path, base).pathname;
  return pathname === '/' || isSettingsPath(pathname) || isInboxPath(pathname);
}
