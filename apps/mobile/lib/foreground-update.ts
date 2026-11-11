// OTA on foreground: expo-updates alone checks on cold launch and applies on the NEXT cold start, so a fan could sit on a
// stale bundle for two restarts. This checks when the app returns to the foreground (throttled), downloads in the
// background, and applies a fetched update only when the fan comes back after being away, so the reload reads as a
// normal launch. The reload goes through the watchdog's planned-reload path first (never a strike). Everything is
// best-effort: no error is surfaced. Loop guard: at most one reload per JS process (in-memory, like selfHealOnce).
import type { UpdatesLike } from './content-bundle';
import { OTA_CHECK_TIMEOUT_MS, OTA_FETCH_TIMEOUT_MS } from './recovery-retry';

export const CHECK_INTERVAL_MS = 10 * 60_000;
export const BACKGROUND_APPLY_MS = 30_000;
export const STARTUP_CHECK_DELAY_MS = 5_000;
/** Settle time after a foreground before reloading: a deep link or notification tap that woke the app lands inside it. */
export const LINK_SETTLE_MS = 2_000;

/** A link event (URL or settled tap) this recent counts as pending: it must cover the settle wait plus delivery. */
export const LINK_RECENT_MS = 3_000;

export interface ForegroundDecisionInput {
  now: number;
  lastCheckAt: number | null;
  backgroundedAt: number | null;
  pendingUpdate: boolean;
  lastReloadAt: number | null;
  hasPendingLink: boolean;
}

export type ForegroundAction = 'check' | 'reload' | 'none';

/** What to do when the app is (or has just returned to) active. */
export function decideForegroundAction(i: ForegroundDecisionInput): ForegroundAction {
  if (i.pendingUpdate) {
    const away = i.backgroundedAt !== null && i.now - i.backgroundedAt >= BACKGROUND_APPLY_MS;
    // Loop guard: one reload per process. Any earlier reload (so also one inside the last 5 minutes) blocks.
    return away && i.lastReloadAt === null && !i.hasPendingLink ? 'reload' : 'none';
  }
  return i.lastCheckAt === null || i.now - i.lastCheckAt >= CHECK_INTERVAL_MS ? 'check' : 'none';
}

function raceTimeout<T>(work: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export interface ForegroundUpdatePorts {
  updates: UpdatesLike;
  appState: { current: string; subscribe: (cb: (state: string) => void) => () => void };
  /** Persists the reload with the watchdog; false = do not reload. */
  planReload: () => Promise<boolean>;
  /** A tap or deep link is queued or was just delivered. */
  hasPendingLink: () => boolean;
  isDev?: boolean;
  now?: () => number;
  wait?: (ms: number) => Promise<void>;
}

/** Starts the mechanism; returns the stop function. Never throws. */
export function startForegroundUpdate(ports: ForegroundUpdatePorts): () => void {
  if (ports.isDev) return () => undefined;
  const now = ports.now ?? Date.now;
  const wait = ports.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let stopped = false;
  let lastCheckAt: number | null = null;
  let backgroundedAt: number | null = null;
  let pendingUpdate = false;
  let lastReloadAt: number | null = null;
  let busy = false;

  const checkAndFetch = async (): Promise<void> => {
    lastCheckAt = now();
    try {
      if (!ports.updates.isEnabled) return;
      const check = await raceTimeout(ports.updates.checkForUpdateAsync(), OTA_CHECK_TIMEOUT_MS);
      if (!check?.isAvailable) return;
      const fetched = await raceTimeout(ports.updates.fetchUpdateAsync(), OTA_FETCH_TIMEOUT_MS);
      if (fetched?.isNew) pendingUpdate = true;
    } catch {
      // Best effort: the app keeps running on what it has.
    }
  };

  const reload = async (): Promise<void> => {
    try {
      if (!(await ports.planReload())) return;
      lastReloadAt = now();
      await ports.updates.reloadAsync();
    } catch {
      // A failed reload leaves the fan on the running bundle.
    }
  };

  const evaluate = async (awayAt: number | null): Promise<void> => {
    if (stopped || busy) return;
    busy = true;
    try {
      const input = (): ForegroundDecisionInput => ({
        now: now(),
        lastCheckAt,
        backgroundedAt: awayAt,
        pendingUpdate,
        lastReloadAt,
        hasPendingLink: ports.hasPendingLink(),
      });
      const first = decideForegroundAction({ ...input(), hasPendingLink: false });
      if (first === 'check') await checkAndFetch();
      else if (first === 'reload') {
        await wait(LINK_SETTLE_MS);
        if (stopped || ports.appState.current !== 'active') return;
        if (decideForegroundAction(input()) === 'reload') await reload();
      }
    } finally {
      busy = false;
    }
  };

  const off = ports.appState.subscribe((state) => {
    if (state === 'background') {
      backgroundedAt ??= now();
      return;
    }
    if (state !== 'active') return;
    const awayAt = backgroundedAt;
    backgroundedAt = null;
    void evaluate(awayAt);
  });

  void wait(STARTUP_CHECK_DELAY_MS).then(() => {
    if (ports.appState.current === 'active') void evaluate(null);
  });

  return () => {
    stopped = true;
    off();
  };
}
