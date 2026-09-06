'use client';

import { useEffect, useState } from 'react';
import type { FanSignal, LiveTheory } from '@swift2/shared';
import { CURRENT_ERA_ID } from '@swift2/experience';
import { fetchLiveData } from './use-live-data';

export interface LiveTheoryBoard {
  theories: LiveTheory[];
  signals: FanSignal[];
}

const EMPTY_BOARD: LiveTheoryBoard = { theories: [], signals: [] };

/**
 * Client-side fetch of `live_theory` + `fan_signal` rows (PLAN.md Stage 7),
 * from the combined `/vault/live/[eraId]` route (R17 — see
 * `use-live-data.ts`). `live_theory`/`fan_signal` carry no `era_id` to
 * filter by server-side, so this always reads the current era's slice —
 * same "current era only" precedent `use-era-current-feed.ts` set for
 * `current_item`. Fails soft the same way `use-current-items.ts` does: any
 * error (network, non-2xx, malformed JSON) leaves the board empty, never
 * throws. `enabled: false` also returns the empty board without fetching —
 * `TheoryGuide` only wants this for the current era, so every other era's
 * guide opts out entirely rather than fetching data it can't attribute to
 * itself.
 */
export function useLiveTheories(enabled: boolean): LiveTheoryBoard {
  const [board, setBoard] = useState<LiveTheoryBoard>(EMPTY_BOARD);

  useEffect(() => {
    if (!enabled) {
      setBoard(EMPTY_BOARD);
      return;
    }
    let cancelled = false;
    fetchLiveData(CURRENT_ERA_ID).then((data) => {
      if (!cancelled) setBoard({ theories: data.theories, signals: data.signals });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return board;
}
