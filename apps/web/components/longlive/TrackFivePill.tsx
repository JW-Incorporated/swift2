'use client';

import { Heart } from 'lucide-react';

/**
 * Swiftie lore: the fifth track of every album is traditionally her most
 * emotionally raw song — a pattern fans decoded (around Red's "All Too Well")
 * and Taylor later confirmed was deliberate. Kept factual and non-fabricated;
 * the full sourced telling lives in the era-secrets corpus + the Billboard
 * track-five ranking linked from the detail callout.
 */
export const TRACK_FIVE_TRADITION =
  "Track five is traditionally Taylor's most emotionally raw song — a pattern fans decoded and she has confirmed is deliberate.";

/** The Billboard track-five ranking (verified 2026-07-20 in the debut era-secret
 * corpus) — the one citation the richer detail callout links to. */
const TRACK_FIVE_SOURCE = 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/';

/**
 * The derived "Track 5" badge (#689). Rendered wherever a Track Guide lists
 * tracks, keyed off `track.trackNumber === 5` so it can never drift from the
 * data (the way milestones derive from `item.milestone`). Not color-only: it
 * carries the visible "Track 5" text plus an sr-only sentence naming the
 * tradition, so a screen reader announces the meaning, not just a label.
 */
export function TrackFivePill() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--era-accent-fg)]"
      style={{ backgroundColor: 'var(--era-accent)' }}
      title={TRACK_FIVE_TRADITION}
    >
      <Heart className="h-3 w-3" aria-hidden fill="currentColor" />
      Track 5<span className="sr-only"> — {TRACK_FIVE_TRADITION}</span>
    </span>
  );
}

/**
 * The richer track-five callout for a song's detail page, where there is room
 * to state the tradition and cite it. Same derivation (`trackNumber === 5`).
 */
export function TrackFiveCallout() {
  return (
    <aside
      className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed p-4 text-sm leading-relaxed text-[color:var(--era-ink-soft)]"
      style={{ borderColor: 'var(--era-accent)' }}
      aria-label="Track five tradition"
    >
      <Heart
        className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--era-accent)]"
        aria-hidden
        fill="currentColor"
      />
      <p>
        <span className="font-semibold text-[color:var(--era-ink)]">The Track Five tradition.</span>{' '}
        {TRACK_FIVE_TRADITION}{' '}
        <a
          href={TRACK_FIVE_SOURCE}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
        >
          Billboard
        </a>
        .
      </p>
    </aside>
  );
}
