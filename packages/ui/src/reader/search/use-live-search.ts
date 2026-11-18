'use client';

import { useMemo, useState } from 'react';
import type { CurrentItem } from '@swift2/shared';
import { CURRENT_ERA_ID, currentItemSearchDocs, type SearchDoc } from '@swift2/experience';
import { useCurrentItems } from '../lib/use-current-items';

/**
 * The search index plus the current era's live items (same shared fetch as
 * EraStream, see `fetchLiveData`), and the live item opened from a result.
 * The merged array is memoized so the ranking engine's suffix-index cache,
 * keyed on array identity, rebuilds only when the live rows change.
 */
export function useLiveSearch(searchIndex: SearchDoc[]): {
  docs: SearchDoc[];
  openLiveItem: CurrentItem | null;
  openLive: (itemId: string) => void;
  closeLive: () => void;
} {
  const currentItems = useCurrentItems(CURRENT_ERA_ID);
  const docs = useMemo(() => {
    const live = currentItemSearchDocs(currentItems);
    return live.length > 0 ? [...searchIndex, ...live] : searchIndex;
  }, [searchIndex, currentItems]);
  const [openId, setOpenId] = useState<string | null>(null);
  const openLiveItem = useMemo(
    () => (openId ? (currentItems.find((i) => i.id === openId) ?? null) : null),
    [openId, currentItems],
  );
  return { docs, openLiveItem, openLive: setOpenId, closeLive: () => setOpenId(null) };
}
