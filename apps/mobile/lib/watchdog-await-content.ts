// Offline first-launch: with no last-good content on disk the DOM reader cannot paint, so the gate waits in the
// 'awaiting-content' mount state BEFORE any watchdog record write or monitor exists (a wait is not a strike).
// Pure (no react-native / expo): the gate injects `loadContent`, tests drive it directly.

export type ContentFailureKind = 'offline' | 'timeout' | 'server';

function chainText(err: unknown): string {
  const parts: string[] = [];
  let e: unknown = err;
  for (let i = 0; i < 4 && e; i++) {
    parts.push(e instanceof Error ? e.message : String(e));
    e = (e as { cause?: unknown }).cause;
  }
  return parts.join(' | ');
}

/** Failure class for the copy: a bare transport failure is offline; a timeout or an HTTP/data failure is the server side. */
export function classifyContentFailure(err: unknown): ContentFailureKind {
  const text = chainText(err);
  if (/timed out|timeout|abort/i.test(text)) return 'timeout';
  if (/HTTP \d{3}/.test(text)) return 'server';
  if (/Network request|network|offline|ENOTFOUND|ECONN/i.test(text)) return 'offline';
  return 'server';
}

let lastKind: ContentFailureKind = 'server';
/** Class of the most recent content failure (set before onFailed(true), so a render on that flip reads it). */
export const contentFailureKind = (): ContentFailureKind => lastKind;

/** Auto-retry waits while the failure screen is visible and the app is foregrounded: 5 s, 15 s, 30 s, then every 60 s. */
export const RETRY_BACKOFF_MS = [5_000, 15_000, 30_000] as const;
export const RETRY_STEADY_MS = 60_000;
export const retryDelayMs = (attempt: number): number => RETRY_BACKOFF_MS[attempt] ?? RETRY_STEADY_MS;

export interface RetryTimers {
  set: (fn: () => void, ms: number) => unknown;
  clear: (h: unknown) => void;
}

/** One pending timer at most (arming twice never overlaps); disarm cancels it (backgrounded / retrying / unmounted). Re-arms itself after each retry; the caller disarms once the retry is underway. */
export function createRetryScheduler(
  retry: () => void,
  timers: RetryTimers = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
) {
  let attempt = 0;
  let pending: unknown = null;
  const arm = (): void => {
    if (pending !== null) return;
    pending = timers.set(() => {
      pending = null;
      attempt += 1;
      retry();
      arm();
    }, retryDelayMs(attempt));
  };
  return {
    arm,
    disarm(): void {
      if (pending !== null) timers.clear(pending);
      pending = null;
    },
  };
}

export interface ContentWaiter {
  /** Resolves true once `loadContent` resolves, false if disposed first; a rejection parks it (failed = true) until `retry` / the one auto-retry. */
  run: () => Promise<boolean>;
  retry: () => void;
  /** Foreground return: re-tries ONCE per launch while parked. */
  onActive: () => void;
  /** Unmount: wakes a parked run so it exits. */
  release: () => void;
}

export function createContentWaiter(
  loadContent: () => Promise<unknown>,
  onFailed: (failed: boolean) => void,
  isDisposed: () => boolean,
): ContentWaiter {
  let kick: (() => void) | null = null;
  let autoUsed = false;
  return {
    async run() {
      for (;;) {
        if (isDisposed()) return false;
        onFailed(false);
        try {
          await loadContent();
          return !isDisposed();
        } catch (err) {
          if (isDisposed()) return false;
          lastKind = classifyContentFailure(err);
          onFailed(true);
          await new Promise<void>((resolve) => (kick = resolve));
          kick = null;
        }
      }
    },
    retry: () => {
      if (!isDisposed()) kick?.();
    },
    release: () => kick?.(),
    onActive: () => {
      if (autoUsed || !kick || isDisposed()) return;
      autoUsed = true;
      kick();
    },
  };
}
