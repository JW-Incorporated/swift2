// DOM-side navigation + bridge subscriptions for AppReader (D2), kept React-free so the real host/client
// round trip is testable under node. `createNavigateDom` is the adapter's in-DOM navigation; `installReaderBridge`
// is the setup the Expo mount runs against the live client (after `ready`, before the inbox is consumed).
import type { BridgeClient, Insets } from '@swift2/ui';
import { installNavigateSubscriber, type NavigateDeps } from './navigate-subscriber';

export type NavigateDomDeps = {
  replaceUrl: (relative: string) => void;
  /** The ReaderBridge applier, null until the reader is mounted. */
  applier: () => ((search: string) => Promise<void>) | null;
  openNative: (path: string) => void;
};

/**
 * Adapter `navigateDom`: reader paths (pathname `/`) are applied through the store (query kept in the page URL
 * so the next mount reads the same deep link); every other path the reader has no in-DOM page for is handed to
 * native, whose presenter opens it or answers `invalid` (a no-op here), never a DOM dead end.
 */
export function createNavigateDom(d: NavigateDomDeps) {
  return (path: string): void => {
    const u = new URL(path, 'http://dom.invalid');
    if (u.pathname !== '/') return d.openNative(path);
    d.replaceUrl(`${u.search || '?'}${u.hash}`);
    void d.applier()?.(u.search).catch(() => {});
  };
}

export type ReaderBridgeHandlers = {
  onInsets: (insets: Insets) => void;
  onContentVersion: (token: string) => void;
  back: () => 'handled' | 'exit';
  nav: NavigateDeps;
};

export function installReaderBridge(client: BridgeClient, h: ReaderBridgeHandlers): () => void {
  const offs = [
    client.on('insets', h.onInsets),
    client.on('contentVersion', (e) => h.onContentVersion(e.token)),
    client.handle('back', () => h.back()),
    installNavigateSubscriber(client, h.nav),
  ];
  return () => offs.forEach((off) => off());
}
