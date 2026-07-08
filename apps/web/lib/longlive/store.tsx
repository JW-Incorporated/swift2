'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CURRENT_ERA_ID, getEra } from './eras';
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
  openItem: (id: string) => void;
  closeItem: () => void;
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
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [share, setShare] = useState<ShareTarget | null>(null);

  const setEra = useCallback((id: EraId) => {
    const valid = getEra(id).id;
    setEraId(valid);
    setSelectorOpen(false);
    setEraJumpSeq((n) => n + 1);
  }, []);

  const setActiveEra = useCallback((id: EraId) => {
    // Theming-only update from scroll; guard to avoid needless renders.
    setEraId((prev) => (prev === id ? prev : getEra(id).id));
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setModeRaw(m);
    // Entering Threads always lands on the gallery for a clear sense of place.
    if (m === 'threads') setLensId(null);
  }, []);

  const goHome = useCallback(() => {
    setModeRaw('era');
    setEraId(CURRENT_ERA_ID);
    setEraJumpSeq((n) => n + 1);
    setLensId(null);
    setSelectorOpen(false);
    setOpenItemId(null);
    setShare(null);
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      goHome,
      setMode,
      setEra,
      setActiveEra,
      setLens: setLensId,
      clearLens: () => setLensId(null),
      openItem: setOpenItemId,
      closeItem: () => setOpenItemId(null),
      setSelectorOpen,
      openShare: setShare,
      closeShare: () => setShare(null),
    }),
    [setEra, setActiveEra, setMode, goHome],
  );

  const state = useMemo<AppState>(
    () => ({ mode, eraId, eraJumpSeq, lensId, openItemId, selectorOpen, share }),
    [mode, eraId, eraJumpSeq, lensId, openItemId, selectorOpen, share],
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
