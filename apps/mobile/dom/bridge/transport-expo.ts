import { useEffect, useMemo, useRef } from 'react';
import { createBridgeClient, monotonicIds } from '@swift2/ui';
import type { BridgeClient, ClientOptions, Envelope, IdSource } from '@swift2/ui';

/**
 * The ONE Expo-DOM-specific file on the DOM side (Fable REQUIRED 5): the
 * `inbox` prop and the `bridge` native action live here and in B's
 * SharedUiHost wiring, nowhere else. Used by ReaderSpike (`ExpoBridgeMount`) when the
 * host supplies `bridge`; SharedUiTest does not use it.
 */
export type ExpoBridgeProps = {
  /** Sequenced native-to-DOM queue, re-delivered whole on every render. */
  inbox: readonly Envelope[];
  /** Expo DOM native action; may resolve with a `res` envelope, which is fed back. A rejection fails the call at once. */
  bridge: (env: Envelope) => Promise<unknown> | void;
};

/**
 * Calls made before the `ready` post succeeds are queued in order and flushed
 * after it. The action's promise is returned to the client, which feeds a
 * resolved `res` back and fails the call immediately on rejection.
 */
export type ExpoBridgeHooks = Pick<ClientOptions, 'onFatal' | 'onSignal' | 'setTimer' | 'clearTimer'>;

export function createExpoBridgeClient(bridge: ExpoBridgeProps['bridge'], idGen?: IdSource, hooks: ExpoBridgeHooks = {}): BridgeClient {
  return createBridgeClient({ ...hooks, now: () => Date.now(), idGen, queueUntilReady: true, post: (env) => bridge(env) });
}

/**
 * A client that survives dispose/re-mount (React StrictMode): `mount` sends
 * `ready` and its cleanup disposes the live client; the next access builds a
 * fresh one (a new session). One id source (seeded from `Date.now()`) is shared
 * across re-creations, so command ids are strictly increasing and never reused.
 */
export function createExpoBridge(bridge: ExpoBridgeProps['bridge'], idGen: IdSource = monotonicIds(Date.now()), hooks: ExpoBridgeHooks = {}) {
  let live: BridgeClient | null = null;
  const cur = (): BridgeClient => (live ??= createExpoBridgeClient(bridge, idGen, hooks));
  const client: BridgeClient = {
    call: (type, payload, o) => cur().call(type, payload, o),
    on: (type, fn) => cur().on(type, fn),
    handle: (type, fn) => cur().handle(type, fn),
    receive: (raw) => cur().receive(raw),
    consumeInbox: (inbox) => cur().consumeInbox(inbox),
    sendDiag: (stage, detail) => cur().sendDiag(stage, detail),
    sendReady: () => cur().sendReady(),
    dispose: () => {
      live?.dispose();
      live = null;
    },
  };
  return {
    client,
    mount() {
      client.sendReady();
      return () => client.dispose();
    },
  };
}

/**
 * One client per mount: `ready` on mount, then `inbox` into `consumeInbox`, posting via `bridge`.
 * `setup` runs against the live client after `ready` is posted and BEFORE the inbox is consumed
 * (events consumed with no subscriber are lost); return its unsubscribe.
 */
export function useExpoBridge({ inbox, bridge }: ExpoBridgeProps, hooks: ExpoBridgeHooks = {}, setup?: (client: BridgeClient) => void | (() => void)): BridgeClient {
  const ref = useRef(bridge);
  ref.current = bridge;
  const hooksRef = useRef(hooks);
  hooksRef.current = hooks;
  const setupRef = useRef(setup);
  setupRef.current = setup;
  const handle = useMemo(
    () => createExpoBridge((e) => ref.current(e), undefined, { onFatal: (r) => hooksRef.current.onFatal?.(r), onSignal: (k, d) => hooksRef.current.onSignal?.(k, d) }),
    [],
  );
  useEffect(() => handle.mount(), [handle]);
  useEffect(() => setupRef.current?.(handle.client), [handle]);
  useEffect(() => handle.client.consumeInbox(inbox), [handle, inbox]);
  return handle.client;
}
