import { MAX_BATCH, MAX_RETAINED, isRec } from './client-util';
import { parseEnvelopeValue } from './envelope';
import type { Envelope } from './envelope';

const MAX_SCAN = 1024;

/**
 * Raw inbox entries held between consumes, keyed by seq. Only cheap type checks
 * happen on intake; `take` fully parses just the next MAX_BATCH.
 */
export function createInbox(lastSeq: () => number, onSignal?: (kind: string, detail?: number) => void) {
  const held = new Map<number, unknown>();
  return {
    /** Returns true when the delivery contained already-consumed seqs (the host may have lost our ack). */
    hold(inbox: readonly unknown[]): boolean {
      let stale = false;
      const n = Math.min(inbox.length, MAX_SCAN);
      for (let i = 0; i < n; i++) {
        const raw = inbox[i];
        if (!isRec(raw)) continue;
        const seq = raw.seq;
        if (typeof seq !== 'number' || !Number.isInteger(seq)) continue;
        if (seq > lastSeq()) held.set(seq, raw);
        else stale = true;
      }
      if (held.size > MAX_RETAINED) {
        const drop = held.size - MAX_RETAINED;
        for (const s of [...held.keys()].sort((a, b) => a - b).slice(0, drop)) held.delete(s);
        onSignal?.('inbox-dropped', drop);
      }
      return stale;
    },
    take(): Envelope[] {
      const envs: Envelope[] = [];
      for (const s of [...held.keys()].sort((a, b) => a - b).slice(0, MAX_BATCH)) {
        const parsed = parseEnvelopeValue(held.get(s));
        held.delete(s);
        if (parsed.ok && parsed.envelope.seq !== undefined) envs.push(parsed.envelope);
      }
      return envs;
    },
    clear: () => held.clear(),
  };
}
