// "The user is mid-interaction" registry: a ClownBot ask in flight or a non-empty ClownBot/feedback draft, or an open
// feedback form. Reader components report their own key; the app DOM host forwards the aggregate to native on the
// `route` event so a content re-key (apps/mobile/lib/content-adoption.ts) never discards in-progress input. Module
// state, React-free; on the web nothing subscribes, so reporting is inert.
const busyKeys = new Set<string>();
const listeners = new Set<() => void>();

export function setBusy(key: string, busy: boolean): void {
  if (busy === busyKeys.has(key)) return;
  if (busy) busyKeys.add(key);
  else busyKeys.delete(key);
  for (const fn of [...listeners]) fn();
}

export const isBusy = (): boolean => busyKeys.size > 0;

export function subscribeBusy(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
