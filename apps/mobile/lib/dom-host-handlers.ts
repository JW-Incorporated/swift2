// Pure signal handlers for the shared-UI DOM host (WP0.4 / WP0.4b). Kept free of
// React/RN imports so they are unit-testable. They only signal: recovery is the
// watchdog's strike -> native mount (lib/watchdog.ts), never an in-host reload.
export type DomSignal = (stage: string, detail?: string) => void;

export interface DomHostHandlerDeps {
  onSignal: DomSignal;
  watch: {
    ready: () => void;
    error: (message: string) => void;
    crashed: (kind: 'terminated' | 'render-gone') => void;
  };
}

export function createDomHostHandlers(deps: DomHostHandlerDeps) {
  return {
    onReady: async () => {
      deps.onSignal('dom-ready');
      deps.watch.ready();
    },
    reportError: async (message: string) => {
      deps.onSignal('dom-error', message.slice(0, 200));
      deps.watch.error(message);
    },
    onContentProcessDidTerminate: () => {
      deps.onSignal('dom-process-terminated');
      deps.watch.crashed('terminated');
    },
    onRenderProcessGone: () => {
      deps.onSignal('dom-render-process-gone');
      deps.watch.crashed('render-gone');
    },
  };
}

// Native-route presenter (One UI D-7). Native screens present modally over the
// still-mounted shared-UI host; this is the pure state behind that modal. The
// App.tsx Modal renders `route` and reports animation completion back via
// `opened(seq)` / `closed(seq)`. Native owns hardware back in every phase but
// idle (including closing, while the modal animates out). Presenting never
// touches insets or the host.
export type NativeRoutePhase = 'idle' | 'opening' | 'open' | 'closing';

export interface NativeRouteState {
  phase: NativeRoutePhase;
  route: string | null;
  // Presentation token: bumped on every new presentation and on watchdog
  // clear, so completion events from a superseded presentation are ignored.
  seq: number;
}

export type NativeRouteEvent =
  | { type: 'present'; path: string }
  | { type: 'opened'; seq: number }
  | { type: 'dismiss' }
  | { type: 'back' }
  | { type: 'closed'; seq: number }
  | { type: 'watchdog-fallback' };

export type NativeRouteResult = 'applied' | 'noop' | 'rejected' | 'stale';

export interface NativeRouteDeps {
  // The native route allow-list (routes native still owns). Required: an
  // unknown route must never open a blank overlay.
  isNativeRoute: (path: string) => boolean;
}

export const INITIAL_NATIVE_ROUTE_STATE: NativeRouteState = {
  phase: 'idle',
  route: null,
  seq: 0,
};

// Structural check only: root-relative, no control chars, whitespace,
// backslash, protocol-relative prefix or `..` segment (also percent-encoded).
// Query and hash are allowed; the allow-list decides which routes exist.
export function isPresentablePath(path: unknown): path is string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false;
  if (/[\u0000- \u007f\\]/.test(path)) return false;
  const pathname = path.split(/[?#]/, 1)[0];
  return !pathname.split('/').some((seg) => /^(\.|%2e){2}$/i.test(seg));
}

export function reduceNativeRoute(
  state: NativeRouteState,
  event: NativeRouteEvent,
  deps: NativeRouteDeps,
): { state: NativeRouteState; result: NativeRouteResult } {
  const noop = { state, result: 'noop' as const };
  switch (event.type) {
    case 'present': {
      if (!isPresentablePath(event.path) || !deps.isNativeRoute(event.path)) {
        return { state, result: 'rejected' };
      }
      if ((state.phase === 'opening' || state.phase === 'open') && state.route === event.path) {
        return noop;
      }
      return {
        state: { phase: 'opening', route: event.path, seq: state.seq + 1 },
        result: 'applied',
      };
    }
    case 'opened':
      if (state.phase !== 'opening' || event.seq !== state.seq) return { state, result: 'stale' };
      return { state: { ...state, phase: 'open' }, result: 'applied' };
    case 'dismiss':
    case 'back':
      if (state.phase === 'opening' || state.phase === 'open') {
        return { state: { ...state, phase: 'closing' }, result: 'applied' };
      }
      return noop;
    case 'closed':
      if (state.phase !== 'closing' || event.seq !== state.seq) return { state, result: 'stale' };
      return { state: { phase: 'idle', route: null, seq: state.seq }, result: 'applied' };
    case 'watchdog-fallback':
      if (state.phase === 'idle') return noop;
      return { state: { phase: 'idle', route: null, seq: state.seq + 1 }, result: 'applied' };
  }
}

export function nativeOwnsBack(state: NativeRouteState): boolean {
  return state.phase !== 'idle';
}

// D-7 contract: `presentNativeRoute(path)` is the single presenter. Thin stateful
// wrapper over the reducer; `onChange` lets App.tsx mirror state into React.
export function createNativeRoutePresenter(
  deps: NativeRouteDeps & { onChange?: (state: NativeRouteState) => void },
) {
  let state = INITIAL_NATIVE_ROUTE_STATE;
  const dispatch = (event: NativeRouteEvent): NativeRouteResult => {
    const next = reduceNativeRoute(state, event, deps);
    if (next.state !== state) {
      state = next.state;
      deps.onChange?.(state);
    }
    return next.result;
  };
  return {
    getState: () => state,
    presentNativeRoute: (path: string) => dispatch({ type: 'present', path }),
    opened: (seq: number) => dispatch({ type: 'opened', seq }),
    dismiss: () => dispatch({ type: 'dismiss' }),
    closed: (seq: number) => dispatch({ type: 'closed', seq }),
    // true = native consumed the back press (overlay phase != idle)
    handleBack: () => {
      const owns = nativeOwnsBack(state);
      dispatch({ type: 'back' });
      return owns;
    },
    clearOnWatchdogFallback: () => dispatch({ type: 'watchdog-fallback' }),
  };
}
