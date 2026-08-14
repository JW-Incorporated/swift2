'use client';

/**
 * Clownbot — the two prefill columns beneath the chat box. Matches the
 * founder-approved mockup (2026-08-14): "very basic and has no
 * functionality… need some functionality and more pazazz."
 *
 * Column 1, "Most recent" — `currentTheories(now)`. No number in the
 * *heading* (founder ruling, 2026-08-13: the corpus currently yields 7 live
 * theories, so a "Top 10" heading would be inaccurate); the live count moves
 * to a header pill instead, derived from the real list length, never
 * hardcoded. Renders gracefully at fewer than 10 — no padding, no empty
 * placeholder slots (J2: a padded "current" list is a lie about what is
 * current). Each card carries a relative date and, on the newest item only,
 * a pulsing dot.
 *
 * Column 2, "Past confirmed easter eggs" — `confirmedEggs({ eggsOnly: true })`,
 * `eggsOnly: true` per founder ruling (real eggs only, not confirmed
 * theories). Grouped by era (`clown-board.ts`'s `BoardItem.era`, resolved by
 * matching each item's date into an era's `[start, end]` window). An item
 * whose date resolves to no era is omitted from the grouped display rather
 * than invented a bucket for it — it also never counts toward the "N
 * decoded" pill or the "Show all N" total, so those two numbers always match
 * what's actually on screen. 10 shown initially with a "show more"
 * affordance revealing the rest — the full set is fetched once and sliced
 * client-side, so "show more" has something to reveal without a second query.
 *
 * Tapping either card prefills the composer via `onSelect`; it never sends.
 */

import { useMemo, useState } from 'react';
import { confirmedEggs, currentTheories, type BoardItem } from '@/lib/longlive/clown-board';
import { ClownItemCard } from './ClownItemCard';

const THEORIES_HEADING = 'Most recent';
const THEORIES_SUB = "What the fandom is clowning on right now. Unresolved by definition.";
const EGGS_HEADING = 'Past confirmed easter eggs';
const EGGS_SUB = 'Called, then proven. Grouped by the era they came from.';
const COLLAPSED_EGG_COUNT = 10;

export interface ClownBoardProps {
  onSelect: (item: BoardItem) => void;
}

interface EraGroup {
  era: string;
  items: BoardItem[];
}

/** Groups a list already sorted newest-first into contiguous runs sharing
 * the same era — matching how the eras themselves never interleave in time.
 * Items with no resolved era are excluded entirely, never given a bucket. */
function groupByEra(items: BoardItem[]): EraGroup[] {
  const groups: EraGroup[] = [];
  for (const item of items) {
    if (!item.era) continue;
    const last = groups[groups.length - 1];
    if (last && last.era === item.era) {
      last.items.push(item);
    } else {
      groups.push({ era: item.era, items: [item] });
    }
  }
  return groups;
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--era-accent)] opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--era-accent)]" />
    </span>
  );
}

export function ClownBoard({ onSelect }: ClownBoardProps) {
  // Mount-time only, matching Clownbot.tsx's `now` pattern: computing this
  // during render would differ between server and client and risk a
  // hydration mismatch (currentTheories clamps era-end dates to `now`).
  const now = useMemo(() => new Date(), []);
  const theories = useMemo(() => currentTheories(now), [now]);
  const allEggs = useMemo(() => confirmedEggs({ eggsOnly: true }), []);
  // Only era-resolved eggs are ever shown or counted, so the "N decoded" /
  // "Show all N" numbers always match what's on screen (see header comment).
  const groupableEggs = useMemo(() => allEggs.filter((item) => item.era !== undefined), [allEggs]);
  const [expanded, setExpanded] = useState(false);
  const visibleEggs = expanded ? groupableEggs : groupableEggs.slice(0, COLLAPSED_EGG_COUNT);
  const hasMore = groupableEggs.length > COLLAPSED_EGG_COUNT;
  const eggGroups = useMemo(() => groupByEra(visibleEggs), [visibleEggs]);

  return (
    <section aria-label="Clown board" className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
      <div>
        <header className="flex flex-wrap items-baseline gap-2.5">
          <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
            {THEORIES_HEADING}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--era-accent)]/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--era-accent)]">
            {theories.length > 0 && <PulseDot />}
            {theories.length} open
          </span>
        </header>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--era-ink-soft)]">{THEORIES_SUB}</p>
        {theories.length > 0 ? (
          <ul className="mt-4 space-y-2.5">
            {theories.map((item, i) => (
              <ClownItemCard key={item.id} variant="live" item={item} onSelect={onSelect} now={now} pulse={i === 0} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--era-ink-soft)]">Nothing open right now — check back soon.</p>
        )}
      </div>

      <div>
        <header className="flex flex-wrap items-baseline gap-2.5">
          <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
            {EGGS_HEADING}
          </h2>
          <span className="inline-flex items-center rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--era-ink-soft)]">
            {groupableEggs.length} decoded
          </span>
        </header>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--era-ink-soft)]">{EGGS_SUB}</p>
        {eggGroups.length > 0 ? (
          <>
            <div className="mt-4">
              {eggGroups.map((group) => (
                <div key={group.era}>
                  <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)] opacity-75 first:mt-0">
                    {group.era}
                  </p>
                  <ul className="space-y-2.5">
                    {group.items.map((item) => (
                      <ClownItemCard key={item.id} variant="done" item={item} onSelect={onSelect} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-[color:var(--era-line)] px-4 text-sm font-medium text-[color:var(--era-ink-soft)] transition hover:border-[color:var(--era-accent)] hover:text-[color:var(--era-accent)]"
              >
                {expanded ? 'Show fewer' : `Show all ${groupableEggs.length}`}
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
