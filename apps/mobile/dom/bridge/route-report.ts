// Reports the DOM's current route (path + query/hash) and busy flag (the user is mid-interaction: ClownBot ask/draft,
// feedback form; bridge/busy-signal.ts) to native as the add-only `route` event, so native can restore the route after
// a re-key and defer that re-key while the user is busy (content adoption). Sends once at start, then whenever either
// changes; an unchanged report is not resent and a path outside the event's limits (`/`-rooted, <= 2048 chars) is
// skipped. React-free.
import { isBusy, subscribeBusy } from '@swift2/ui';
import { currentDomUrl, subscribeDomPath, type DomWin } from './dom-path';

export const MAX_ROUTE_LENGTH = 2048;

export function startRouteReporting(send: (payload: { path: string; busy?: boolean }) => void, win?: DomWin): () => void {
  let last: string | null = null;
  const report = () => {
    const path = currentDomUrl(win);
    if (!path.startsWith('/') || path.length > MAX_ROUTE_LENGTH) return;
    const busy = isBusy();
    const key = `${busy ? 1 : 0}${path}`;
    if (key === last) return;
    last = key;
    send(busy ? { path, busy } : { path });
  };
  report();
  const offPath = subscribeDomPath(report, win);
  const offBusy = subscribeBusy(report);
  return () => {
    offPath();
    offBusy();
  };
}
