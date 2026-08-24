'use client';

/**
 * Clownbot — one card, three variants, per PLAN.md's Files touched table
 * ("one column item / one source card"):
 *
 * - `variant: 'live'` — column 1 ("Most recent"): a tappable, dated card for
 *   an open/unresolved `BoardItem`. Carries a relative date
 *   (`clown-board.ts`'s `relativeDate`) and, on the newest item only, a
 *   pulsing dot. The "Ask clown bot →" affordance reveals on hover/focus,
 *   and stays permanently visible under `(hover: none)` — most traffic is
 *   phones, and hover-only affordances vanish there entirely otherwise.
 * - `variant: 'done'` — column 2 ("Past confirmed easter eggs"): a tappable
 *   card for a confirmed `BoardItem`, with a check icon. Era grouping is
 *   `ClownBoard`'s job, not this card's.
 * - `variant: 'source'` — a read-only receipt beneath an answer (a
 *   `RetrievedItem`, from `clown-fallback.ts`), so every claim in the answer
 *   text visibly traces back to a dated, sourced corpus item.
 *
 * `live`/`done` both prefill the composer via the caller's `onSelect` and
 * never send anything themselves (J2: board taps stay free, no model call
 * happens here).
 *
 * Colors are era CSS custom properties only — no hardcoded hex, no Taylor
 * imagery (see Clownbot.tsx's header comment for why). The pulsing dot uses
 * the standard `animate-ping` + solid-dot idiom (native CSS `animation`),
 * which the app's global `prefers-reduced-motion: reduce` rule
 * (`globals.css`) already collapses to a single, instant frame.
 */

import { Check } from 'lucide-react';
import { relativeDate, type BoardItem } from '@/lib/longlive/clown-board';
import type { ItemStatus, RetrievedItem } from '@/lib/longlive/clown-fallback';

/** Exported so `ClownMessageRow.tsx`'s `SourceChip` (a chat message's cited
 * sources) can render the same full status text this card does, instead of
 * a binary confirmed/non-confirmed dot (Codex review MAJOR 7). */
export const STATUS_LABEL: Record<ItemStatus, string> = {
  confirmed: 'Confirmed',
  debunked: 'Debunked',
  reported: 'Reported',
  rumor: 'Rumor',
};

export type ClownItemCardProps =
  | { variant: 'live'; item: BoardItem; onSelect: (item: BoardItem) => void; now: Date; pulse: boolean }
  | { variant: 'done'; item: BoardItem; onSelect: (item: BoardItem) => void }
  | { variant: 'source'; item: RetrievedItem };

function PulseDot() {
  return (
    <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--era-accent)] opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--era-accent)]" />
    </span>
  );
}

export function ClownItemCard(props: ClownItemCardProps) {
  if (props.variant === 'live') {
    const { item, onSelect, now, pulse } = props;
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="group min-h-[44px] w-full rounded-xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] px-3.5 py-2.5 text-left transition hover:border-[color:var(--era-accent)] focus-visible:border-[color:var(--era-accent)] focus-visible:outline-none"
        >
          <span className="flex items-center gap-1.5">
            {pulse && <PulseDot />}
            <span className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
              {relativeDate(item.date, now)}
            </span>
          </span>
          <span className="mt-1 block text-sm font-medium text-[color:var(--era-ink)]">{item.title}</span>
          <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[color:var(--era-accent)] opacity-0 transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
            Ask clown bot <span aria-hidden="true">→</span>
          </span>
        </button>
      </li>
    );
  }

  if (props.variant === 'done') {
    const { item, onSelect } = props;
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="flex min-h-[44px] w-full items-start gap-2 rounded-xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] px-3.5 py-2.5 text-left transition hover:border-[color:var(--era-accent)] focus-visible:border-[color:var(--era-accent)] focus-visible:outline-none"
        >
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--era-accent)]" aria-hidden="true" />
          <span className="text-sm font-medium text-[color:var(--era-ink)]">{item.title}</span>
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
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {item.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1.5 text-xs text-[color:var(--era-accent)] underline underline-offset-2"
            >
              {s.name}
            </a>
          ))}
        </p>
      )}
    </li>
  );
}
