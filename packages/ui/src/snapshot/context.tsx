import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  allVideoRecords,
  musicVideosForEra,
  videosForEra,
} from '@swift2/content-enrichment';
import {
  createReaderQueries,
  type ReaderQueries,
  type ReaderSnapshotContextValue,
  type ReaderSnapshotCore,
} from '@swift2/experience/reader-snapshot';

/**
 * `null` = no provider. `{ status: 'loading' }` = a provider before the first
 * snapshot exists. Otherwise the snapshot itself, whose `state` carries
 * ready / stale / offline / error ('error' = a last-good snapshot is shown and
 * the latest refresh failed, never "no data").
 */
const ReaderSnapshotContext = createContext<ReaderSnapshotContextValue | null>(null);

/** Type guard, not key equality: only a real snapshot carries `domains`. */
export function isReaderSnapshot(v: ReaderSnapshotContextValue): v is ReaderSnapshotCore {
  return 'domains' in v;
}

export function ReaderSnapshotProvider({
  value,
  children,
}: {
  value: ReaderSnapshotContextValue;
  children: ReactNode;
}) {
  return <ReaderSnapshotContext.Provider value={value}>{children}</ReaderSnapshotContext.Provider>;
}

/** The context value as stored: `{ status: 'loading' }` or a snapshot. Throws outside a provider. */
export function useReaderSnapshotStatus(): ReaderSnapshotContextValue {
  const value = useContext(ReaderSnapshotContext);
  if (value === null) {
    throw new Error('useReaderSnapshotStatus must be used inside <ReaderSnapshotProvider>.');
  }
  return value;
}

/**
 * The snapshot. Throws outside a provider or while loading: the app's gate
 * renders children only once a snapshot is ready, so a reader component never
 * sees `loading`.
 */
export function useReaderSnapshot(): ReaderSnapshotCore {
  const value = useReaderSnapshotStatus();
  if (!isReaderSnapshot(value)) {
    throw new Error('useReaderSnapshot called while the snapshot is loading; gate on useReaderSnapshotStatus().');
  }
  return value;
}

const videoDeps = { videosForEra, musicVideosForEra, allVideoRecords };

/** The reader's accessors over the current snapshot; the same object until the snapshot changes. */
export function useReader(): ReaderQueries {
  const snapshot = useReaderSnapshot();
  return useMemo(() => createReaderQueries(snapshot, videoDeps), [snapshot]);
}
