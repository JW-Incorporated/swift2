import { useEffect } from 'react';
import { CURRENT_ERA_ID } from '@swift2/experience';
import { setEngaged } from '../../bridge/engaged-signal';
import { useAppState, type AppState } from '../store';

/** Scroll depth (px) at which a reader counts as mid-read rather than resting at the top. */
export const ENGAGED_SCROLL_PX = 200;

type AwayState = Pick<AppState, 'mode' | 'eraId' | 'openItemId' | 'trackGuideEraId' | 'theoryGuideEraId' | 'selectorOpen' | 'searchOpen' | 'scrubbing' | 'crossing' | 'clownChatExpanded'>;

/** True when the reader is off the front door (current era, era mode) or has anything open. */
export const readerAway = (s: AwayState): boolean =>
  s.mode !== 'era' || s.eraId !== CURRENT_ERA_ID || s.openItemId !== null || s.trackGuideEraId !== null || s.theoryGuideEraId !== null ||
  s.selectorOpen || s.searchOpen || s.scrubbing || s.crossing !== null || s.clownChatExpanded;

/** Reports whether the reader is away from rest: off the front door, any overlay open, or scrolled down. Cleared on unmount. */
export function useReportEngaged(): void {
  const away = readerAway(useAppState());
  useEffect(() => {
    setEngaged('state', away);
    return () => setEngaged('state', false);
  }, [away]);
  useEffect(() => {
    const onScroll = () => setEngaged('scroll', window.scrollY >= ENGAGED_SCROLL_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      setEngaged('scroll', false);
    };
  }, []);
}
