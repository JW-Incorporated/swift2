// Open/closed state of the DOM settings overlay. It lives here (not in the packages/ui reader store, which
// slices may not edit): `createNavigateDom` opens it for /settings and /settings/notifications, the back
// responder closes it, and SettingsPage renders null while it is closed.
import { useSyncExternalStore } from 'react';

export const SETTINGS_PATHS: readonly string[] = ['/settings', '/settings/notifications'];
export const isSettingsPath = (pathname: string): boolean => SETTINGS_PATHS.includes(pathname);

let open = false;
const subs = new Set<() => void>();
const set = (next: boolean) => {
  if (open === next) return;
  open = next;
  for (const fn of [...subs]) fn();
};

export const settingsOverlay = {
  isOpen: () => open,
  open: () => set(true),
  close: () => set(false),
  subscribe: (fn: () => void) => {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
};

export const useSettingsOpen = (): boolean => useSyncExternalStore(settingsOverlay.subscribe, settingsOverlay.isOpen, () => false);

/** Test only. */
export function resetSettingsOverlayForTests(): void {
  open = false;
  subs.clear();
}
