'use client';

import { useEffect, useState } from 'react';
import type { FanSignal, LiveTheory } from '@swift2/shared';

export interface LiveTheoryBoard {
  theories: LiveTheory[];
  signals: FanSignal[];
}

const EMPTY_BOARD: LiveTheoryBoard = { theories: [], signals: [] };

/**
 * Client-side fetch of `live_theory` + `fan_signal` rows (PLAN.md Stage 7),
 * from the `/vault/live-theories` route. Fails soft the same way
 * `use-current-items.ts` does: any error (network, non-2xx, malformed JSON)
 * leaves the board empty, never throws. `enabled: false` also returns the
 * empty board without fetching — `TheoryGuide` only wants this for the
 * current era (`live_theory` carries no `era_id` to filter by server-side),
 * so every other era's guide opts out entirely rather than fetching data it
 * can't attribute to itself.
 */
export function useLiveTheories(enabled: boolean): LiveTheoryBoard {
  const [board, setBoard] = useState<LiveTheoryBoard>(EMPTY_BOARD);

  useEffect(() => {
    if (!enabled) {
      setBoard(EMPTY_BOARD);
      return;
    }
    let cancelled = false;
    fetch('/vault/live-theories')
      .then((res) => (res.ok ? res.json() : EMPTY_BOARD))
      .then((data: { theories?: unknown; signals?: unknown }) => {
        if (cancelled) return;
        setBoard({
          theories: Array.isArray(data.theories) ? (data.theories as LiveTheory[]) : [],
          signals: Array.isArray(data.signals) ? (data.signals as FanSignal[]) : [],
        });
      })
      .catch(() => {
        if (!cancelled) setBoard(EMPTY_BOARD);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return board;
}
