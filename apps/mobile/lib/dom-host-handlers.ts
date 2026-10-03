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
