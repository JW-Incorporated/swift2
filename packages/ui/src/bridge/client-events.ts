import type { JsonValue } from './envelope';

/** DOM events that wait for the handshake like calls do (the host rejects pre-ready events). `diag`/`ready`/`ack` pass straight through. */
export type QueuedEventType = 'navReady' | 'navigated' | 'theme';
export const MAX_QUEUED_EVENTS = 32;

type Entry = { type: string; id?: string; transmit(): void; resolve(r: never): void; evt?: { type: QueuedEventType; payload: JsonValue } };

/**
 * Adds a pre-ready event to the shared call queue (flush keeps arrival order). `theme` coalesces in
 * place: the queued entry keeps its position and takes the newest payload. At the cap the oldest
 * queued event is dropped (`event-dropped`). Returns the new queue.
 */
export function queueEvent<E extends Entry>(
  queue: E[],
  type: QueuedEventType,
  payload: JsonValue,
  post: (payload: JsonValue) => void,
  onSignal?: (kind: string, detail?: number) => void,
): E[] {
  if (type === 'theme') {
    const existing = queue.find((e) => e.evt?.type === 'theme');
    if (existing?.evt) {
      existing.evt.payload = payload;
      return queue;
    }
  }
  let next = queue;
  if (queue.filter((e) => e.evt).length >= MAX_QUEUED_EVENTS) {
    const oldest = queue.find((e) => e.evt);
    next = queue.filter((e) => e !== oldest);
    onSignal?.('event-dropped');
  }
  const evt = { type, payload };
  const entry = { type, evt, resolve: () => undefined, transmit: () => post(evt.payload) } as unknown as E;
  return [...next, entry];
}
