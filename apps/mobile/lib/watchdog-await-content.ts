// Offline first-launch: with no last-good content on disk the DOM reader cannot paint, so the gate waits in the
// 'awaiting-content' mount state BEFORE any watchdog record write or monitor exists (a wait is not a strike).
// Pure (no react-native / expo): the gate injects `loadContent`, tests drive it directly.

export type ContentFailureKind = 'offline' | 'timeout' | 'server';

function chainOf(err: unknown): unknown[] {
  const chain: unknown[] = [];
  for (let e = err; e && chain.length < 6; e = (e as { cause?: unknown }).cause) chain.push(e);
  return chain;
}

const text = (e: unknown): string => (e instanceof Error ? e.message : String(e));
const nameOf = (e: unknown): string => (e as { name?: unknown } | null)?.name as string;
// packages/content does not export TransportError (only sets .name), so match by name; the contract test pins it.
const isTransportError = (e: unknown): boolean => nameOf(e) === 'TransportError';
const looksLikeTimeout = (e: unknown): boolean => /^(Abort|Timeout)Error$/.test(nameOf(e) ?? '') || /timed out|timeout|abort/i.test(text(e));

/**
 * Failure class for the copy. packages/content wraps a network-level failure as TransportError(msg, cause) (the cause is
 * the fetch rejection or the 'Request timed out' Error) and an HTTP failure as a cause-less TransportError; both may sit
 * under a BundleLoadError. Message text is only the last fallback, for errors with no TransportError in their chain.
 */
export function classifyContentFailure(err: unknown): ContentFailureKind {
  const chain = chainOf(err);
  const transport = chain.find(isTransportError) as { cause?: unknown } | undefined;
  if (transport) {
    if (transport.cause === undefined) return 'server';
    return chain.some(looksLikeTimeout) ? 'timeout' : 'offline';
  }
  const joined = chain.map(text).join(' | ');
  if (/timed out|timeout|abort/i.test(joined)) return 'timeout';
  if (/HTTP \d{3}/.test(joined)) return 'server';
  if (/Network request|network|offline|ENOTFOUND|ECONN/i.test(joined)) return 'offline';
  return 'server';
}

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
  onFailed: (failed: boolean, kind?: ContentFailureKind) => void,
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
          onFailed(true, classifyContentFailure(err));
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
