import { useEffect, useRef } from 'react';
import { getEra } from '@swift2/experience';
import type { ReaderSnap } from '../../bridge/messages';
import { MAX_SNAP_COUNT, MAX_SNAP_SCROLL, MAX_SNAP_STR, setSnapshot } from '../../bridge/snapshot-signal';
import { useAppActions, useAppState, type AppState } from '../store';
import type { EraScrollSnapshot } from '../store/navigation';

const short = (s: string | null | undefined): string | undefined => (s && s.length <= MAX_SNAP_STR ? s : undefined);

/** The restorable slice of reader state: mode/era/lens and an open item overlay (guides, search and chat are dropped), plus the era-stream position. */
export function buildReaderSnap(s: Pick<AppState, 'mode' | 'eraId' | 'lensId' | 'openItemId'>, era: EraScrollSnapshot | null, scrollY: number): ReaderSnap | null {
  const mode = short(s.mode);
  const eraId = short(getEra(s.eraId).id);
  if (!mode || !eraId) return null;
  const lens = short(s.lensId);
  const itemId = short(s.openItemId);
  const anchorId = era ? short(era.anchorId) : undefined;
  return {
    v: 1,
    mode,
    eraId,
    ...(lens ? { lens } : {}),
    ...(itemId ? { itemId } : {}),
    ...(anchorId && era ? { anchorId, count: Math.min(Math.max(Math.trunc(era.count) || 1, 1), MAX_SNAP_COUNT) } : {}),
    scrollY: Math.min(Math.max(Math.trunc(scrollY) || 0, 0), MAX_SNAP_SCROLL),
  };
}

/** Publishes the reader's restorable state (state changes and scrolling) for the app host to forward to native; cleared on unmount. */
export function useReportSnapshot(): void {
  const state = useAppState();
  const { getEraScroll } = useAppActions();
  const live = useRef({ state, getEraScroll });
  live.current = { state, getEraScroll };
  const publish = useRef(() => {
    const { state: s, getEraScroll: era } = live.current;
    setSnapshot(buildReaderSnap(s, s.mode === 'era' ? era() : null, window.scrollY));
  }).current;
  useEffect(publish, [state.mode, state.eraId, state.lensId, state.openItemId]);
  useEffect(() => {
    window.addEventListener('scroll', publish, { passive: true });
    return () => {
      window.removeEventListener('scroll', publish);
      setSnapshot(null);
    };
  }, []);
}
