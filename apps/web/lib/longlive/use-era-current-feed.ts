'use client';

import { useMemo, useState } from 'react';
import type { CurrentItem } from '@swift2/shared';
import { CURRENT_ERA_ID, currentFeedEntries, type EraFeedEntry } from '@swift2/experience';
import type { PlayableVideoNote } from './videos';

/**
 * PLAN.md Stage 5 — the live-item slice of one `EraSection`'s wiring: builds
 * this era's `current` `EraFeedEntry` list (empty for every era but the
 * current one — `currentItems` is only ever non-empty for `CURRENT_ERA_ID`,
 * see `EraStream.tsx`) and owns the locally-scoped "which live item is
 * open" overlay state (see `CurrentItemDetail.tsx`'s header doc for why
 * it's local, not the shared store). Split out of `EraSection.tsx` to keep
 * that file under the 300-line cap (MAP.md).
 */
export function useEraCurrentFeed(
  eraId: string,
  eraStart: string,
  eraEnd: string,
  currentItems: CurrentItem[],
): {
  liveEntries: EraFeedEntry<PlayableVideoNote>[];
  openCurrentItem: CurrentItem | null;
  setOpenCurrentItem: (item: CurrentItem | null) => void;
} {
  const liveEntries = useMemo(
    () =>
      eraId === CURRENT_ERA_ID ? currentFeedEntries<PlayableVideoNote>(currentItems, eraStart, eraEnd) : [],
    [eraId, eraStart, eraEnd, currentItems],
  );
  const [openCurrentItem, setOpenCurrentItem] = useState<CurrentItem | null>(null);
  return { liveEntries, openCurrentItem, setOpenCurrentItem };
}
