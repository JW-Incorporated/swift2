'use client';

import type { CurrentItem, FanSignal, LiveTheory } from '@swift2/shared';

/**
 * R17: shared client-side fetch for `/vault/live/[eraId]` — the one combined
 * route returning current items + live theories + fan signals for an era in
 * a single payload. `use-current-items.ts` and `use-live-theories.ts` both
 * read from this module instead of issuing their own separate fetches, so
 * two components mounting for the same era in the same tick share one
 * network request rather than firing it twice.
 *
 * Fails soft, same contract the two routes it replaces had: any error
 * (network, non-2xx, malformed JSON) resolves to the empty payload, never
 * throws — the Current tier and the theories/signals boards are all
 * additive over an otherwise-static page.
 */
export interface LiveData {
  items: CurrentItem[];
  theories: LiveTheory[];
  signals: FanSignal[];
}

export const EMPTY_LIVE_DATA: LiveData = { items: [], theories: [], signals: [] };

// Per-eraId in-flight/most-recent fetch, so concurrent callers in the same
// tick (or re-renders before the fetch resolves) share one request instead
// of each firing their own.
const inFlight = new Map<string, Promise<LiveData>>();

export function fetchLiveData(eraId: string): Promise<LiveData> {
  const existing = inFlight.get(eraId);
  if (existing) return existing;

  const promise = fetch(`/vault/live/${encodeURIComponent(eraId)}`)
    .then((res) => (res.ok ? res.json() : EMPTY_LIVE_DATA))
    .then(
      (data: { items?: unknown; theories?: unknown; signals?: unknown }): LiveData => ({
        items: Array.isArray(data.items) ? (data.items as CurrentItem[]) : [],
        theories: Array.isArray(data.theories) ? (data.theories as LiveTheory[]) : [],
        signals: Array.isArray(data.signals) ? (data.signals as FanSignal[]) : [],
      }),
    )
    .catch(() => EMPTY_LIVE_DATA)
    .finally(() => {
      inFlight.delete(eraId);
    });

  inFlight.set(eraId, promise);
  return promise;
}
