// Offline first-launch plumbing for useDomMount (watchdog-gate.ts): injected deps, the content waiter, the unmount
// flag, and the launch record held back in memory while no cache exists on disk.
import { useRef, useState } from 'react';
import { loadContentBundle } from './content-bundle';
import { lastGoodSource } from './dom-reader-config';
import { createContentWaiter } from './watchdog-await-content';
import { startAttempt, type MountDecision, type WatchdogRecord } from './watchdog';

/** A storage write that never settles must not hang the launch: treat it as a failed attempt write (native). */
const ATTEMPT_WRITE_MAX_MS = 3000;

interface BoundScheduler {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (h: unknown) => void;
}

/** startAttempt bounded by ATTEMPT_WRITE_MAX_MS; a write that lands after the bound is rolled back through the same ordered writer so the next launch sees no false strike. */
export async function startAttemptBounded(
  decision: MountDecision,
  write: (r: WatchdogRecord) => Promise<boolean>,
  scheduler: BoundScheduler,
  stillWanted: () => boolean,
): Promise<WatchdogRecord | null> {
  let timer: unknown;
  const bound = new Promise<null>((resolve) => {
    timer = scheduler.setTimeout(() => resolve(null), ATTEMPT_WRITE_MAX_MS);
  });
  const started = startAttempt(decision, Date.now(), write, stillWanted);
  const attempt = await Promise.race([started, bound]);
  scheduler.clearTimeout(timer);
  if (!attempt) {
    void started.then((late) => {
      if (late) void write(decision.record);
    });
  }
  return attempt;
}

/** Injected so tests need no FileSystem. */
export interface GateDeps {
  hasLocalContent: () => boolean;
  loadContent: () => Promise<unknown>;
}
export const DEFAULT_DEPS: GateDeps = {
  hasLocalContent: () => lastGoodSource() !== null,
  loadContent: loadContentBundle,
};

export function useContentGate(deps: GateDeps) {
  const [contentFailed, setContentFailed] = useState(false);
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const unmountedRef = useRef(false);
  const waiterRef = useRef<ReturnType<typeof createContentWaiter> | null>(null);
  waiterRef.current ??= createContentWaiter(
    () => depsRef.current.loadContent(),
    setContentFailed,
    () => unmountedRef.current,
  );
  /** Set once at launch decision: no cache on disk. */
  const noContentRef = useRef(false);
  const launchWriteRef = useRef<(() => Promise<void>) | null>(null);
  const flushLaunchWrite = async () => {
    const f = launchWriteRef.current;
    launchWriteRef.current = null;
    await f?.();
  };
  return {
    contentFailed,
    depsRef,
    unmountedRef,
    waiterRef,
    noContentRef,
    launchWriteRef,
    flushLaunchWrite,
  };
}
