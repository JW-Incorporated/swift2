import type { Envelope } from '@swift2/ui';

export const OUTBOX_CAP = 256;

/**
 * Sequenced, un-acked native-to-DOM envelopes. Bounded: when full, the oldest
 * event is dropped to make room; requests are kept, and a new request that
 * finds only requests queued is refused (null).
 */
export function createOutbox(cap: number, onSignal: (stage: string, detail?: string) => void) {
  let seq = 0;
  let queue: Envelope[] = [];
  return {
    highest: () => seq,
    all: (): Envelope[] => queue.slice(),
    ack(n: number) {
      queue = queue.filter((q) => q.kind === 'cmd' || q.seq! > n);
    },
    remove(id: string) {
      queue = queue.filter((q) => q.id !== id);
    },
    clear() {
      queue = [];
    },
    push(env: Omit<Envelope, 'seq'>): Envelope | null {
      if (queue.length >= cap) {
        const i = queue.findIndex((q) => q.kind === 'evt');
        if (i >= 0) {
          queue.splice(i, 1);
          onSignal('bridge-queue-drop', 'oldest emit dropped');
        } else {
          onSignal('bridge-queue-full', env.kind);
          return null;
        }
      }
      const out: Envelope = { ...env, seq: ++seq };
      queue.push(out);
      return out;
    },
  };
}
