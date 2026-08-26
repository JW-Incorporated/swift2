'use client';

import { Play } from 'lucide-react';

/**
 * Full-width entry bar for the Track guide overlay, in the slot the retired
 * "Play the era" Spotify player used to occupy directly under the era's
 * quoted lyric — same visual weight, same play button, same pill shape
 * (Joey, 2026-08-13: "Track guide should now look just like 'play the era'
 * looks today, taking up the full width, with the same play button and all").
 *
 * Unlike that player this never mounts an iframe — it's a plain button that
 * opens the existing TrackGuide overlay via the store.
 */
export function TrackGuideBar({
  trackCount,
  onOpen,
}: {
  trackCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="mx-auto mt-7 w-full max-w-md">
      <button
        type="button"
        onClick={onOpen}
        className="era-card group flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left transition hover:brightness-110"
        // Accessible name must contain the visible label ("Track guide") to
        // satisfy WCAG 2.5.3 Label in Name (#702), same rule the old player followed.
        aria-label={`Track guide: ${trackCount} ${trackCount === 1 ? 'song' : 'songs'}`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105"
          style={{ backgroundColor: 'var(--era-accent)' }}
        >
          <Play
            className="h-4 w-4 translate-x-px"
            style={{ color: 'var(--era-bg)' }}
            fill="currentColor"
          />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
            Track guide
          </span>
          <span className="block truncate text-sm font-semibold text-[color:var(--era-ink)]">
            {trackCount} {trackCount === 1 ? 'song' : 'songs'}
          </span>
        </span>
      </button>
    </div>
  );
}
