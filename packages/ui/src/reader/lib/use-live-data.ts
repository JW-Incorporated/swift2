'use client';

import type { CurrentItem, FanSignal, LiveTheory } from '@swift2/shared';
import { liveTheoryHasValidImage } from '@swift2/shared';
import { normaliseCurrentItems, objectRows } from './normalise-live-items';

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
 * throws; a 20 s stall is retried once, then does the same — the Current
 * tier and the theories/signals boards are all additive over an
 * otherwise-static page. Rows are normalised once
 * here (`normalise-live-items.ts`), so one malformed row is dropped or
 * defaulted instead of crashing the components that dereference it.
 */
export interface LiveData {
  items: CurrentItem[];
  theories: LiveTheory[];
  signals: FanSignal[];
}

export const EMPTY_LIVE_DATA: LiveData = { items: [], theories: [], signals: [] };

/** Per-attempt bound. A stalled fetch is retried once, then resolves to the empty payload. */
export const LIVE_FETCH_TIMEOUT_MS = 20_000;

function parseLiveData(data: unknown): LiveData {
  const payload = (typeof data === 'object' && data !== null ? data : {}) as {
    items?: unknown;
    theories?: unknown;
    signals?: unknown;
  };
  return {
    items: normaliseCurrentItems(payload.items),
    // Defense in depth: a theory with no valid image is never a card.
    theories: objectRows<LiveTheory>(payload.theories, ['evidenceIds', 'symbols']).filter(liveTheoryHasValidImage),
    signals: objectRows<FanSignal>(payload.signals, ['symbols', 'theoryIds', 'currentItemIds', 'sampleUrls']),
  };
}

/** One bounded attempt; `null` means it timed out (the only outcome worth retrying). */
async function attemptLiveFetch(url: string): Promise<LiveData | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok ? parseLiveData(await res.json()) : EMPTY_LIVE_DATA;
  } catch {
    return controller.signal.aborted ? null : EMPTY_LIVE_DATA;
  } finally {
    clearTimeout(timer);
  }
}

// Per-eraId in-flight/most-recent fetch, so concurrent callers in the same
// tick (or re-renders before the fetch resolves) share one request instead
// of each firing their own.
const inFlight = new Map<string, Promise<LiveData>>();

export function fetchLiveData(
  eraId: string,
  resolveUrl: (path: string) => string = (path) => path,
): Promise<LiveData> {
  const existing = inFlight.get(eraId);
  if (existing) return existing;

  const url = resolveUrl(`/vault/live/${encodeURIComponent(eraId)}`);
  const promise = attemptLiveFetch(url)
    .then((first) => first ?? attemptLiveFetch(url))
    .then((data) => data ?? EMPTY_LIVE_DATA)
    .catch(() => EMPTY_LIVE_DATA)
    .finally(() => {
      inFlight.delete(eraId);
    });

  inFlight.set(eraId, promise);
  return promise;
}
