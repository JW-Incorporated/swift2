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
    // 'reload' only after the post-ready attempt record was persisted as unresolved (the gate awaits that write).
    crashed: (kind: 'terminated' | 'render-gone') => CrashOutcome | undefined | void | Promise<CrashOutcome | undefined | void>;
    protocol?: () => void;
  };
  // True once this host epoch is closed: a late DOM protocol-fatal must not strike the watchdog.
  bridgeClosed?: () => boolean;
  // The Expo DOM `bridge` native action target (createBridgeLink().bridge); absent in unit tests.
  bridge?: (env: unknown) => Promise<unknown>;
  // Re-keys the DOM mount (a fresh epoch); called only when the watchdog answers 'reload'.
  reload?: () => void;
  // Epoch fence: false once this host's epoch was superseded or crashed. Every DOM-originated signal is ignored then.
  isCurrent?: () => boolean;
  // Closes this epoch synchronously (before any React commit), so late signals from the dead webview are fenced.
  invalidate?: () => void;
  // Runs fn now, or once the app is active (Android render-process-gone, as Expo's own default recovery did).
  whenActive?: (fn: () => void) => void;
}

const live = (deps: DomHostHandlerDeps) => deps.isCurrent?.() !== false;

function crash(deps: DomHostHandlerDeps, stage: string, kind: 'terminated' | 'render-gone', defer?: DomHostHandlerDeps['whenActive']): Promise<void> {
  if (!live(deps)) return Promise.resolve();
  deps.onSignal(stage);
  deps.invalidate?.();
  const settle = async () => {
    const outcome = await deps.watch.crashed(kind);
    if (outcome === 'reload') {
      deps.onSignal('dom-reload-after-crash', kind);
      deps.reload?.();
    } else if (outcome === 'strike') {
      deps.onSignal('dom-crash-strike', kind);
    }
  };
  if (!defer) return settle();
  return new Promise<void>((resolve) => defer(() => void settle().then(resolve)));
}

export function createDomHostHandlers(deps: DomHostHandlerDeps) {
  return {
    onReady: async () => {
      if (!live(deps)) return;
      deps.onSignal('dom-ready');
      deps.watch.ready();
    },
    reportError: async (message: string) => {
      if (!live(deps)) return;
      deps.onSignal('dom-error', message.slice(0, 200));
      deps.watch.error(message);
    },
    // Forwards one DOM envelope to the bridge host; resolves with the envelope the DOM is awaiting, if any.
    bridge: async (env: unknown): Promise<unknown> => {
      if (!live(deps)) throw new Error('stale epoch');
      return deps.bridge?.(env);
    },
    // The DOM client's own protocol fatal (ready-failed, id-space-exhausted): a strike in every phase, unlike reportError.
    reportProtocolFatal: async (reason: string) => {
      if (deps.bridgeClosed?.() || !live(deps)) return;
      deps.onSignal('dom-protocol-fatal', String(reason).slice(0, 200));
      deps.watch.protocol?.();
    },
    onContentProcessDidTerminate: () => crash(deps, 'dom-process-terminated', 'terminated'),
    onRenderProcessGone: () => crash(deps, 'dom-render-process-gone', 'render-gone', deps.whenActive),
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

// Native-route presenter (One UI D-7) lives in ./native-route; re-exported so importers are unchanged.
export * from './native-route';
