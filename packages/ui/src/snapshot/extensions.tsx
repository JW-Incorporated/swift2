import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  attachExtensions,
  type ReaderSnapshot,
  type ReaderSnapshotExtensions,
} from '@swift2/experience/reader-snapshot';
import { useReaderSnapshot } from './context';

const ExtendedSnapshotContext = createContext<ReaderSnapshot | null>(null);

/**
 * Rendered inside the merch and mood chunks only: `attachExtensions` runs
 * here, so the main route's core snapshot never holds merch or songMoods.
 * `extensions` must be a stable reference (a module constant) to keep the
 * attached snapshot memoised.
 */
export function ReaderExtensionsProvider({
  extensions,
  children,
}: {
  extensions: ReaderSnapshotExtensions;
  children: ReactNode;
}) {
  const core = useReaderSnapshot();
  const snapshot = useMemo(() => attachExtensions(core, extensions), [core, extensions]);
  return <ExtendedSnapshotContext.Provider value={snapshot}>{children}</ExtendedSnapshotContext.Provider>;
}

/** Core plus extension domains. Throws outside a `ReaderExtensionsProvider`. */
export function useExtendedSnapshot(): ReaderSnapshot {
  const value = useContext(ExtendedSnapshotContext);
  if (value === null) {
    throw new Error('useExtendedSnapshot must be used inside <ReaderExtensionsProvider>.');
  }
  return value;
}

export function useMerch(): ReaderSnapshot['domains']['merch'] {
  return useExtendedSnapshot().domains.merch;
}

export function useSongMoods(): ReaderSnapshot['domains']['songMoods'] {
  return useExtendedSnapshot().domains.songMoods;
}

export function useLore(): ReaderSnapshot['domains']['lore'] {
  return useExtendedSnapshot().domains.lore;
}
