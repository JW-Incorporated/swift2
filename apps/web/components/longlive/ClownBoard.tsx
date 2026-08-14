'use client';

/**
 * Clownbot — the two prefill columns beneath the chat box.
 *
 * Column 1: "What we're clowning on" — `currentTheories(now)`. No number in
 * the heading (founder ruling, 2026-08-13): the corpus currently yields 7
 * live theories, so a "Top 10" heading would be inaccurate, and it must
 * render gracefully at fewer than 10 — no padding, no empty placeholder
 * slots (J2: a padded "current" list is a lie about what is current).
 *
 * Column 2: "Past confirmed easter eggs" — `confirmedEggs({ eggsOnly: true })`,
 * `eggsOnly: true` per founder ruling (real eggs only, not confirmed
 * theories). 10 shown initially with a "show more" affordance revealing the
 * rest — the full set (37) is fetched once and sliced client-side, so
 * "show more" has something to reveal without a second query.
 *
 * Tapping either card prefills the composer via `onSelect`; it never sends.
 */

import { useMemo, useState } from 'react';
import { confirmedEggs, currentTheories, type BoardItem } from '@/lib/longlive/clown-board';
import { ClownItemCard } from './ClownItemCard';

const THEORIES_HEADING = "What we're clowning on";
const EGGS_HEADING = 'Past confirmed easter eggs';
const COLLAPSED_EGG_COUNT = 10;

export interface ClownBoardProps {
  onSelect: (item: BoardItem) => void;
}

export function ClownBoard({ onSelect }: ClownBoardProps) {
  // Mount-time only, matching Clownbot.tsx's `now` pattern: computing this
  // during render would differ between server and client and risk a
  // hydration mismatch (currentTheories clamps era-end dates to `now`).
  const now = useMemo(() => new Date(), []);
  const theories = useMemo(() => currentTheories(now), [now]);
  const allEggs = useMemo(() => confirmedEggs({ eggsOnly: true }), []);
  const [expanded, setExpanded] = useState(false);
  const visibleEggs = expanded ? allEggs : allEggs.slice(0, COLLAPSED_EGG_COUNT);
  const hasMore = allEggs.length > COLLAPSED_EGG_COUNT;

  return (
    <section aria-label="Clown board" className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
      <div>
        <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
          {THEORIES_HEADING}
        </h2>
        {theories.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {theories.map((item) => (
              <ClownItemCard key={item.id} variant="board" item={item} onSelect={onSelect} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--era-ink-soft)]">Nothing open right now — check back soon.</p>
        )}
      </div>

      <div>
        <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
          {EGGS_HEADING}
        </h2>
        {visibleEggs.length > 0 ? (
          <>
            <ul className="mt-4 space-y-3">
              {visibleEggs.map((item) => (
                <ClownItemCard key={item.id} variant="board" item={item} onSelect={onSelect} />
              ))}
            </ul>
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-[color:var(--era-line)] px-4 text-sm font-medium text-[color:var(--era-ink)] transition hover:border-[color:var(--era-accent)] hover:text-[color:var(--era-accent)]"
              >
                {expanded ? 'Show fewer' : `Show all ${allEggs.length}`}
              </button>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--era-ink-soft)]">Nothing confirmed yet.</p>
        )}
      </div>
    </section>
  );
}
