// WP2.3-E2 (H3): serialized intake of notification responses (pure; expo is injected).
// The cold read (get + enqueue + clear) and every live response run on ONE chain, so a
// live tap can never interleave with the cold read's clear of the process-global
// "last response". Only the cold path clears: the live listener already delivered its response.
import { tapFromResponse, type RawResponse, type TapGate } from './notification-tap-gate';

export interface TapIngestPorts {
  getLast(): Promise<RawResponse | null>;
  clearLast(): Promise<void>;
  /** Subscribes to live responses; returns the unsubscribe. */
  listen(cb: (resp: RawResponse | null) => void): () => void;
}

export function startTapIngest(gate: Pick<TapGate, 'enqueue'>, ports: TapIngestPorts): () => void {
  let stopped = false;
  let chain: Promise<void> = Promise.resolve();
  const step = (run: () => Promise<void>) => {
    chain = chain.then(run).catch(() => {});
  };
  const ingest = (resp: RawResponse | null) => {
    const tap = tapFromResponse(resp);
    if (tap) gate.enqueue(tap);
  };
  const off = ports.listen((resp) =>
    step(async () => {
      if (!stopped) ingest(resp);
    }),
  );
  step(async () => {
    const resp = await ports.getLast();
    if (stopped) return;
    ingest(resp);
    if (resp) await ports.clearLast().catch(() => {});
  });
  return () => {
    stopped = true;
    off();
  };
}
