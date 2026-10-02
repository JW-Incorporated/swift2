// Pure watchdog handlers for the shared-UI DOM host (WP0.4). Kept free of
// React/RN imports so the signals and the reload cap are unit-testable.
export type DomSignal = (stage: string, detail?: string) => void;

export const MAX_CRASH_RELOADS = 2;

export interface DomHostHandlerDeps {
  onSignal: DomSignal;
  reload: () => void;
  /** Called instead of reloading once the cap is hit. */
  onGiveUp: () => void;
  isAppActive: () => boolean;
  /** Runs `fn` the next time the app returns to the foreground. */
  onceFocused: (fn: () => void) => void;
  /** WP0.4b watchdog sink; optional so the WP0.4 signal tests stay valid. */
  watch?: {
    ready: () => void;
    error: (message: string) => void;
    crashed: (kind: 'terminated' | 'render-gone') => void;
  };
}

export function createDomHostHandlers(deps: DomHostHandlerDeps) {
  let crashReloads = 0;
  const recover = () => {
    if (crashReloads >= MAX_CRASH_RELOADS) {
      deps.onSignal('dom-reload-cap-reached');
      deps.onGiveUp();
      return;
    }
    crashReloads += 1;
    deps.reload();
  };
  return {
    onReady: async () => {
      deps.onSignal('dom-ready');
      deps.watch?.ready();
    },
    reportError: async (message: string) => {
      deps.onSignal('dom-error', message.slice(0, 200));
      deps.watch?.error(message);
    },
    onContentProcessDidTerminate: () => {
      deps.onSignal('dom-process-terminated');
      deps.watch?.crashed('terminated');
      recover();
    },
    onRenderProcessGone: () => {
      deps.onSignal('dom-render-process-gone');
      deps.watch?.crashed('render-gone');
      if (deps.isAppActive()) recover();
      else deps.onceFocused(recover);
    },
  };
}

/** Whether the shared-UI host replaces the native reader. */
export function sharedUiActive(flagOn: boolean, forcedOnThisDevice: boolean): boolean {
  return flagOn || forcedOnThisDevice;
}
