// Offline first-launch plumbing for useDomMount (watchdog-gate.ts): injected deps, the content waiter, the unmount
// flag, and the launch record held back in memory while no cache exists on disk.
import { useRef, useState } from 'react';
import { loadContentBundle } from './content-bundle';
import { lastGoodSource } from './dom-reader-config';
import { createContentWaiter, type ContentFailureKind } from './watchdog-await-content';
import { getForceDomFailure } from './diagnostics-override';
import { beginAttempt, startAttempt, type DomFailureMode, type MountDecision, type WatchdogRecord } from './watchdog';

/** A slow (not failed) attempt write must not hold the launch or become Recovery: after this the DOM mounts on the in-memory attempt. */
const ATTEMPT_WRITE_MAX_MS = 3000;
const FORCE_FAILURE_MAX_MS = 500;

interface BoundScheduler {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (h: unknown) => void;
}

/** startAttempt bounded by ATTEMPT_WRITE_MAX_MS. A write that FAILS returns null (fail closed: strikes could not be persisted). One that is merely slow proceeds with the in-memory attempt: the stuck write, when it lands, records a real attempt and the monitor's later writes queue behind it in order (no rollback: the DOM is mounting). */
export async function startAttemptBounded(
  decision: MountDecision,
  write: (r: WatchdogRecord) => Promise<boolean>,
  scheduler: BoundScheduler,
  stillWanted: () => boolean,
  onLateFailure: () => void = () => undefined,
): Promise<WatchdogRecord | null> {
  let timer: unknown;
  const bound = new Promise<'slow'>((resolve) => {
    timer = scheduler.setTimeout(() => resolve('slow'), ATTEMPT_WRITE_MAX_MS);
  });
  const started = startAttempt(decision, Date.now(), write, stillWanted);
  const attempt = await Promise.race([started, bound]);
  scheduler.clearTimeout(timer);
  if (attempt !== 'slow') return attempt;
  // Already mounting: a write that fails after this point is only observed, never flips the UI.
  void started.then((late) => late || onLateFailure());
  return beginAttempt(decision.record, Date.now());
}

/** The diagnostics failure drill is a SecureStore read: a slow one reads as 'off' rather than holding the launch. */
export async function boundedForceFailure(scheduler: BoundScheduler): Promise<DomFailureMode> {
  let timer: unknown;
  const slow = new Promise<DomFailureMode>((resolve) => {
    timer = scheduler.setTimeout(() => resolve('off'), FORCE_FAILURE_MAX_MS);
  });
  const mode = await Promise.race([getForceDomFailure().catch((): DomFailureMode => 'off'), slow]);
  scheduler.clearTimeout(timer);
  return mode;
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
  const [contentKind, setContentKind] = useState<ContentFailureKind>('server');
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const unmountedRef = useRef(false);
  const waiterRef = useRef<ReturnType<typeof createContentWaiter> | null>(null);
  waiterRef.current ??= createContentWaiter(
    () => depsRef.current.loadContent(),
    (failed, kind) => {
      setContentFailed(failed);
      if (kind) setContentKind(kind);
    },
    () => unmountedRef.current,
  );
  /** Set once at launch decision: no cache on disk. */
  const noContentRef = useRef(false);
  return {
    contentFailed,
    contentKind,
    depsRef,
    unmountedRef,
    waiterRef,
    noContentRef,
  };
}
