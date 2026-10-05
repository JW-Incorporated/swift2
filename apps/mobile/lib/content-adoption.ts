// Content adoption (OTA-only ruling): the webview reads the last-good content file once at mount, so a refresh that
// lands while the app is running is invisible until the DOM is re-keyed. When a load resolves with a version that
// differs from the one the DOM mounted with, the new version is held as `pendingVersion`; on the next AppState
// transition INTO 'active' the host re-keys the DOM (the new webview re-reads the overwritten file) and, once the new
// epoch is ready (its `navigate` subscriber is up AND the reader has first-painted, so the applier exists), navigates
// back to the route the old DOM last reported. Never re-keys while an epoch is mid-handshake (deferred until it is
// ready), never while the user is mid-interaction (busy: adopted at a later foreground), never on navigate, and never
// sends content over the bridge. A planned reload is announced to the watchdog first (`prepare`).
export interface ContentAdoptionDeps {
  /** True when a mounted version is known and differs from `version`. */
  differs: (version: string) => boolean;
  getMounted: () => string | null;
  setMounted: (version: string) => void;
  /** Runs before the re-key: recompute the reader's cache-buster and re-arm the watchdog as a planned (non-strike) reload. */
  prepare: () => Promise<void> | void;
  /** Re-key the DOM (SharedUiHost bumps `generation`). */
  bump: () => void;
  onSignal?: (stage: string, detail?: string) => void;
}

export type DomNavigator = (path: string) => Promise<boolean>;

export function createContentAdoption(deps: ContentAdoptionDeps) {
  let pending: string | null = null;
  let route: string | null = null;
  let busy = false;
  let restore: string | null = null;
  let navOk = false;
  let readerOk = false;
  let navigator: DomNavigator | null = null;
  let waitingForReady = false;
  let appState: string | null = null;

  const adopt = () => {
    if (pending === null) return;
    waitingForReady = false;
    restore = restore ?? route;
    deps.setMounted(pending);
    pending = null;
    navOk = false;
    readerOk = false;
    deps.onSignal?.('content-adopt', restore ?? '');
    void Promise.resolve()
      .then(() => deps.prepare())
      .catch(() => deps.onSignal?.('content-adopt-prepare-failed'))
      .then(() => deps.bump());
  };

  const settle = () => {
    if (!navOk || !readerOk || !navigator) return;
    if (restore !== null) {
      const path = restore;
      restore = null;
      const failed = () => deps.onSignal?.('content-adopt-nav-failed', path.slice(0, 120));
      void navigator(path).then((ok) => ok || failed(), failed);
    }
    if (waitingForReady && pending !== null) {
      if (busy) waitingForReady = false;
      else adopt();
    }
  };

  return {
    /** A content load resolved. First load with nothing mounted yet records the baseline; later differing versions arm. */
    loaded(version: string) {
      if (deps.getMounted() === null) return deps.setMounted(version);
      if (deps.differs(version)) pending = version;
      else if (pending !== null && version === deps.getMounted()) pending = null;
    },
    /** The DOM's latest reported route and busy flag (queued/coalesced `route` event). */
    route(path: string, isBusy = false) {
      route = path;
      busy = isBusy;
    },
    /** AppState change: only a transition INTO 'active' adopts (and only from a different state). */
    appState(next: string) {
      const prev = appState;
      appState = next;
      if (next !== 'active' || prev === 'active' || pending === null) return;
      if (busy) return deps.onSignal?.('content-adopt-deferred-busy');
      if (navOk && readerOk) adopt();
      else waitingForReady = true;
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
