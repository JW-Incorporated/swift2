// Which notification-tap paths the DOM reader handles itself (everything else opens natively). Pure.
import { isSettingsPath } from '../dom/slots/settings-paths';

/** The reader route (pathname `/`) or a DOM settings page, and not claimed by a native route. */
export function isDomOwnedTapPath(path: string, isNativeRoute: (p: string) => boolean, base = 'http://site.invalid'): boolean {
  if (isNativeRoute(path)) return false;
  const pathname = new URL(path, base).pathname;
  return pathname === '/' || isSettingsPath(pathname);
}
