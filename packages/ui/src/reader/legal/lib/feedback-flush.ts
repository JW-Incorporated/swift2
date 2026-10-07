import type { useHost } from '../../../host';
import { dequeue, postFeedback, readQueue, type QueuedFeedback } from './feedback-outbox';

type Host = ReturnType<typeof useHost>;

export type FlushResult = {
  sent: string[];
  /** An HTTP error (429/4xx/5xx): the item is dropped from the queue and surfaced, never retried. */
  http?: { item: QueuedFeedback; error: string };
  /** A transport failure (or a server-side 'already being sent' 409): the item stays queued for one retry. */
  transport: boolean;
  /** A flush is already in flight in this mount. */
  busy: boolean;
};

/**
 * Send queued reports in order, single-flight per mount (in-flight guard).
 * Same-id resends from two tabs are the server idempotency's job. An item
 * leaves the queue after a 2xx, or on an HTTP error that is shown to the user.
 * Each POST carries the item's stable idempotency id.
 */
export async function flushQueue(
  host: Host,
  inFlight: { current: boolean },
  context: () => { location: unknown; hp: string },
): Promise<FlushResult> {
  const result: FlushResult = { sent: [], transport: false, busy: false };
  if (inFlight.current) {
    result.busy = true;
    return result;
  }
  inFlight.current = true;
  try {
    for (const item of readQueue(host)) {
      try {
        const res = await postFeedback(host, { id: item.id, message: item.message, ...context() });
        if (res.kind === 'sent') {
          dequeue(host, item.id);
          result.sent.push(item.id);
        } else if (res.kind === 'pending') {
          result.transport = true;
          break;
        } else {
          // Deliberate: the text returns to the box and a resend is a new report.
          dequeue(host, item.id);
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
  }
  return result;
}
