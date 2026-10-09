// Restores the reader state native replays after a re-key (content adoption, crash recovery; #5114) THROUGH the store's
// own actions, the same way a deep link does: nav pushes are suppressed so no history entry is added (the item overlay's
// own useBackDismiss entry is then the only one), and an era-stream position goes into the EraScrollSnapshot ref before the
// stream remounts (the provider bumps `restoreSeq`), so EraStream's own double-rAF restore does the scrolling.
import type { EraId, LensId } from '@swift2/experience';
import type { ReaderSnap } from '../../bridge/messages';
import { MAX_SNAP_COUNT, MAX_SNAP_SCROLL } from '../../bridge/snapshot-signal';
import type { AppMode, EraScrollSnapshot } from './navigation';

const MODES: readonly AppMode[] = ['era', 'threads', 'mood', 'clownbot', 'community', 'merch'];

export interface RestoreDeps {
  isEra: (id: string) => boolean;
  isLens: (id: string) => boolean;
  /** The generated id of a content item (id or slug), or null when it no longer exists. */
  resolveItem: (idOrSlug: string) => string | null;
  suppressNavPush: { current: boolean };
  goHome: () => void;
  setMode: (m: AppMode) => void;
  setEra: (id: EraId) => void;
  openThread: (id: LensId) => void;
  openItem: (id: string) => void;
  saveEraScroll: (snap: EraScrollSnapshot) => void;
}

const clamp = (n: number, max: number): number => Math.min(Math.max(Math.trunc(n) || 0, 0), max);

/** Applies `snap`; false (after going to the front door) when its mode or era is unknown. A vanished item or lens just leaves the era/mode landing. */
export function restoreReaderState(snap: ReaderSnap, d: RestoreDeps): boolean {
  const mode = MODES.find((m) => m === snap.mode);
  if (!mode || !d.isEra(snap.eraId)) {
    d.goHome();
    return false;
  }
  const anchored = snap.anchorId !== undefined && d.isEra(snap.anchorId);
  d.suppressNavPush.current = true;
  try {
    if (mode === 'era') d.setEra(snap.eraId as EraId);
    else if (mode === 'threads' && snap.lens !== undefined && d.isLens(snap.lens)) d.openThread(snap.lens as LensId);
    else d.setMode(mode);
    // After the mode switch: setEra clears the saved position, so write it last.
    if (anchored) d.saveEraScroll({ anchorId: snap.anchorId as EraId, count: clamp(snap.count ?? 1, MAX_SNAP_COUNT) || 1, scrollY: clamp(snap.scrollY, MAX_SNAP_SCROLL) });
    const item = snap.itemId === undefined ? null : d.resolveItem(snap.itemId);
    if (item) d.openItem(item);
  } finally {
    d.suppressNavPush.current = false;
  }
  if (!anchored && mode !== 'era' && typeof window !== 'undefined') {
    const y = clamp(snap.scrollY, MAX_SNAP_SCROLL);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo({ top: Math.min(y, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)), behavior: 'auto' })),
    );
  }
  return true;
}
