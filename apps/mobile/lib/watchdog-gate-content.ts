// Offline first-launch plumbing for useDomMount (watchdog-gate.ts): injected deps, the content waiter, the unmount
// flag, and the launch record held back in memory while no cache exists on disk.
import { useRef, useState } from 'react';
import { loadContentBundle } from './content-bundle';
import { lastGoodSource } from './dom-reader-config';
import { createContentWaiter } from './watchdog-await-content';

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
