// Pure signal handlers for the shared-UI DOM host (WP0.4 / WP0.4b). Kept free of
// React/RN imports so they are unit-testable. They only signal: recovery is the
// watchdog's strike -> native mount (lib/watchdog.ts). The one exception is a
// post-ready webview process termination: the monitor answers 'reload' and the
// host re-keys its mount once (a repeat strikes).
import type { CrashOutcome } from './watchdog';

export type DomSignal = (stage: string, detail?: string) => void;

export interface DomHostHandlerDeps {
  onSignal: DomSignal;
  watch: {
    ready: () => void;
    error: (message: string) => void;
    crashed: (kind: 'terminated' | 'render-gone') => CrashOutcome | undefined | void;
    protocol?: () => void;
  };
  // True once this host epoch is closed: a late DOM protocol-fatal must not strike the watchdog.
  bridgeClosed?: () => boolean;
  // The Expo DOM `bridge` native action target (createBridgeLink().bridge); absent in unit tests.
  bridge?: (env: unknown) => Promise<unknown>;
  // Re-keys the DOM mount (a fresh epoch); called only when the watchdog answers 'reload'.
  reload?: () => void;
}

function crash(deps: DomHostHandlerDeps, stage: string, kind: 'terminated' | 'render-gone') {
  deps.onSignal(stage);
  const outcome = deps.watch.crashed(kind);
  if (outcome === 'reload') {
    deps.onSignal('dom-reload-after-crash', kind);
    deps.reload?.();
  } else if (outcome === 'strike') {
    deps.onSignal('dom-crash-strike', kind);
  }
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
    // Forwards one DOM envelope to the bridge host; resolves with the envelope the DOM is awaiting, if any.
    bridge: async (env: unknown): Promise<unknown> => deps.bridge?.(env),
    // The DOM client's own protocol fatal (ready-failed, id-space-exhausted): a strike in every phase, unlike reportError.
    reportProtocolFatal: async (reason: string) => {
      if (deps.bridgeClosed?.()) return;
      deps.onSignal('dom-protocol-fatal', String(reason).slice(0, 200));
      deps.watch.protocol?.();
    },
    onContentProcessDidTerminate: () => {
      crash(deps, 'dom-process-terminated', 'terminated');
    },
    onRenderProcessGone: () => {
      crash(deps, 'dom-render-process-gone', 'render-gone');
    },
  };
}

// Transport between the pure bridge host and the Expo DOM boundary. The host
// sends sequenced envelopes (native-to-DOM events/commands), which ride the
// `inbox` prop; unsequenced ones (a `res` to a DOM command, `readyAck`) ride the
// resolved value of the `bridge` action that carried the request. Pure: React
// state is reached only through `onInbox`.
// One link per host (epoch): after `dispose` every `bridge` call REJECTS (the DOM
// client fails the call at once and a stale epoch can never strike the watchdog).
// A second pending waiter on the same key never overwrites the first: a duplicate
// command id rejects the older call; a repeated `ready` (retry or webview reload)
// releases the older ones with no reply, and a reload also releases every
// pending command (their client is gone).
type LinkEnvelope = { kind: string; id: string; type: string; seq?: number };
export interface BridgeLinkHost {
  receive: (raw: unknown) => void;
  inbox: () => unknown[];
}

export function sameInbox(a: readonly unknown[], b: readonly unknown[]): boolean {
  const seq = (list: readonly unknown[], i: number) => (list[i] as { seq?: number } | undefined)?.seq;
  return a.length === b.length && seq(a, 0) === seq(b, 0) && seq(a, a.length - 1) === seq(b, b.length - 1);
}

type Waiter = { resolve: (env: unknown) => void; reject: (e: Error) => void };

export function createBridgeLink(onInbox: () => void) {
  let host: BridgeLinkHost | null = null;
  let closed = false;
  const waiters = new Map<string, Waiter>();
  const release = (key: string, env: unknown) => {
    const w = waiters.get(key);
    if (!w) return;
    waiters.delete(key);
    w.resolve(env);
  };
  const wait = (key: string) =>
    new Promise<unknown>((resolve, reject) => {
      const older = waiters.get(key);
      if (older) {
        waiters.delete(key);
        if (key === 'ready') older.resolve(undefined);
        else older.reject(new Error('superseded bridge call'));
      }
      waiters.set(key, { resolve, reject });
    });
  return {
    attach(h: BridgeLinkHost) {
      host = h;
    },
    isClosed: () => closed,
    send(env: LinkEnvelope) {
      if (closed) return;
      if (env.seq !== undefined) onInbox();
      else if (env.kind === 'res') release(`res:${env.id}`, env);
      else if (env.type === 'readyAck') release('ready', env);
    },
    bridge(raw: unknown): Promise<unknown> {
      if (closed || !host) return Promise.reject(new Error('bridge closed'));
      const env = raw as Partial<LinkEnvelope> | null;
      const isReady = env?.kind === 'evt' && env.type === 'ready';
      if (isReady) for (const key of [...waiters.keys()]) if (key !== 'ready') release(key, undefined);
      const key = isReady ? 'ready' : env?.kind === 'cmd' && typeof env.id === 'string' ? `res:${env.id}` : null;
      const answered = key ? wait(key) : Promise.resolve(undefined);
      host.receive(raw);
      onInbox();
      return answered;
    },
    // Closes the link: pending calls reject and later ones reject at once.
    dispose() {
      closed = true;
      host = null;
      for (const w of [...waiters.values()]) w.reject(new Error('bridge closed'));
      waiters.clear();
    },
  };
}

