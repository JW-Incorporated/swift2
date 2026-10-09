// "The reader is away from its resting state" registry: not the front door, an overlay open, or scrolled down.
// The reader reports its own key; the app DOM host forwards the aggregate to native on the `route` event so a content
// re-key (apps/mobile/lib/content-adoption.ts) waits for an idle reader instead of dropping a mid-read user to the top
// of the front door. Module state, React-free; on the web nothing subscribes, so reporting is inert.
const engagedKeys = new Set<string>();
const listeners = new Set<() => void>();

export function setEngaged(key: string, engaged: boolean): void {
  if (engaged === engagedKeys.has(key)) return;
  if (engaged) engagedKeys.add(key);
  else engagedKeys.delete(key);
  for (const fn of [...listeners]) fn();
}

export const isEngaged = (): boolean => engagedKeys.size > 0;

export function subscribeEngaged(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
