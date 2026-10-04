// Ack bookkeeping for the bridge host (split from bridge-host.ts): `onAcked` waiters, the cumulative
// ack watermark, and seqs evicted from the outbox.
import type { Envelope } from '@swift2/ui';

export type AckRef = { epoch: number; seq: number };

type Waiter = { seq: number; cb: (acked: boolean) => void };

export function createAckTracker(o: {
  epoch: number;
  closed: () => boolean;
  outbox: () => { highest(): number; all(): Envelope[] };
  onSignal: (stage: string, detail?: string) => void;
}) {
  const waiters = new Set<Waiter>();
  const evicted = new Set<number>(); // seqs dropped unsent-or-unacked by outbox overflow
  let ackedThrough = 0;

  const safeCb = (cb: (acked: boolean) => void, acked: boolean) => {
    try {
      cb(acked);
    } catch (e) {
      o.onSignal('bridge-acked-hook-failed', String(e).slice(0, 200));
    }
  };
  function settle(pick: (w: { seq: number }) => boolean, acked: boolean) {
    for (const w of [...waiters]) {
      if (!pick(w)) continue;
      waiters.delete(w);
      safeCb(w.cb, acked);
    }
  }

  return {
    settle,
    size: () => waiters.size,
    /** The outbox dropped `seq` unacked. */
    evict(seq: number) {
      evicted.add(seq);
      if (evicted.size > 1024) evicted.delete(evicted.values().next().value as number);
      settle((w) => w.seq === seq, false);
    },
    /** The DOM's cumulative ack reached `n`. */
    acked(n: number) {
      if (n > ackedThrough) ackedThrough = n;
      settle((w) => w.seq <= n, true);
    },
    /**
     * One-shot: `cb(true)` when the DOM's cumulative ack reaches the ref's seq (at once if
     * it already has). `cb(false)` when it can no longer be acked: evicted from the outbox,
     * host disposed, or a ref from another host instance. A never-emitted seq is ignored.
     * Returns an unsubscribe. A delayed wire ack from a previous instance is
     * indistinguishable from the DOM here without an epoch on the wire (not added).
     */
    onAcked(ref: AckRef, cb: (acked: boolean) => void): () => void {
      const once = (acked: boolean) => {
        safeCb(cb, acked);
        return () => {};
      };
      if (ref.epoch !== o.epoch || o.closed()) return once(false);
      const seq = ref.seq;
      const outbox = o.outbox();
      if (!Number.isSafeInteger(seq) || seq < 1 || seq > outbox.highest()) return () => {};
      if (evicted.has(seq)) return once(false);
      if (seq <= ackedThrough) return once(true);
      if (!outbox.all().some((e) => e.seq === seq)) return once(false);
      const w = { seq, cb };
      waiters.add(w);
      return () => void waiters.delete(w);
    },
  };
}
