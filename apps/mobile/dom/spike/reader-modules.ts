// WP0.5b: dynamic import of the real reader components, called only after
// `fill(snapshot)` (never import these statically: module-level constants
// would freeze empty). Returns one component: era stream + moment detail +
// bottom nav inside the web AppProvider, plus the Android back bridge.
import { createElement, useEffect, useRef, type ComponentType } from 'react';

type BackResult = 'handled' | 'exit';
export type ReaderProps = { backTick: number; onBack: (r: BackResult) => void };

export async function loadReader(): Promise<ComponentType<ReaderProps>> {
  const store = await import('../../../web/lib/longlive/store');
  const theme = await import('../../../web/lib/longlive/theme');
  const experience = await import('@swift2/experience');
  const stream = await import('../../../web/components/longlive/EraStream');
  const detail = await import('../../../web/components/longlive/MomentDetail');
  const nav = await import('../../../web/components/longlive/BottomNav');

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
    return createElement(store.AppProvider, null, createElement(Shell, props));
  };
}
