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
// App.tsx Modal renders `route` (null = no overlay) and owns hardware back
// while `nativeOwnsBack` is true. Presenting never touches insets or the host.
export interface NativeRouteState {
  route: string | null;
}

export type NativeRouteEvent =
  | { type: 'present'; path: string }
  | { type: 'dismiss' }
  | { type: 'back' }
  | { type: 'watchdog-fallback' };

export const INITIAL_NATIVE_ROUTE_STATE: NativeRouteState = { route: null };

// Root-relative app paths only; rejects empty, protocol-relative and
// scheme-bearing input so a bad navigate can never open an overlay.
export function isPresentablePath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.length > 1 &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !/[\\\s]/.test(path)
  );
}

export function reduceNativeRoute(
  state: NativeRouteState,
  event: NativeRouteEvent,
): NativeRouteState {
  switch (event.type) {
    case 'present':
      if (!isPresentablePath(event.path) || state.route === event.path) return state;
      return { route: event.path };
    case 'dismiss':
    case 'back':
    case 'watchdog-fallback':
      return state.route === null ? state : { route: null };
  }
}

export function nativeOwnsBack(state: NativeRouteState): boolean {
  return state.route !== null;
}
