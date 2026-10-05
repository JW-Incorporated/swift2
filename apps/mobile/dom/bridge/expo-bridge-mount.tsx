// Split out of AppReader (300-line cap): the native-bridge mount and its shared types. Pure move.
import { useEffect } from 'react';
import { resErr, type BridgeClient, type Insets } from '@swift2/ui';
import type { NavigateDeps } from './navigate-subscriber';
import { backFromDomPath } from './dom-path';
import { startRouteReporting } from './route-report';
import { installReaderBridge } from './reader-nav';
import { useExpoBridge } from './transport-expo';
import type { AppReaderProps } from '../AppReader';

export type BackFn = () => 'handled' | 'exit';
export type ReaderClient = Pick<BridgeClient, 'call' | 'sendDiag' | 'sendEvent'>;
type MountProps = Required<Pick<AppReaderProps, 'inbox' | 'bridge'>> & Pick<AppReaderProps, 'bridgeHello'> & {
  onFatal: (reason: string) => void;
  onInsets: (insets: Insets) => void;
  onContentVersion: (token: string) => void;
  navigateDeps: NavigateDeps;
  backRef: { current: BackFn | null };
  onClient: (client: ReaderClient) => void;
};

/** Web/dev (no native host): the bridge calls the adapter makes fail closed. */
export const NO_BRIDGE: ReaderClient = { call: (async () => resErr('failed', 'no bridge')) as ReaderClient['call'], sendDiag: () => {}, sendEvent: () => {} };

/** Renders nothing: sends `ready` after mount, subscribes the native events and the back responder, drains the inbox, and shares its client (the adapter uses the same one). Mounted only where a native host supplies `bridge`. */
export function ExpoBridgeMount({ inbox, bridge, bridgeHello, onFatal, onInsets, onContentVersion, navigateDeps, backRef, onClient }: MountProps) {
  const client = useExpoBridge({ inbox, bridge, bridgeHello }, { onFatal }, (c) =>
    installReaderBridge(c, { onInsets, onContentVersion, back: () => (backFromDomPath() ? 'handled' : (backRef.current?.() ?? 'exit')), nav: navigateDeps }),
  );
  useEffect(() => onClient(client), [client]);
  useEffect(() => startRouteReporting((payload) => client.sendEvent('route', payload)), [client]);
  return null;
}
