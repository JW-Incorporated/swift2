// Reports the DOM's current route (path + query/hash), busy flag (the user is mid-interaction: ClownBot ask/draft,
// feedback form; bridge/busy-signal.ts), engaged flag (the reader is away from rest: not the front door, an overlay
// or legal page open, scrolled down; bridge/engaged-signal.ts) and reader snapshot (mode/era/lens/open item/scroll;
// bridge/snapshot-signal.ts) to native as the add-only `route` event, so native can restore the route and reader state
// after a re-key and defer that re-key while the user is busy (content adoption). Sends once at start, then whenever the
// path, busy or engaged changes (immediately); a changed snapshot alone is sent trailing, at most once per SNAP_THROTTLE_MS,
// and only when its serialized form differs from the last one sent (a cleared snapshot is never sent). A path outside the event's limits (`/`-rooted,
// <= 2048 chars) is skipped. React-free.
import { getSnapshot, isBusy, isEngaged, subscribeBusy, subscribeEngaged, subscribeSnapshot, type ReaderSnap } from '@swift2/ui';
import { currentDomPath, currentDomUrl, subscribeDomPath, type DomWin } from './dom-path';

export const MAX_ROUTE_LENGTH = 2048;
export const SNAP_THROTTLE_MS = 1000;

export function startRouteReporting(
  send: (payload: { path: string; busy?: boolean; engaged?: boolean; snap?: ReaderSnap }) => void,
  win?: DomWin,
): () => void {
  let last: string | null = null;
  let lastSnap: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  // `flush`: a path/busy/engaged change goes out now (with the latest snapshot); a snapshot-only change waits for the trailing timer.
  const report = (flush = true) => {
    const path = currentDomUrl(win);
    if (!path.startsWith('/') || path.length > MAX_ROUTE_LENGTH) return;
    const busy = isBusy();
    const engaged = isEngaged() || currentDomPath(win) !== '/';
    const key = `${busy ? 1 : 0}${engaged ? 1 : 0}${path}`;
    const snap = getSnapshot();
    const snapKey = snap ? JSON.stringify(snap) : lastSnap;
    if (key === last && snapKey === lastSnap) return;
    if (key === last && !flush) {
      if (timer === null) timer = setTimeout(() => ((timer = null), report(true)), SNAP_THROTTLE_MS);
      return;
    }
    clear();
    last = key;
    lastSnap = snapKey;
    send({ path, ...(busy ? { busy } : {}), ...(engaged ? { engaged } : {}), ...(snap ? { snap } : {}) });
  };
  report();
  const offPath = subscribeDomPath(() => report(), win);
  const offBusy = subscribeBusy(() => report());
  const offEngaged = subscribeEngaged(() => report());
  const offSnap = subscribeSnapshot(() => report(false));
  return () => {
    clear();
    offPath();
    offBusy();
    offEngaged();
    offSnap();
  };
}
