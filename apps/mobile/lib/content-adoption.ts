// Content adoption (OTA-only ruling): the webview reads the last-good content file once at mount, so a refresh that
// lands while the app is running is invisible until the DOM is re-keyed. When a load resolves with a version that
// differs from the one the DOM mounted with, the new version is held as `pendingVersion`; on the next AppState
// transition INTO 'active' the host re-keys the DOM (the new webview re-reads the overwritten file) and, once the new
// epoch is ready (its `navigate` subscriber is up AND the reader has first-painted, so the applier exists), navigates
// back to the route the old DOM last reported. Never re-keys while an epoch is mid-handshake (deferred until it is
// ready), never while the user is mid-interaction (busy: adopted at a later foreground), never while the reader is engaged
// or its state is still unknown (no `route` report yet this epoch; away from the front door, an overlay open, scrolled): every
// non-stale adoption waits behind a cancellable IDLE_MS idle hold that any engaged/busy signal cancels, unless the app was
// backgrounded (AppState 'background', wall clock, guarded) for STALE_BACKGROUND_MS or more, when the context is stale anyway, never on navigate, and never
// sends content over the bridge. The reader's last reported snapshot (mode/era/lens/open item/scroll, #5114) is kept per epoch and,
// once the next epoch is ready and has navigated, replayed to it as a `restore` event (an adoption re-key and a crash re-key alike). A planned reload is announced to the watchdog first (`prepare`).
import type { ReaderSnap } from '@swift2/ui';

export interface ContentAdoptionDeps {
  /** True when a mounted version is known and differs from `version`. */
  differs: (version: string) => boolean;
  getMounted: () => string | null;
  setMounted: (version: string) => void;
  /** Runs before the re-key: persist the planned reload with the watchdog, then hand the reader its new cache-buster. False = do not re-key (pending is kept; retried on the next active transition). */
  prepare: (isCurrent: () => boolean) => Promise<boolean>;
  /** Re-key the DOM (SharedUiHost bumps `generation`). */
  bump: () => void;
  onSignal?: (stage: string, detail?: string) => void;
  /** Wall clock (ms) for the background-duration check (default Date.now); a negative or implausibly large delta (a clock jump) never counts as elapsed. */
  now?: () => number;
}

/** The reader must stay idle this long before a held version is adopted, so adoption never fires mid-gesture. */
export const IDLE_MS = 2000;
/** A background stay at least this long makes the user's context stale: adopt even if the reader is engaged. */
export const STALE_BACKGROUND_MS = 30 * 60 * 1000;
/** A background delta beyond this is a clock jump, not a stay. */
const MAX_PLAUSIBLE_BACKGROUND_MS = 7 * 24 * 60 * 60 * 1000;

const defaultNow = (): number => Date.now();

export type DomNavigator = (path: string) => Promise<boolean>;
export type SnapRestorer = (snap: ReaderSnap) => void;

