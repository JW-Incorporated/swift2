'use client';

import { useEffect, useState } from 'react';
import type { CurrentItem } from '@swift2/shared';

/**
 * Client-side fetch of the current era's live `current_item` rows, from the
 * `/vault/current/[eraId]` route (packages/core knowledge reader, ISR
 * revalidate: 900s — see that route's own comment). Called once, at
 * EraStream's top level, so the masthead's "Updated Nh ago" line and the
 * current era's feed entries read the exact same fetch, never two
 * independent snapshots that could disagree.
 *
 * Fails soft: any error (network, non-2xx, malformed JSON) leaves `items`
 * empty — the Current tier is additive, never something a fetch failure
 * should break the (otherwise fully static) era stream over.
 */
export function useCurrentItems(eraId: string): CurrentItem[] {
  const [items, setItems] = useState<CurrentItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/vault/current/${encodeURIComponent(eraId)}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: unknown }) => {
        if (!cancelled) setItems(Array.isArray(data.items) ? (data.items as CurrentItem[]) : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [eraId]);

  return items;
}
