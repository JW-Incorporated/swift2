// Open/closed state of the DOM inbox overlay (WP W6-inbox-dom), the sibling of settings-store. `/inbox` (a native
// notification tap, the Settings row, adapter navigate) opens it; the back responder closes it; InboxOverlay renders
// null while closed. It stacks above the settings overlay, so closing it returns to Settings.
import { useSyncExternalStore } from 'react';

export { INBOX_PATH, isInboxPath } from './settings-paths';

let open = false;
const subs = new Set<() => void>();
const set = (next: boolean) => {
  if (open === next) return;
  open = next;
  for (const fn of [...subs]) fn();
};

export const inboxOverlay = {
  isOpen: () => open,
  open: () => set(true),
  close: () => set(false),
  subscribe: (fn: () => void) => {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
};

export const useInboxOpen = (): boolean => useSyncExternalStore(inboxOverlay.subscribe, inboxOverlay.isOpen, () => false);

/** Test only. */
export function resetInboxOverlayForTests(): void {
  open = false;
  subs.clear();
}
