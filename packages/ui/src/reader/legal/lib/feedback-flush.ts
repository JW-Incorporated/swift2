import type { useHost } from '../../../host';
import {
  acquireLease,
  dequeue,
  postFeedback,
  readQueue,
  releaseLease,
  type QueuedFeedback,
} from './feedback-outbox';

type Host = ReturnType<typeof useHost>;

export type FlushResult = {
  sent: string[];
  /** An HTTP error (429/4xx/5xx): the item is dropped from the queue and surfaced, never retried. */
  http?: { item: QueuedFeedback; error: string };
  /** A transport failure: the item stays queued for one retry on `online`. */
  transport: boolean;
  /** Another tab/mount holds the lease or a flush is already in flight. */
  busy: boolean;
};

/**
 * Send queued reports in order, single-flight (in-flight guard + storage
 * lease). An item leaves the queue only after a 2xx, or on an HTTP error that
 * is shown to the user. Each POST carries the item's stable idempotency id.
 */
export async function flushQueue(
  host: Host,
  owner: string,
  inFlight: { current: boolean },
  context: () => { location: unknown; hp: string },
): Promise<FlushResult> {
  const result: FlushResult = { sent: [], transport: false, busy: false };
  if (inFlight.current || !acquireLease(host, owner)) {
    result.busy = true;
    return result;
  }
  inFlight.current = true;
  try {
    for (const item of readQueue(host)) {
      if (!acquireLease(host, owner)) {
        result.busy = true;
        break;
      }
      try {
        const res = await postFeedback(host, { id: item.id, message: item.message, ...context() });
        dequeue(host, item.id);
        if (res.kind === 'sent') {
          result.sent.push(item.id);
        } else {
          result.http = { item, error: res.error };
          break;
        }
      } catch {
        result.transport = true;
        break;
      }
    }
  } finally {
    inFlight.current = false;
    releaseLease(host, owner);
  }
  return result;
}
