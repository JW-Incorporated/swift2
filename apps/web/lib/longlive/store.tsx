'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CURRENT_ERA_ID, getEra } from './eras';
import { THREADS } from './lenses';
import type { EraId, LensId } from './types';

export type AppMode = 'era' | 'threads';

interface AppState {
  mode: AppMode;
  /** The era currently driving theming, the top bar, and the scrubber. */
  eraId: EraId;
  /**
   * Bumped whenever the user *explicitly* jumps to an era (selector, home).
   * The era stream watches this to re-anchor and scroll to the top — scroll-
   * driven active-era changes do NOT bump it, so they never reset the stream.
   */
  eraJumpSeq: number;
  /** Selected thread, or null on the Threads landing gallery. */
  lensId: LensId | null;
  /**
   * Active thread-crossing overlay (two threads on a shared axis), or null.
   * Only meaningful in threads mode; takes precedence over the gallery/thread.
   */
  crossing: { a: LensId; b: LensId } | null;
  /** Currently open content item id (immersive detail), or null. */
  openItemId: string | null;
  /** Whether the era selector overlay is open. */
  selectorOpen: boolean;
  /** Whether the share sheet is open, and for what target. */
  share: ShareTarget | null;
}

export type ShareTarget =
  | { kind: 'era'; eraId: EraId }
  | { kind: 'lens'; lensId: LensId }
  | { kind: 'item'; itemId: string };

/**
 * A saved position in the era stream, captured when the user leaves era mode
 * (e.g. pivots into a thread) so we can drop them back exactly where they were.
 * Records the anchor era, how many older eras had been lazily appended, and the
 * raw window scroll offset.
 */
export interface EraScrollSnapshot {
  anchorId: EraId;
  count: number;
  scrollY: number;
}

interface AppActions {
  /** Reset to the main screen: era mode, current era, all overlays closed. */
  goHome: () => void;
  setMode: (m: AppMode) => void;
  /** Explicit jump to an era (re-anchors + scrolls the stream to top). */
  setEra: (id: EraId) => void;
  /** Scroll-driven active-era change (theming only; does not re-anchor). */
  setActiveEra: (id: EraId) => void;
  /** Open a specific thread. */
  setLens: (id: LensId) => void;
  /** Return to the Threads landing gallery. */
  clearLens: () => void;
  /** Pivot from an era into a thread (switches to threads mode). */
  openThread: (id: LensId) => void;
  /** Pivot from a thread back into an era (switches to era mode + jumps). */
  openEra: (id: EraId) => void;
  /** Open the crossings overlay for a pair of threads. */
  openCrossing: (a: LensId, b: LensId) => void;
  /** Close the crossings overlay (back to the thread gallery). */
  closeCrossing: () => void;
  openItem: (id: string) => void;
  closeItem: () => void;
  /** Save the era-stream position when leaving era mode (for later restore). */
  saveEraScroll: (snap: EraScrollSnapshot) => void;
  /** Read the saved era-stream position without clearing it. */
  getEraScroll: () => EraScrollSnapshot | null;
  /** Invalidate any saved position — explicit jumps land at the top instead. */
  clearEraScroll: () => void;
  setSelectorOpen: (open: boolean) => void;
  openShare: (t: ShareTarget) => void;
  closeShare: () => void;
}

