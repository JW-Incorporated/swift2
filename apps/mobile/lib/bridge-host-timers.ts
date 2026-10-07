export interface BridgeScheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

/** Scheduler wrappers that contain a throwing scheduler (arm -> null, disarm -> no-op). */
export function createTimers(scheduler: BridgeScheduler, onSignal: (stage: string, detail?: string) => void) {
  return {
    arm(fn: () => void, ms: number): { h: unknown } | null {
      try {
        return { h: scheduler.setTimeout(fn, ms) };
      } catch (e) {
        onSignal('bridge-timer-failed', String(e).slice(0, 200));
        return null;
      }
    },
    disarm(h: unknown) {
      if (h === undefined) return;
      try {
        scheduler.clearTimeout(h);
      } catch {
        /* ignore */
      }
    },
  };
}