export function createContentAdoption(deps: ContentAdoptionDeps) {
  let pending: string | null = null;
  let route: string | null = null;
  let busy = false;
  let engagedFlag = false;
  let routeSeen = false;
  let generation = 0;
  let staleForeground = false;
  let watchIdle = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let backgroundedAt: number | null = null;
  let restore: string | null = null;
  let snap: ReaderSnap | null = null;
  let restoreSnap: ReaderSnap | null = null;
  let restorer: SnapRestorer | null = null;
  // Cause of the next re-key: only adoption restores; a crash/reload re-key (epochStarted without it) sheds state and drops any pending restore.
  let adoptionRekey = false;
  // A navigation other than the restore reached this epoch (tap, deep link, native nav, DOM busy/engaged before the replay): it outranks the restore.
  let userNav = false;
  let restoring = false;
  let navOk = false;
  let readerOk = false;
  let navigator: DomNavigator | null = null;
  let waitingForReady = false;
  let appState: string | null = null;
  let adopting = false;

  // Unknown (no route report yet this epoch) counts as engaged: a late signal must never race an adoption.
  const engaged = () => !routeSeen || engagedFlag;

  const adopt = () => {
    if (pending === null || adopting) return;
    adopting = true;
    waitingForReady = false;
    const gen = generation;
    const isCurrent = () => gen === generation;
    void Promise.resolve()
      .then(() => deps.prepare(isCurrent))
      .catch(() => false)
      .then((ok) => {
        if (!isCurrent()) return;
        adopting = false;
        if (!ok || pending === null) return deps.onSignal?.('content-adopt-prepare-failed');
        // Commit only after the planned reload was persisted: from here the re-key is certain.
        if (restore === null) {
          restore = route;
          restoreSnap = snap;
        }
        deps.setMounted(pending);
        pending = null;
        navOk = false;
        readerOk = false;
        deps.onSignal?.('content-adopt', restore ?? '');
        adoptionRekey = true;
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

  // The idle gate every non-stale adoption goes through: adopt once the reader has been known-idle (front door, nothing
  // open, top, not busy) for IDLE_MS. Any engaged/busy/unknown signal during the hold cancels it.
  const reconsider = () => {
    if (!watchIdle) return;
    if (pending === null || appState !== 'active' || engaged() || busy) return clearIdle();
    if (idleTimer !== null) return;
    idleTimer = setTimeout(() => {
      idleTimer = null;
      if (!watchIdle || pending === null || appState !== 'active' || engaged() || busy || adopting) return;
      watchIdle = false;
      proceed();
    }, IDLE_MS);
  };

  const settle = () => {
    if (!navOk || !readerOk || !navigator) return;
    if (restore !== null) {
      const path = restore;
      const toRestore = restoreSnap;
      const send = restorer;
      restore = null;
      restoreSnap = null;
      const failed = () => deps.onSignal?.('content-adopt-nav-failed', path.slice(0, 120));
      const gen = generation;
      const failedNow = () => gen === generation && failed();
      const nav = navigator;
      const replay = () => {
        restoring = false;
        if (gen === generation && navigator === nav && !userNav && toRestore !== null) send?.(toRestore);
      };
      if (userNav) deps.onSignal?.('content-adopt-restore-skipped');
      else if (toRestore !== null && send && path === '/') send(toRestore);
      else {
        restoring = true;
        // The snapshot goes out once the path navigation settled (either way), and only to the epoch that navigated.
        void nav(path).then((ok) => (ok || failedNow(), replay()), () => (failedNow(), replay()));
      }
    }
    if (waitingForReady && pending !== null && !adopting) {
      if (busy) waitingForReady = false;
      else if (!staleForeground) {
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
    route(path: string, isBusy = false, isEngaged = false, latest: ReaderSnap | null = null) {
      route = path;
      snap = latest;
      if (restoreSnap !== null && (isBusy || (isEngaged && !restoring))) userNav = true;
      busy = isBusy;
      engagedFlag = isEngaged;
      routeSeen = true;
      reconsider();
    },
    /** AppState change: only a transition INTO 'active' adopts (and only from a different state). */
    appState(next: string) {
      const prev = appState;
      appState = next;
      if (next !== 'active') {
        // Only a real 'background' starts the stay (iOS 'inactive' is the share sheet / app switcher / a call banner).
        if (next === 'background' && backgroundedAt === null) backgroundedAt = (deps.now ?? defaultNow)();
        clearIdle();
        return;
      }
      const since = backgroundedAt;
      backgroundedAt = null;
      if (prev === 'active' || pending === null || adopting) return;
      const delta = since === null ? NaN : (deps.now ?? defaultNow)() - since;
      staleForeground = Number.isFinite(delta) && delta >= STALE_BACKGROUND_MS && delta <= MAX_PLAUSIBLE_BACKGROUND_MS;
      watchIdle = false;
      clearIdle();
      if (busy) return deps.onSignal?.('content-adopt-deferred-busy');
      if (staleForeground) return proceed();
      watchIdle = true;
      if (engaged()) deps.onSignal?.('content-adopt-deferred-engaged');
      reconsider();
    },
    /** A new bridge epoch began (mount, crash re-key, adoption re-key): not ready until navReady AND the reader's first paint. */
    epochStarted() {
      if (!adoptionRekey) {
        restore = null;
        restoreSnap = null;
      }
      adoptionRekey = false;
      userNav = false;
      restoring = false;
      snap = null;
      routeSeen = false;
      navOk = false;
      readerOk = false;
      navigator = null;
    },
    /** The epoch's DOM `navigate` subscriber is up (implies the handshake is complete); the reader may not be mounted yet. */
    navReady(navigate: DomNavigator, restoreSnapshot?: SnapRestorer) {
      navOk = true;
      navigator = navigate;
      restorer = restoreSnapshot ?? null;
      settle();
    },
    /** A navigation other than the restore reached the current epoch (notification tap, deep link, native screen): a pending restore is abandoned. */
    userNavigated() {
      userNav = true;
    },
    /** The reader reported ready (first paint): its navigate applier exists now. */
    readerReady() {
      readerOk = true;
      settle();
    },
    /** Teardown: cancel the idle hold, invalidate any in-flight adoption (its completion becomes a no-op) and drop queued work. The instance stays usable if the owner re-subscribes (StrictMode remount). */
    dispose() {
      generation++;
      clearIdle();
      adopting = false;
      watchIdle = false;
      waitingForReady = false;
      backgroundedAt = null;
    },
  };
}

export type ContentAdoption = ReturnType<typeof createContentAdoption>;
