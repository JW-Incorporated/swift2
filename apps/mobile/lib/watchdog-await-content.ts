// Offline first-launch: with no last-good content on disk the DOM reader cannot paint, so the gate waits in the
// 'awaiting-content' mount state BEFORE any watchdog record write or monitor exists (a wait is not a strike).
// Pure (no react-native / expo): the gate injects `loadContent`, tests drive it directly.

export interface ContentWaiter {
  /** Resolves once `loadContent` resolves; a rejection parks it (failed = true) until `retry` / the one auto-retry. */
  run: () => Promise<void>;
  retry: () => void;
  /** Foreground return: re-tries ONCE per launch while parked. */
  onActive: () => void;
}

export function createContentWaiter(
  loadContent: () => Promise<unknown>,
  onFailed: (failed: boolean) => void,
): ContentWaiter {
  let kick: (() => void) | null = null;
  let autoUsed = false;
  return {
    async run() {
      for (;;) {
        onFailed(false);
        try {
          await loadContent();
          return;
        } catch {
          onFailed(true);
          await new Promise<void>((resolve) => (kick = resolve));
          kick = null;
        }
      }
    },
    retry: () => kick?.(),
    onActive: () => {
      if (autoUsed || !kick) return;
      autoUsed = true;
      kick();
    },
  };
}
