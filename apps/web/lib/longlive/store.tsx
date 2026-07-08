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

export type AppMode = 'era' | 'lens';

interface AppState {
  mode: AppMode;
  eraId: EraId;
  lensId: LensId;
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
  setMode: (m: AppMode) => void;
  setEra: (id: EraId) => void;
  setLens: (id: LensId) => void;
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
  const [lensId, setLensId] = useState<LensId>('love-story');
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [share, setShare] = useState<ShareTarget | null>(null);

  const setEra = useCallback((id: EraId) => {
    // Validate against the dataset; ignore unknown ids.
    setEraId(getEra(id).id);
    setSelectorOpen(false);
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      setMode: setModeRaw,
      setEra,
      setLens: setLensId,
      openItem: setOpenItemId,
      closeItem: () => setOpenItemId(null),
      setSelectorOpen,
      openShare: setShare,
      closeShare: () => setShare(null),
    }),
    [setEra],
  );

  const state = useMemo<AppState>(
    () => ({ mode, eraId, lensId, openItemId, selectorOpen, share }),
    [mode, eraId, lensId, openItemId, selectorOpen, share],
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
