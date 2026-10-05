// Re-checks content when the app returns to the foreground (the launch refresh is one-shot, so an offline launch would
// otherwise stay stale until remount). No connectivity module ships in the binary, so AppState -> active is the
// reconnect signal. At most one load in flight; at least MIN_INTERVAL_MS between successful checks; failures back off
// exponentially (BASE..MAX). The launch refresh reports through `track` so its outcome feeds the same schedule.
export const MIN_INTERVAL_MS = 5 * 60_000;
export const BACKOFF_BASE_MS = 10_000;
export const BACKOFF_MAX_MS = MIN_INTERVAL_MS;

export interface ForegroundRefreshDeps<T> {
  load: () => Promise<T>;
  now: () => number;
  onLoaded: (bundle: T) => void;
  onError: () => void;
}

export function createForegroundRefresh<T>(deps: ForegroundRefreshDeps<T>) {
  let inflight = false;
  let failures = 0;
  let nextAllowed = Infinity; // closed until the launch refresh has reported once
  let disposed = false;
  const track = (p: Promise<T>): Promise<T> => {
    inflight = true;
    return p.then(
      (v) => {
        inflight = false;
        failures = 0;
        nextAllowed = deps.now() + MIN_INTERVAL_MS;
        return v;
      },
      (e) => {
        inflight = false;
        failures += 1;
        nextAllowed = deps.now() + Math.min(BACKOFF_BASE_MS * 2 ** (failures - 1), BACKOFF_MAX_MS);
        throw e;
      },
    );
  };
  return {
    track,
    /** AppState became active. */
    foreground(): void {
      if (disposed || inflight || deps.now() < nextAllowed) return;
      track(deps.load()).then(
        (b) => !disposed && deps.onLoaded(b),
        () => !disposed && deps.onError(),
      );
    },
    dispose(): void {
      disposed = true;
    },
  };
}
