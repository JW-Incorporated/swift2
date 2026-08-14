'use client';

/**
 * Clownbot — one card, two variants, per PLAN.md's Files touched table
 * ("one column item / one source card"):
 *
 * - `variant: 'board'` — a tappable card for one of ClownBoard's two columns
 *   (a `BoardItem`, from `clown-board.ts`). Tapping it prefills the composer
 *   via the caller's `onSelect` — it never sends anything itself (J2: board
 *   taps stay free, no model call happens here).
 * - `variant: 'source'` — a read-only receipt beneath an answer (a
 *   `RetrievedItem`, from `clown-fallback.ts`), so every claim in the answer
 *   text visibly traces back to a dated, sourced corpus item.
 *
 * Colors are era CSS custom properties only — no hardcoded hex, no Taylor
 * imagery (see Clownbot.tsx's header comment for why).
 */

import type { BoardItem } from '@/lib/longlive/clown-board';
import type { ItemStatus, RetrievedItem } from '@/lib/longlive/clown-fallback';

const STATUS_LABEL: Record<ItemStatus, string> = {
  confirmed: 'Confirmed',
  debunked: 'Debunked',
  reported: 'Reported',
  rumor: 'Rumor',
};

export type ClownItemCardProps =
  | { variant: 'board'; item: BoardItem; onSelect: (item: BoardItem) => void }
  | { variant: 'source'; item: RetrievedItem };

export function ClownItemCard(props: ClownItemCardProps) {
  if (props.variant === 'board') {
    const { item, onSelect } = props;
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="min-h-[44px] w-full rounded-xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] px-3.5 py-2.5 text-left transition hover:border-[color:var(--era-accent)]"
        >
          <p className="text-sm font-medium text-[color:var(--era-ink)]">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--era-ink-soft)]">{item.blurb}</p>
        </button>
      </li>
    );
  }

  const { item } = props;
  const isConfirmed = item.status === 'confirmed';

  return (
    <li className="rounded-xl border border-[color:var(--era-line)] p-3.5 text-sm">
      <p className="flex flex-wrap items-baseline gap-2">
        <span
          className={
            isConfirmed
              ? 'rounded-full bg-[color:var(--era-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-bg)]'
              : 'rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]'
          }
        >
          {STATUS_LABEL[item.status]}
        </span>
        <span className="text-xs text-[color:var(--era-ink-soft)]">{item.date}</span>
      </p>
      <p className="mt-2 font-medium text-[color:var(--era-ink)]">{item.headline}</p>
      <p className="mt-1 leading-relaxed text-[color:var(--era-ink-soft)]">{item.detail}</p>
      {item.sources.length > 0 && (
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {item.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1 text-xs text-[color:var(--era-accent)] underline underline-offset-2"
            >
              {s.name}
            </a>
          ))}
        </p>
      )}
    </li>
  );
}
