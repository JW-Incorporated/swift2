// Diagnostics deep link (issue #4877): `longlive://diag` opens the Diagnostics panel for devices where both inset
// strips of the hot corner are untappable. Only the OS-delivered URL path (use-deep-links intake) calls
// `openDiagPanel`; the DOM bridge cannot reach it (`navigate` takes site paths, `openExternal` is https/mailto only,
// and the bridge never forwards a non-https scheme to Linking). The panel is the same one the 7-tap corner opens.
import { useSyncExternalStore } from 'react';

const DIAG_LINK = /^longlive:\/\/\/?diag\/?$/;

/** Exactly `longlive://diag` (or `longlive:///diag`, optional trailing slash). No query, fragment or subpath. */
export function isDiagLink(raw: unknown): boolean {
  return typeof raw === 'string' && DIAG_LINK.test(raw);
}

let open = false;
const listeners = new Set<() => void>();

function set(next: boolean): void {
  if (open === next) return;
  open = next;
  listeners.forEach((l) => l());
}

export const openDiagPanel = (): void => set(true);
export const closeDiagPanel = (): void => set(false);
export const isDiagPanelOpen = (): boolean => open;

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}

export function useDiagPanelOpen(): boolean {
  return useSyncExternalStore(subscribe, isDiagPanelOpen, isDiagPanelOpen);
}
