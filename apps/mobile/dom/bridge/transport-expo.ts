import { useEffect, useMemo } from 'react';
import { createBridgeClient } from '@swift2/ui';
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
  /** Expo DOM native action; may resolve with a `res` envelope, which is fed back. */
  bridge: (env: Envelope) => Promise<unknown> | void;
};

export function createExpoBridgeClient(bridge: ExpoBridgeProps['bridge'], idGen: () => string): BridgeClient {
  const client: BridgeClient = createBridgeClient({
    now: () => Date.now(),
    idGen,
    post(env) {
      Promise.resolve(bridge(env)).then(
        (reply) => {
          if (reply !== undefined && reply !== null) client.receive(reply);
        },
        () => undefined,
      );
    },
  });
  return client;
}

let counter = 0;
const nextId = () => `d${Date.now().toString(36)}${(counter++).toString(36)}`;

/** One client per mount: feeds `inbox` into `consumeInbox`, posts via `bridge`. */
export function useExpoBridge({ inbox, bridge }: ExpoBridgeProps): BridgeClient {
  const client = useMemo(() => createExpoBridgeClient(bridge, nextId), []);
  useEffect(() => () => client.dispose(), [client]);
  useEffect(() => client.consumeInbox(inbox), [client, inbox]);
  return client;
}