// Native-route presenter (One UI D-7). Native screens present modally over the
// still-mounted shared-UI host; this is the pure state behind that modal. The
// App.tsx Modal renders `route` and reports animation completion back via
// `opened(seq)` / `closed(seq)`. Native owns hardware back in every phase but
// idle (including closing, while the modal animates out). Presenting never
// touches insets or the host.
//
// Deadlines (Fable ruling 2026-10-03): opening/closing carry `deadlineAt`, so a
// lost animation callback cannot wedge back ownership. App.tsx (2.4-D) MUST
// schedule one `tick` after each 'applied' transition into opening/closing
// (setTimeout(deadlineAt - now)), and SHOULD log 'stale' results: an early
// `opened` that arrives stale means OPEN_MS is too low on slow devices.
// `now` is always passed in; this module never reads the clock.
export const OPEN_MS = 1500;
export const CLOSE_MS = 1000;

export type NativeRoutePhase = 'idle' | 'opening' | 'open' | 'closing';

export interface NativeRouteState {
  phase: NativeRoutePhase;
  route: string | null;
  // Presentation token: bumped on every new presentation and on reset, so
  // completion events from a superseded presentation are ignored.
  seq: number;
  // Set only in opening/closing; null in idle/open.
  deadlineAt: number | null;
}

export type NativeRouteEvent =
  | { type: 'present'; path: string; now: number }
  | { type: 'opened'; seq: number }
  | { type: 'dismiss'; now: number }
  | { type: 'back'; now: number }
  | { type: 'closed'; seq: number }
  | { type: 'tick'; now: number }
  | { type: 'reset' };

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
  deadlineAt: null,
};

// Structural check only: root-relative, no control chars, whitespace,
// backslash, protocol-relative prefix or `..` segment (also percent-encoded).
// Query and hash are allowed; the allow-list decides which routes exist.
export function isPresentablePath(path: unknown): path is string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false;
  // eslint-disable-next-line no-control-regex -- intentionally rejects control chars in route paths (#4934)
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
  const stale = { state, result: 'stale' as const };
  switch (event.type) {
    case 'present': {
      if (!isPresentablePath(event.path) || !deps.isNativeRoute(event.path)) {
        return { state, result: 'rejected' };
      }
      if ((state.phase === 'opening' || state.phase === 'open') && state.route === event.path) {
        return noop;
      }
      return {
        state: {
          phase: 'opening',
          route: event.path,
          seq: state.seq + 1,
          deadlineAt: event.now + OPEN_MS,
        },
        result: 'applied',
      };
    }
    case 'opened':
      if (state.phase !== 'opening' || event.seq !== state.seq) return stale;
      return { state: { ...state, phase: 'open', deadlineAt: null }, result: 'applied' };
    case 'dismiss':
    case 'back':
      if (state.phase === 'opening' || state.phase === 'open') {
        return {
          state: { ...state, phase: 'closing', deadlineAt: event.now + CLOSE_MS },
          result: 'applied',
        };
      }
      return noop;
    case 'closed':
      if (state.phase !== 'closing' || event.seq !== state.seq) return stale;
      return { state: { ...state, phase: 'idle', route: null, deadlineAt: null }, result: 'applied' };
    case 'tick': {
      if (state.deadlineAt === null || event.now < state.deadlineAt) return noop;
      if (state.phase === 'opening') {
        return { state: { ...state, phase: 'open', deadlineAt: null }, result: 'applied' };
      }
      if (state.phase === 'closing') {
        return {
          state: { ...state, phase: 'idle', route: null, deadlineAt: null },
          result: 'applied',
        };
      }
      return noop;
    }
    case 'reset':
      if (state.phase === 'idle') return noop;
      return {
        state: { phase: 'idle', route: null, seq: state.seq + 1, deadlineAt: null },
        result: 'applied',
      };
  }
}

export function nativeOwnsBack(state: NativeRouteState): boolean {
  return state.phase !== 'idle';
}

// Delay for the one `tick` App.tsx schedules after an opening/closing transition;
// null when no deadline is pending.
export function msUntilDeadline(state: NativeRouteState, now: number): number | null {
  return state.deadlineAt === null ? null : Math.max(0, state.deadlineAt - now);
}

// D-7 contract: `presentNativeRoute(path)` is the single presenter. Thin stateful
// wrapper over the reducer; `onChange` lets App.tsx mirror state into React and
// `now` is the injected clock (e.g. Date.now) used to stamp events.
export function createNativeRoutePresenter(
  deps: NativeRouteDeps & { now: () => number; onChange?: (state: NativeRouteState) => void },
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
    presentNativeRoute: (path: string) => dispatch({ type: 'present', path, now: deps.now() }),
    opened: (seq: number) => dispatch({ type: 'opened', seq }),
    dismiss: () => dispatch({ type: 'dismiss', now: deps.now() }),
    closed: (seq: number) => dispatch({ type: 'closed', seq }),
    tick: () => dispatch({ type: 'tick', now: deps.now() }),
    // true = native consumed the back press (overlay phase != idle)
    handleBack: () => {
      const owns = nativeOwnsBack(state);
      dispatch({ type: 'back', now: deps.now() });
      return owns;
    },
    clearOnWatchdogFallback: () => dispatch({ type: 'reset' }),
  };
}


// The DOM surface (host + overlay Modal) is rendered only for mount 'dom' and not
// while the update-required screen preempts it. Anything else must drop the overlay,
// or a stale 'open' phase would keep owning hardware back with nothing on screen.
export function domSurfaceRendered(mount: string, updateRequired: boolean): boolean {
  return mount === 'dom' && !updateRequired;
}

export function reconcileOverlay(
  presenter: { clearOnWatchdogFallback: () => NativeRouteResult },
  rendered: boolean,
): NativeRouteResult {
  return rendered ? 'noop' : presenter.clearOnWatchdogFallback();
}
