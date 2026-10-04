'use client';

import { ArrowRight, Gem, Heart, RefreshCw, Shirt } from 'lucide-react';
import { getThread } from '@swift2/experience';
import type { Era, LensId } from '@swift2/experience';

// Split out of EraSection.tsx (PLAN.md P3 step 15 — see MAP.md).

/** One stable icon per thread, for the pivot strip below the feed. */
const PIVOT_ICONS: Partial<Record<LensId, typeof Heart>> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'the-proposal': Gem,
};

/** Era → Thread pivot: jump sideways into any story that runs through here. */
export function EraThreadsPivot({
  era,
  eraThreads,
  onOpenThread,
}: {
  era: Era;
  eraThreads: { id: LensId; count: number }[];
  onOpenThread: (id: LensId) => void;
}) {
  if (eraThreads.length === 0) return null;
  return (
    <div className="border-t border-[color:var(--era-line)]">
      <div className="mx-auto max-w-4xl px-4 py-8 md:pr-8">
        <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          Threads running through {era.shortName}
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {eraThreads.map(({ id, count }) => {
            const Icon = PIVOT_ICONS[id] ?? Heart;
            const meta = getThread(id);
            return (
              <button
                key={id}
                onClick={() => {
                  onOpenThread(id);
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
                className="era-card group inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition hover:border-[color:var(--era-accent)]"
              >
                <Icon className="h-4 w-4 text-[color:var(--era-accent)]" />
                {meta.title}
                <span className="text-xs text-[color:var(--era-ink-soft)]">
                  {count} {count === 1 ? 'moment' : 'moments'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[color:var(--era-ink-soft)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--era-accent)]" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
