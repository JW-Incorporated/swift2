'use client';

import { useState, type ReactNode } from 'react';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { fromBakedCore } from '@swift2/experience/reader-snapshot';
import { ReaderSnapshotProvider } from '@swift2/ui';

import { bakedModules } from './baked-modules';

/**
 * Builds the reader's snapshot from the web's baked modules once per provider
 * instance (no module singleton), so it is referentially stable across
 * re-renders and the search engine's per-array suffix cache holds.
 */
export function WebReaderSnapshotProvider({ children }: { children: ReactNode }) {
  const [snapshot] = useState(() => {
    performance.mark('snapshot-core:start');
    const built = fromBakedCore(bakedModules(), { eraVideoFeed });
    performance.mark('snapshot-core:end');
    performance.measure('snapshot-core', 'snapshot-core:start', 'snapshot-core:end');
    return built;
  });
  return <ReaderSnapshotProvider value={snapshot}>{children}</ReaderSnapshotProvider>;
}
