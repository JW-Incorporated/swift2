// DOM side of native-to-DOM `navigate` (W2-I): the notification tap gate emits it to a bound host.
// The reader reads its deep link (?item=, ?lens=, ?era=, ?mode=...) once on mount from the page URL, so
// routing is: rewrite the query on the page (search + hash only; the DOM page keeps its own path) and
// remount the reader. The client acks the sequenced event after this handler returns.
import type { EventPayloadOf } from '@swift2/ui';

export const NAVIGATE_SUBSCRIBER_STAGE = 'navigate-subscriber'; // must equal lib/tap-bind-epoch.ts (asserted in navigate-subscriber.test.ts)

export type NavigateDeps = {
  replaceUrl: (relative: string) => void;
  remount: () => void;
};

/** Returns false (and does nothing) for a path that does not parse. */
export function applyNavigateEvent(e: Pick<EventPayloadOf<'navigate'>, 'path'>, deps: NavigateDeps): boolean {
  let u: URL;
  try {
    u = new URL(e.path, 'http://dom.invalid');
  } catch {
    return false;
  }
  deps.replaceUrl(`${u.search || '?'}${u.hash}`);
  deps.remount();
  return true;
}

/**
 * Installs the subscriber, then announces it to native (`diag` stage) so the tap gate may bind. The diag
 * is queued by the client until the bridge is ready, so native sees it only after the handshake.
 */
export function installNavigateSubscriber(
  client: { on(type: 'navigate', fn: (e: EventPayloadOf<'navigate'>) => void): () => void; sendDiag(stage: string, detail?: string): void },
  deps: NavigateDeps,
): () => void {
  const off = client.on('navigate', (e) => void applyNavigateEvent(e, deps));
  client.sendDiag(NAVIGATE_SUBSCRIBER_STAGE);
  return off;
}
