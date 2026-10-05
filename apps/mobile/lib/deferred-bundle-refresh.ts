// Startup perf: with a cached bundle on disk the DOM reader already has what it
// needs, so the native content refresh (which synchronously reads and parses the
// multi-MB cache on the RN thread) waits for the DOM `ready` signal and then for
// interactions to settle. With no cache the refresh is the first paint's input,
// so it runs immediately.
export interface DeferredRefreshDeps {
  /** The content refresh (loadContentBundle in production). */
  load: () => Promise<unknown>;
  /** InteractionManager.runAfterInteractions in production. */
  runAfterInteractions: (fn: () => void) => void;
  mark: (stage: string, detail?: string) => void;
  /** Called with the load result once it resolves. */
  onLoaded: (bundle: unknown) => void;
  /** Called when the load rejects. */
  onError: () => void;
}

export interface DeferredRefresh {
  /** Begin: immediate when there is no cache, otherwise held until domReady(). */
  start(hasCache: boolean): void;
  /** The DOM reported ready; releases a held refresh (idempotent). */
  domReady(): void;
  /** Drop a held or not-yet-run refresh (effect cleanup). */
  cancel(): void;
}

export function createDeferredRefresh(deps: DeferredRefreshDeps): DeferredRefresh {
  let held = false;
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
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
      if (hasCache) held = true;
      else run();
    },
    domReady() {
      if (!held) return;
      held = false;
      deps.runAfterInteractions(run);
    },
    cancel() {
      cancelled = true;
      held = false;
    },
  };
}
