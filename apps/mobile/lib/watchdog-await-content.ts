// Offline first-launch: with no last-good content on disk the DOM reader cannot paint, so the gate waits in the
// 'awaiting-content' mount state BEFORE any watchdog record write or monitor exists (a wait is not a strike).
// Pure (no react-native / expo): the gate injects `loadContent`, tests drive it directly.

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
        } catch {
          if (isDisposed()) return false;
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
