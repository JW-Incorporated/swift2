// The reader's current restorable state (mode/era/lens/open item/scroll), published by the reader and forwarded to native
// on the `route` event so a re-key (content adoption, crash recovery) can put the reader back (#5114). Module state,
// React-free; on the web nothing subscribes, so reporting is inert. Limits are the wire contract (native re-validates).
import type { ReaderSnap } from './messages';

export const MAX_SNAP_STR = 64;
export const MAX_SNAP_SCROLL = 1_000_000;
export const MAX_SNAP_COUNT = 200;

let current: ReaderSnap | null = null;
const listeners = new Set<() => void>();

export function setSnapshot(snap: ReaderSnap | null): void {
  current = snap;
  for (const fn of [...listeners]) fn();
}

export const getSnapshot = (): ReaderSnap | null => current;

export function subscribeSnapshot(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
