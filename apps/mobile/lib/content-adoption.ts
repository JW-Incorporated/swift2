// Content adoption (OTA-only ruling): the webview reads the last-good content file once at mount, so a refresh that
// lands while the app is running is invisible until the DOM is re-keyed. When a load resolves with a version that
// differs from the one the DOM mounted with, the new version is held as `pendingVersion`; on the next AppState
// transition INTO 'active' the host re-keys the DOM (the new webview re-reads the overwritten file) and, once the new
// epoch is ready (its `navigate` subscriber is up AND the reader has first-painted, so the applier exists), navigates
// back to the route the old DOM last reported. Never re-keys while an epoch is mid-handshake (deferred until it is
// ready), never while the user is mid-interaction (busy: adopted at a later foreground), never while the reader is engaged
// (away from the front door, an overlay open, scrolled: held pending until it has idled for IDLE_MS, unless the app was
// backgrounded for STALE_BACKGROUND_MS or more, when the context is stale anyway), never on navigate, and never
// sends content over the bridge. A planned reload is announced to the watchdog first (`prepare`).
export interface ContentAdoptionDeps {
  /** True when a mounted version is known and differs from `version`. */
  differs: (version: string) => boolean;
  getMounted: () => string | null;
  setMounted: (version: string) => void;
  /** Runs before the re-key: persist the planned reload with the watchdog, then hand the reader its new cache-buster. False = do not re-key (pending is kept; retried on the next active transition). */
  prepare: () => Promise<boolean>;
  /** Re-key the DOM (SharedUiHost bumps `generation`). */
  bump: () => void;
  onSignal?: (stage: string, detail?: string) => void;
  /** Clock for the background-duration check (default Date.now). */
  now?: () => number;
}

/** The reader must stay idle this long before a held version is adopted, so adoption never fires mid-gesture. */
export const IDLE_MS = 2000;
/** A background stay at least this long makes the user's context stale: adopt even if the reader is engaged. */
export const STALE_BACKGROUND_MS = 30 * 60 * 1000;

export type DomNavigator = (path: string) => Promise<boolean>;

export function createContentAdoption(deps: ContentAdoptionDeps) {
  let pending: string | null = null;
  let route: string | null = null;
  let busy = false;
  let engaged = false;
  let staleForeground = false;
  let watchIdle = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let backgroundedAt: number | null = null;
  let restore: string | null = null;
  let navOk = false;
  let readerOk = false;
  let navigator: DomNavigator | null = null;
  let waitingForReady = false;
  let appState: string | null = null;
  let adopting = false;

  const adopt = () => {
    if (pending === null || adopting) return;
    adopting = true;
    waitingForReady = false;
    void Promise.resolve()
      .then(() => deps.prepare())
      .catch(() => false)
      .then((ok) => {
        adopting = false;
        if (!ok || pending === null) return deps.onSignal?.('content-adopt-prepare-failed');
        // Commit only after the planned reload was persisted: from here the re-key is certain.
        restore = restore ?? route;
        deps.setMounted(pending);
        pending = null;
        navOk = false;
        readerOk = false;
        deps.onSignal?.('content-adopt', restore ?? '');
        deps.bump();
      });
  };

  const clearIdle = () => {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
  };

  const proceed = () => {
    if (navOk && readerOk) adopt();
    else waitingForReady = true;
  };

  // After an engaged deferral: adopt once the reader has been idle (front door, nothing open, top, not busy) for IDLE_MS.
  const reconsider = () => {
    if (!watchIdle) return;
    if (pending === null || appState !== 'active' || engaged || busy) return clearIdle();
    if (idleTimer !== null) return;
    idleTimer = setTimeout(() => {
      idleTimer = null;
      if (!watchIdle || pending === null || appState !== 'active' || engaged || busy || adopting) return;
      watchIdle = false;
      proceed();
    }, IDLE_MS);
  };

  const settle = () => {
    if (!navOk || !readerOk || !navigator) return;
    if (restore !== null) {
      const path = restore;
      restore = null;
      const failed = () => deps.onSignal?.('content-adopt-nav-failed', path.slice(0, 120));
      void navigator(path).then((ok) => ok || failed(), failed);
    }
    if (waitingForReady && pending !== null && !adopting) {
      if (busy) waitingForReady = false;
      else if (engaged && !staleForeground) {
        waitingForReady = false;
        watchIdle = true;
        reconsider();
      } else adopt();
    }
  };

  return {
    /** A content load resolved. First load with nothing mounted yet records the baseline; later differing versions arm. */
    loaded(version: string) {
      if (deps.getMounted() === null) return deps.setMounted(version);
      if (deps.differs(version)) pending = version;
      else if (pending !== null && version === deps.getMounted()) pending = null;
    },
    /** The DOM's latest reported route, busy and engaged flags (queued/coalesced `route` event). */
    route(path: string, isBusy = false, isEngaged = false) {
      route = path;
      busy = isBusy;
      engaged = isEngaged;
      reconsider();
    },
    /** AppState change: only a transition INTO 'active' adopts (and only from a different state). */
    appState(next: string) {
      const prev = appState;
      appState = next;
      if (next !== 'active') {
        if (prev === 'active' && backgroundedAt === null) backgroundedAt = (deps.now ?? Date.now)();
        clearIdle();
        return;
      }
      const since = backgroundedAt;
      backgroundedAt = null;
      if (prev === 'active' || pending === null || adopting) return;
      staleForeground = since !== null && (deps.now ?? Date.now)() - since >= STALE_BACKGROUND_MS;
      watchIdle = false;
      clearIdle();
      if (busy) return deps.onSignal?.('content-adopt-deferred-busy');
      if (engaged && !staleForeground) {
        watchIdle = true;
        return deps.onSignal?.('content-adopt-deferred-engaged');
      }
      proceed();
    },
    /** A new bridge epoch began (mount, crash re-key, adoption re-key): not ready until navReady AND the reader's first paint. */
    epochStarted() {
      navOk = false;
      readerOk = false;
      navigator = null;
    },
    /** The epoch's DOM `navigate` subscriber is up (implies the handshake is complete); the reader may not be mounted yet. */
    navReady(navigate: DomNavigator) {
      navOk = true;
      navigator = navigate;
      settle();
    },
    /** The reader reported ready (first paint): its navigate applier exists now. */
    readerReady() {
      readerOk = true;
      settle();
    },
  };
}

export type ContentAdoption = ReturnType<typeof createContentAdoption>;
