// Startup perf: with a cached bundle on disk the DOM reader already has what it
// needs, so the native content refresh (which synchronously reads and parses the
// multi-MB cache on the RN thread) waits for the DOM `ready` signal and then for
// interactions to settle. With no cache the refresh is the first paint's input,
// so it runs immediately. The deferral is bounded: a hard timeout (shorter than
// the 10 s READY_TIMEOUT watchdog) runs it regardless, and disposing the host
// (watchdog fallback, unmount) flushes it, so a stale or poisoned cache is always
// replaced. The refresh runs at most once.
export const REFRESH_DEFER_TIMEOUT_MS = 6000;

export interface DeferredRefreshDeps {
  /** The content refresh (loadContentBundle in production). */
  load: () => Promise<unknown>;
  /** InteractionManager.runAfterInteractions in production; the handle cancels the task. */
  runAfterInteractions: (fn: () => void) => { cancel: () => void };
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  mark: (stage: string, detail?: string) => void;
  /** Called with the load result once it resolves. */
  onLoaded: (bundle: unknown) => void;
  /** Called when the load rejects. */
  onError: () => void;
  timeoutMs?: number;
}

export interface DeferredRefresh {
  /** Begin: immediate when there is no cache, otherwise held until ready/interactions/timeout. */
  start(hasCache: boolean): void;
  /** The DOM reported ready; schedules the held refresh after interactions (idempotent). */
  domReady(): void;
  /** Teardown: flushes a still-held refresh (never drops it) and cancels timer and task. */
  dispose(): void;
}

export function createDeferredRefresh(deps: DeferredRefreshDeps): DeferredRefresh {
  let held = false;
  let ran = false;
  let timer: unknown = null;
  let task: { cancel: () => void } | null = null;
  const run = () => {
    if (ran) return;
    ran = true;
    held = false;
    if (timer !== null) deps.clearTimeout(timer);
    timer = null;
    task?.cancel();
    task = null;
    deps.mark('bundle-refresh-start');
    deps
      .load()
      .then((b) => {
        deps.mark('bundle-refresh-done');
        deps.onLoaded(b);
      })
      .catch(() => {
        deps.mark('bundle-refresh-failed');
        deps.onError();
      });
  };
  return {
    start(hasCache) {
      if (!hasCache) return run();
      held = true;
      timer = deps.setTimeout(run, deps.timeoutMs ?? REFRESH_DEFER_TIMEOUT_MS);
    },
    domReady() {
      if (!held || task) return;
      task = deps.runAfterInteractions(run);
    },
    dispose() {
      if (held) run();
    },
  };
}
