// One UI WP0.4b: the per-launch attempt monitor (ready-timeout + signal accounting), split out of
// watchdog.ts. Pure (no RN/Expo imports); watchdog.ts re-exports everything here.

export const READY_TIMEOUT_MS = 20_000;
export const MAX_REASON_CHARS = 120;
/** A 2nd post-ready webview termination within this window (monotonic ms) is a strike; the 1st only reloads the DOM. */
export const RELOAD_WINDOW_MS = 5 * 60_000;

export type CrashOutcome = 'reload' | 'strike';

export const truncateReason = (s: string): string => s.slice(0, MAX_REASON_CHARS);

export interface Scheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface AttemptMonitorOptions {
  scheduler: Scheduler;
  now: () => number;
  active: boolean;
  onReady: () => void;
  onStrike: (reason: string) => void;
  timeoutMs?: number;
  reloadWindowMs?: number;
}

/**
 * One launch's ready-timeout + signal accounting. `ready` is idempotent;
 * `error` only strikes before ready; crashes strike at the event even after
 * ready, except the first one (the OS reaping the content process is not a DOM
 * fault): it asks the host to reload ('reload', ready timeout re-armed) and only a
 * 2nd within RELOAD_WINDOW_MS, or any before ready, strikes; at most one strike per launch. The timeout is paused while the app
 * is backgrounded (an attempt that never returns is abandoned next launch).
 */
export function createAttemptMonitor(opts: AttemptMonitorOptions) {
  const { scheduler, now, onReady, onStrike } = opts;
  const total = opts.timeoutMs ?? READY_TIMEOUT_MS;
  let remaining = total;
  let handle: unknown = null;
  let startedAt = 0;
  let readySeen = false;
  let struck = false;
  let activeNow = opts.active;
  let lastReloadAt: number | null = null;
  const reloadWindow = opts.reloadWindowMs ?? RELOAD_WINDOW_MS;

  const stopTimer = () => {
    if (handle !== null) scheduler.clearTimeout(handle);
    handle = null;
  };
  const strike = (reason: string) => {
    if (struck) return;
    struck = true;
    stopTimer();
    onStrike(truncateReason(reason));
  };
  const startTimer = () => {
    startedAt = now();
    handle = scheduler.setTimeout(() => {
      handle = null;
      if (!readySeen) strike('ready-timeout');
    }, remaining);
  };
  if (opts.active) startTimer();

  return {
    ready() {
      if (readySeen || struck) return;
      readySeen = true;
      stopTimer();
      onReady();
    },
    error(message: string) {
      if (readySeen) return;
      strike(`dom-error: ${message}`);
    },
    crashed(kind: 'terminated' | 'render-gone'): CrashOutcome {
      if (struck) return 'strike';
      const t = now();
      const recurred = lastReloadAt !== null && Math.max(0, t - lastReloadAt) < reloadWindow;
      if (!readySeen || recurred) {
        strike(`webview-${kind}`);
        return 'strike';
      }
      lastReloadAt = t;
      readySeen = false;
      remaining = total;
      stopTimer();
      if (activeNow) startTimer();
      return 'reload';
    },
    /**
     * A PLANNED webview reload (content adoption re-keys the DOM): the new reader must reach ready like a launch, so
     * the ready timeout re-arms and a DOM error before ready strikes. Unlike a crash it is not counted toward
     * RELOAD_WINDOW_MS, so a planned reload followed by a genuine crash is the first crash, not a repeat.
     */
    plannedReload(): boolean {
      if (struck) return false;
      readySeen = false;
      remaining = total;
      stopTimer();
      if (activeNow) startTimer();
      return true;
    },
    protocolFatal() {
      strike('protocol-fatal');
    },
    setActive(active: boolean) {
      activeNow = active;
      if (readySeen || struck) return;
      if (!active && handle !== null) {
        // A backward clock step reads as zero elapsed, so remaining never grows past `total`.
        const elapsed = Math.max(0, now() - startedAt);
        remaining = Math.min(total, Math.max(0, remaining - (Number.isFinite(elapsed) ? elapsed : 0)));
        stopTimer();
      } else if (active && handle === null) {
        startTimer();
      }
    },
    dispose: stopTimer,
  };
}

export type AttemptMonitor = ReturnType<typeof createAttemptMonitor>;