const StateCtx = createContext<AppState | null>(null);
const ActionsCtx = createContext<AppActions | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<AppMode>('era');
  const [eraId, setEraId] = useState<EraId>(CURRENT_ERA_ID);
  const [eraJumpSeq, setEraJumpSeq] = useState(0);
  const [lensId, setLensId] = useState<LensId | null>(null);
  const [crossing, setCrossing] = useState<{ a: LensId; b: LensId } | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [share, setShare] = useState<ShareTarget | null>(null);

  // Era-stream position to restore on the next era-mode entry. Held in a ref so
  // saving/reading it never triggers a render (the stream reads it imperatively
  // on mount). Explicit jumps clear it so they always land at the top.
  const eraScrollRef = useRef<EraScrollSnapshot | null>(null);
  const saveEraScroll = useCallback((snap: EraScrollSnapshot) => {
    eraScrollRef.current = snap;
  }, []);
  const getEraScroll = useCallback(() => eraScrollRef.current, []);
  const clearEraScroll = useCallback(() => {
    eraScrollRef.current = null;
  }, []);

  const setEra = useCallback(
    (id: EraId) => {
      const valid = getEra(id).id;
      clearEraScroll();
      setEraId(valid);
      setSelectorOpen(false);
      setEraJumpSeq((n) => n + 1);
    },
    [clearEraScroll],
  );

  const setActiveEra = useCallback((id: EraId) => {
    // Theming-only update from scroll; guard to avoid needless renders.
    setEraId((prev) => (prev === id ? prev : getEra(id).id));
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setModeRaw(m);
    // Entering Threads always lands on the gallery for a clear sense of place.
    if (m === 'threads') {
      setLensId(null);
      setCrossing(null);
    }
  }, []);

  const openThread = useCallback((id: LensId) => {
    setModeRaw('threads');
    setCrossing(null);
    setLensId(id);
    setSelectorOpen(false);
    setOpenItemId(null);
  }, []);

  const openEra = useCallback(
    (id: EraId) => {
      const valid = getEra(id).id;
      clearEraScroll();
      setModeRaw('era');
      setEraId(valid);
      setEraJumpSeq((n) => n + 1);
      setLensId(null);
      setCrossing(null);
      setSelectorOpen(false);
      setOpenItemId(null);
    },
    [clearEraScroll],
  );

  const openCrossing = useCallback((a: LensId, b: LensId) => {
    setModeRaw('threads');
    setLensId(null);
    setCrossing({ a, b });
    setOpenItemId(null);
  }, []);

  const goHome = useCallback(() => {
    clearEraScroll();
    setModeRaw('era');
    setEraId(CURRENT_ERA_ID);
    setEraJumpSeq((n) => n + 1);
    setLensId(null);
    setCrossing(null);
    setSelectorOpen(false);
    setOpenItemId(null);
    setShare(null);
  }, [clearEraScroll]);

  // Deep link support: a shared URL (?item=, ?lens=, or ?era=) lands the
  // visitor on the shared target instead of the default experience. One-time
  // read on mount — ongoing navigation stays state-only, not URL-synced.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const item = params.get('item');
    const lens = params.get('lens');
    const era = params.get('era');
    if (item) {
      setOpenItemId(item);
    } else if (lens && THREADS.some((t) => t.id === lens)) {
      openThread(lens as LensId);
    } else if (era) {
      setEra(era as EraId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      goHome,
      setMode,
      setEra,
      setActiveEra,
      setLens: setLensId,
      clearLens: () => setLensId(null),
      openThread,
      openEra,
      openCrossing,
      closeCrossing: () => setCrossing(null),
      openItem: setOpenItemId,
      closeItem: () => setOpenItemId(null),
      saveEraScroll,
      getEraScroll,
      clearEraScroll,
      setSelectorOpen,
      openShare: setShare,
      closeShare: () => setShare(null),
    }),
    [
      setEra,
      setActiveEra,
      setMode,
      goHome,
      openThread,
      openEra,
      openCrossing,
      saveEraScroll,
      getEraScroll,
      clearEraScroll,
    ],
  );

  const state = useMemo<AppState>(
    () => ({ mode, eraId, eraJumpSeq, lensId, crossing, openItemId, selectorOpen, share }),
    [mode, eraId, eraJumpSeq, lensId, crossing, openItemId, selectorOpen, share],
  );

  return (
    <StateCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppActions(): AppActions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error('useAppActions must be used within AppProvider');
  return ctx;
}
