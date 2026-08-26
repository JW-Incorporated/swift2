'use client';

import { useMemo } from 'react';
import { getEra, eraIndex } from '@/lib/longlive/eras';
import type { CluePair } from '@/lib/longlive/types';
import { RAIL_BUTTON_CLASS, railButtonLabel } from './patternRailLayout';

/**
 * Replaces the career-timeline scrubber for The Decode thread. On mobile:
 * invisible (era filtering lives in the filter panel). On desktop (md+): a
 * fixed left rail of era dots sized by clue density; tap to filter the card
 * list to that era, tap again to clear.
 *
 * Why not the career-timeline scrubber? It maps a single position to a
 * moment in time — great for the Era stream where you're seeking one point.
 * Decode clues span TWO eras (plant + payoff), so a single-position scrubber
 * can't express "this clue lives in both 1989 and reputation." This is a
 * categorical filter instead, communicating density and letting you pull on
 * one era thread at a time.
 */
export function PatternRail({
  clues,
  activeEra,
  onEraClick,
}: {
  clues: CluePair[];
  activeEra: string | null;
  onEraClick: (eraId: string) => void;
}) {
  const eraDensity = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clues) {
      map.set(c.plant.eraId, (map.get(c.plant.eraId) ?? 0) + 1);
      if (c.payoff.eraId !== c.plant.eraId) {
        map.set(c.payoff.eraId, (map.get(c.payoff.eraId) ?? 0) + 1);
      }
    }
    return map;
  }, [clues]);

  const orderedEraIds = useMemo(
    () => Array.from(eraDensity.keys()).sort((a, b) => eraIndex(a) - eraIndex(b)),
    [eraDensity],
  );

  const max = useMemo(() => Math.max(...Array.from(eraDensity.values())), [eraDensity]);

  return (
    <nav
      aria-label="Filter by era"
      className="fixed bottom-0 left-0 top-0 z-20 hidden w-16 flex-col items-center justify-center gap-1 py-8 md:flex"
      style={{ background: 'var(--era-bg)' }}
    >
      <div className="absolute left-1/2 top-12 bottom-12 w-px -translate-x-1/2" style={{ background: 'var(--era-line)' }} aria-hidden />

      {orderedEraIds.map((eraId) => {
        const era = getEra(eraId);
        const count = eraDensity.get(eraId) ?? 0;
        const isActive = activeEra === eraId;
        const density = count / max;
        const label = railButtonLabel(era.shortName, count);

        return (
          <button
            key={eraId}
            onClick={() => onEraClick(eraId)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={RAIL_BUTTON_CLASS}
          >
            <span
              className="rounded-full border-2 transition-all duration-200"
              style={{
                width: isActive ? 14 : Math.round(6 + density * 6),
                height: isActive ? 14 : Math.round(6 + density * 6),
                background: isActive ? era.theme.accent : `${era.theme.accent}99`,
                borderColor: isActive ? era.theme.accent : 'transparent',
                boxShadow: isActive ? `0 0 8px ${era.theme.accent}88` : 'none',
              }}
            />
            <span
              className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ background: 'var(--era-surface)', color: 'var(--era-ink)', border: '1px solid var(--era-line)' }}
            >
              {era.shortName}
              <span className="ml-1 font-mono" style={{ color: 'var(--era-ink-soft)' }}>
                ×{count}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
