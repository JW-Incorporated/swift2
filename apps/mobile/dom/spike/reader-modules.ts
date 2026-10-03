// WP0.5b: lazy load of the real reader components, called only after
// `fill(snapshot)` (never import these statically: module-level constants
// would freeze empty). Metro evaluates a module on its first `require`, so a
// call-time require gives the same ordering as a dynamic import without
// async chunks, which Expo's DOM export cannot serialize (it fails with
// "Asset not found: __common"). Returns one component: era stream + moment
// detail + bottom nav inside the web AppProvider, plus the Android back bridge.
import { createElement, useEffect, useRef, type ComponentType } from 'react';
import { HostProvider } from '@swift2/ui';

type BackResult = 'handled' | 'exit';
export type ReaderProps = { backTick: number; onBack: (r: BackResult) => void };

export function loadReader(): ComponentType<ReaderProps> {
  const store = require('../../../web/lib/longlive/store') as typeof import('../../../web/lib/longlive/store');
  const theme = require('../../../web/lib/longlive/theme') as typeof import('../../../web/lib/longlive/theme');
  const experience = require('@swift2/experience') as typeof import('@swift2/experience');
  const stream = require('../../../web/components/longlive/EraStream') as typeof import('../../../web/components/longlive/EraStream');
  const detail = require('../../../web/components/longlive/MomentDetail') as typeof import('../../../web/components/longlive/MomentDetail');
  const nav = require('../../../web/components/longlive/BottomNav') as typeof import('../../../web/components/longlive/BottomNav');
  // The web adapter lives under apps/web, so the spike resolver swaps its next/image and
  // next/link imports for the DOM stubs: reader components get the same Image/Link seam here.
  const hostAdapter = require('../../../web/lib/host-adapter') as typeof import('../../../web/lib/host-adapter');
  const base = hostAdapter.createWebAdapter({ push() {}, replace() {} });
  // The DOM page is a null origin: app-relative assets (era art) load over the network from the canonical origin.
  const adapter = {
    ...base,
    resolveUrl: (path: string) => (path.startsWith('/') ? `${base.env.origin}${path}` : path),
  };

  function Shell({ backTick, onBack }: ReaderProps) {
    const { eraId, openItemId } = store.useAppState();
    const { closeItem } = store.useAppActions();
    const last = useRef(backTick);
    useEffect(() => {
      if (backTick === last.current) return;
      last.current = backTick;
      if (openItemId) {
        closeItem();
        onBack('handled');
      } else onBack('exit');
    }, [backTick]);
    return createElement(
      'div',
      { className: 'era-shell font-sans', style: theme.eraStyle(experience.getEra(eraId)) },
      createElement('main', null, createElement(stream.EraStream)),
      createElement(detail.MomentDetail),
      createElement(nav.BottomNav),
    );
  }

  return function Reader(props: ReaderProps) {
    return createElement(
      HostProvider,
      { adapter },
      createElement(store.AppProvider, null, createElement(Shell, props)),
    );
  };
}
