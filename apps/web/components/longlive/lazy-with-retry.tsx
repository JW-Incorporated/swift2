'use client';

import { Component, Suspense, lazy, useCallback, useState, type ComponentType, type ReactNode } from 'react';

/**
 * A code-split surface that survives its own chunk failing to load (offline
 * after first paint, a deploy that retired the chunk). The failure stays
 * inside this surface: an inline message with a retry that re-attempts the
 * import, while the rest of the reader keeps working. Only a load failure is
 * handled here; any other render error is rethrown to `app/error.tsx` so a
 * bug is never reported as a download problem. `next/dynamic` and a
 * bare `React.lazy` both cache the rejected import, so every retry builds a
 * fresh lazy component.
 */
function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return (
    <div role="alert" className="mx-auto max-w-3xl px-5 py-16 text-center">
      <p className="font-era text-2xl font-semibold leading-tight">
        {offline ? 'You’re offline' : 'This didn’t load'}
      </p>
      <p className="mt-3 text-[color:var(--era-ink-soft)]">
        {offline
          ? 'Reconnect, then try again. Everything else here still works.'
          : 'Something interrupted the download. Try again in a moment.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[color:var(--era-ink-soft)] px-6 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--era-accent)]"
      >
        Try again
      </button>
    </div>
  );
}

const importFailures = new WeakSet<object>();
const LOAD_FAILURE_MESSAGE = /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module|error loading dynamically imported|Importing a module script failed/i;

/** A chunk or import that failed to load, as opposed to a bug in the component once it rendered. */
export function isLoadFailure(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (importFailures.has(error)) return true;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return name === 'ChunkLoadError' || (typeof message === 'string' && LOAD_FAILURE_MESSAGE.test(message));
}

type BoundaryState = { error: unknown; caught: boolean };

class LoadBoundary extends Component<{ onRetry: () => void; children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null, caught: false };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error, caught: true };
  }

  componentDidCatch(error: unknown) {
    if (isLoadFailure(error)) console.error(error);
  }

  retry = () => {
    this.props.onRetry();
    this.setState({ error: null, caught: false });
  };

  render() {
    if (!this.state.caught) return this.props.children;
    if (!isLoadFailure(this.state.error)) throw this.state.error;
    return <LoadFailed onRetry={this.retry} />;
  }
}

export function lazyWithRetry<P extends object>(load: () => Promise<ComponentType<P>>): ComponentType<P> {
  let failed = false;
  const make = () =>
    lazy(() =>
      load().then(
        (component) => ({ default: component }),
        (err: unknown) => {
          failed = true;
          const failure = typeof err === 'object' && err !== null ? err : new Error(String(err));
          importFailures.add(failure);
          throw failure;
        },
      ),
    );
  let current = make();
  const fresh = () => {
    failed = false;
    current = make();
    return current;
  };

  return function RetryingLazy(props: P) {
    const [Loaded, setLoaded] = useState(() => (failed ? fresh() : current));
    const retry = useCallback(() => setLoaded(() => fresh()), []);
    return (
      <LoadBoundary onRetry={retry}>
        <Suspense fallback={null}>
          <Loaded {...props} />
        </Suspense>
      </LoadBoundary>
    );
  };
}
