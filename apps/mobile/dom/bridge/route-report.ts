// Reports the DOM's current route (path + query/hash), busy flag (the user is mid-interaction: ClownBot ask/draft,
// feedback form; bridge/busy-signal.ts) and engaged flag (the reader is away from rest: not the front door, an overlay
// or legal page open, scrolled down; bridge/engaged-signal.ts) to native as the add-only `route` event, so native can restore the route after
// a re-key and defer that re-key while the user is busy (content adoption). Sends once at start, then whenever any
// of them changes; an unchanged report is not resent and a path outside the event's limits (`/`-rooted, <= 2048 chars) is
// skipped. React-free.
import { isBusy, isEngaged, subscribeBusy, subscribeEngaged } from '@swift2/ui';
import { currentDomPath, currentDomUrl, subscribeDomPath, type DomWin } from './dom-path';

export const MAX_ROUTE_LENGTH = 2048;

export function startRouteReporting(send: (payload: { path: string; busy?: boolean; engaged?: boolean }) => void, win?: DomWin): () => void {
  let last: string | null = null;
  const report = () => {
    const path = currentDomUrl(win);
    if (!path.startsWith('/') || path.length > MAX_ROUTE_LENGTH) return;
    const busy = isBusy();
    const engaged = isEngaged() || currentDomPath(win) !== '/';
    const key = `${busy ? 1 : 0}${engaged ? 1 : 0}${path}`;
    if (key === last) return;
    last = key;
    send({ path, ...(busy ? { busy } : {}), ...(engaged ? { engaged } : {}) });
  };
  report();
  const offPath = subscribeDomPath(report, win);
  const offBusy = subscribeBusy(report);
  const offEngaged = subscribeEngaged(report);
  return () => {
    offPath();
    offBusy();
    offEngaged();
  };
}
