// Content adoption (OTA-only ruling): the webview reads the last-good content file once at mount, so a refresh that
// lands while the app is running is invisible until the DOM is re-keyed. When a load resolves with a version that
// differs from the one the DOM mounted with, the new version is held as `pendingVersion`; on the next AppState
// transition INTO 'active' the host re-keys the DOM (the new webview re-reads the overwritten file) and, once the new
// epoch's `navigate` subscriber is up, navigates back to the route the old DOM last reported. Never re-keys while an
// epoch is mid-handshake (deferred until it is ready), never re-keys on navigate, never sends content over the bridge.
export interface ContentAdoptionDeps {
  /** True when a mounted version is known and differs from `version`. */
  differs: (version: string) => boolean;
  getMounted: () => string | null;
  setMounted: (version: string) => void;
  /** Re-key the DOM (SharedUiHost bumps `generation`). */
  bump: () => void;
  onSignal?: (stage: string, detail?: string) => void;
}

export type DomNavigator = (path: string) => Promise<boolean>;

export function createContentAdoption(deps: ContentAdoptionDeps) {
  let pending: string | null = null;
  let route: string | null = null;
  let restore: string | null = null;
  let ready = false;
  let waitingForReady = false;
  let appState: string | null = null;

  const adopt = () => {
    if (pending === null) return;
    waitingForReady = false;
    restore = restore ?? route;
    deps.setMounted(pending);
    pending = null;
    ready = false;
    deps.onSignal?.('content-adopt', restore ?? '');
    deps.bump();
  };

  return {
    /** A content load resolved. First load with nothing mounted yet records the baseline; later differing versions arm. */
    loaded(version: string) {
      if (deps.getMounted() === null) return deps.setMounted(version);
      if (deps.differs(version)) pending = version;
      else if (pending !== null && version === deps.getMounted()) pending = null;
    },
    /** The DOM's latest reported route (queued/coalesced `route` event). */
    route(path: string) {
      route = path;
    },
    /** AppState change: only a transition INTO 'active' adopts (and only from a different state). */
    appState(next: string) {
      const prev = appState;
      appState = next;
      if (next !== 'active' || prev === 'active' || pending === null) return;
      if (ready) adopt();
      else waitingForReady = true;
    },
    /** A new bridge epoch began (mount, crash re-key, adoption re-key): not ready until `navReady`. */
    epochStarted() {
      ready = false;
    },
    /** The epoch's DOM `navigate` subscriber is up (implies the handshake is complete). */
    navReady(navigate: DomNavigator) {
      ready = true;
      if (waitingForReady && pending !== null) return adopt();
      if (restore === null) return;
      const path = restore;
      restore = null;
      void navigate(path).then(
        (ok) => ok || deps.onSignal?.('content-adopt-nav-failed', path.slice(0, 120)),
        () => deps.onSignal?.('content-adopt-nav-failed', path.slice(0, 120)),
      );
    },
    /** Test seam. */
    peek: () => ({ pending, route, restore, ready }),
  };
}

export type ContentAdoption = ReturnType<typeof createContentAdoption>;
