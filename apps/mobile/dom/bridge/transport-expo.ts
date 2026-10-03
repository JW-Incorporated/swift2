import { useEffect, useMemo, useRef } from 'react';
import { createBridgeClient, monotonicIds } from '@swift2/ui';
import type { BridgeClient, Envelope } from '@swift2/ui';

/**
 * The ONE Expo-DOM-specific file on the DOM side (Fable REQUIRED 5): the
 * `inbox` prop and the `bridge` native action live here and in B's
 * SharedUiHost wiring, nowhere else. Not imported by ReaderSpike/SharedUiTest
 * until G0 (WP2.3-C step 3).
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
export function createExpoBridgeClient(bridge: ExpoBridgeProps['bridge'], idGen?: () => string): BridgeClient {
  return createBridgeClient({ now: () => Date.now(), idGen, queueUntilReady: true, post: (env) => bridge(env) });
}

/**
 * A client that survives dispose/re-mount (React StrictMode): `mount` sends
 * `ready` and its cleanup disposes the live client; the next access builds a
 * fresh one (a new session). One id source (seeded from `Date.now()`) is shared
 * across re-creations, so command ids are strictly increasing and never reused.
 */
export function createExpoBridge(bridge: ExpoBridgeProps['bridge'], idGen: () => string = monotonicIds(Date.now())) {
  let live: BridgeClient | null = null;
  const cur = (): BridgeClient => (live ??= createExpoBridgeClient(bridge, idGen));
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

/** One client per mount: `ready` on mount, then `inbox` into `consumeInbox`, posting via `bridge`. */
export function useExpoBridge({ inbox, bridge }: ExpoBridgeProps): BridgeClient {
  const ref = useRef(bridge);
  ref.current = bridge;
  const handle = useMemo(() => createExpoBridge((e) => ref.current(e)), []);
  useEffect(() => handle.mount(), [handle]);
  useEffect(() => handle.client.consumeInbox(inbox), [handle, inbox]);
  return handle.client;
}
