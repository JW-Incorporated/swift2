// Reports the DOM's current route (path + query/hash) to native as the add-only `route` event, so native can restore
// it after a re-key (content adoption). Sends once at start, then on every path change; unchanged routes are not resent
// and anything outside the event's limits (`/`-rooted, <= 2048 chars) is skipped. React-free.
import { currentDomUrl, subscribeDomPath, type DomWin } from './dom-path';

export const MAX_ROUTE_LENGTH = 2048;

export function startRouteReporting(send: (path: string) => void, win?: DomWin): () => void {
  let last: string | null = null;
  const report = () => {
    const path = currentDomUrl(win);
    if (path === last || !path.startsWith('/') || path.length > MAX_ROUTE_LENGTH) return;
    last = path;
    send(path);
  };
  report();
  return subscribeDomPath(report, win);
}
