'use client';

import Image from 'next/image';
import { ERAS } from '@swift2/experience';
import { eraStyle } from '@/lib/longlive/theme';
import type { EraId } from '@swift2/experience';

/**
 * The twelve-era tile grid ("Twelve chapters, newest first"), shared by the
 * landing page (#684) and the EraSelector overlay so the two can never drift.
 * Each tile styles itself with its own era's theme variables.
 */
export function EraGrid({
  activeEraId = null,
  onPick,
}: {
  /** Era to badge as "Here" (the selector overlay's current era), or null. */
  activeEraId?: EraId | null;
  onPick: (id: EraId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {[...ERAS].reverse().map((era, i) => {
        const active = era.id === activeEraId;
        return (
          <button
            key={era.id}
            onClick={() => onPick(era.id)}
            style={{ ...eraStyle(era), animationDelay: `${i * 40}ms` }}
            className="era-tile group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left"
            data-active={active}
          >
            <Image
              src={era.image || '/placeholder.svg'}
              alt=""
              fill
              className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, var(--era-bg), color-mix(in srgb, var(--era-bg) 10%, transparent))',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div
                className="mb-1 h-1 w-8 rounded-full"
                style={{ backgroundColor: 'var(--era-accent)' }}
              />
              <div className="font-[family-name:var(--era-font)] text-lg font-semibold leading-tight text-[color:var(--era-ink)]">
                {era.shortName}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                {era.yearLabel}
              </div>
            </div>
            {active && (
              <span className="absolute right-2 top-2 rounded-full bg-[color:var(--era-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--era-bg)]">
                Here
              </span>
            )}
            {era.isCurrent && !active && (
              <span className="absolute right-2 top-2 rounded-full border border-[color:var(--era-line)] bg-[color:var(--era-bg)]/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
                Now
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
