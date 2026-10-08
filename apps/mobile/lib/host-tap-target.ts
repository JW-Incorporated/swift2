import { Linking } from 'react-native';
import type { WebPath } from '@swift2/ui';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes';
import { resolveDestination } from './destination-resolver';
import type { DomSignal } from './dom-host-handlers';
import type { BridgeHost } from './bridge-host';
import { createTapTarget } from './tap-bind-epoch';

const SITE_FALLBACK = 'https://www.longlivets.com';

export interface HostNavRef {
  current: { siteUrl?: string; presentNativeRoute?: (path: WebPath) => unknown };
}

/** The per-epoch tap target (SharedUiHost) plus its gate wrapper: a tap/deep-link/native navigation outranks a pending state restore (content adoption). */
export function createHostTapTarget(host: BridgeHost, onSignal: DomSignal, navRef: HostNavRef, userNavigated: () => void) {
  const destination = (p: string) => resolveDestination(p, { isHostRoute, siteUrl: navRef.current.siteUrl ?? SITE_FALLBACK });
  const target = createTapTarget({
    host,
    onGiveUp: () => onSignal('bridge-nav-gave-up'),
    onRejected: (p) => onSignal('bridge-nav-rejected', p.slice(0, 120)),
    canonicalize: (p) => destination(p).path,
    isReaderPath: (p) => destination(p).kind === 'dom',
    openElsewhere: async (p) => {
      if (isHostRoute(p)) {
        const r = navRef.current.presentNativeRoute?.(p as WebPath);
        return r === 'applied' || r === 'noop';
      }
      await Linking.openURL(new URL(p, navRef.current.siteUrl ?? SITE_FALLBACK).toString());
      return true;
    },
  });
  const gateTarget = { ...target, emit: ((t: 'navigate', p: never) => (userNavigated(), target.emit(t, p))) as typeof target.emit, navigateDom: (p: string) => (userNavigated(), target.navigateDom(p)) };
  return { target, gateTarget };
}
