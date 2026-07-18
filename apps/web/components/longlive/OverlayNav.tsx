'use client';

import { X } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { ModeToggle } from './TopBar';

/**
 * A slim global-nav bar pinned to the top of the immersive track/song overlays
 * (#525 — those overlays covered the TopBar, so there was no way to jump to
 * Eras/Threads/home without backing out one layer at a time). It carries the
 * same primary controls as the TopBar and, crucially, navigates OUT: the
 * wordmark goes home, and the Eras/Threads toggle closes the track stack before
 * switching mode so the destination is actually visible. `onClose` is the
 * overlay's own one-level dismiss (kept as the familiar X).
 */
export function OverlayNav({ onClose }: { onClose: () => void }) {
  const { mode } = useAppState();
  const { goHome, setMode, closeTrackGuide } = useAppActions();
  const navMode = mode === 'threads' ? 'threads' : 'era';

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[color:var(--era-line)] bg-[color:var(--era-bg)]/85 px-4 py-2 backdrop-blur-md">
      <button
        type="button"
        onClick={goHome}
        aria-label="Long Live — home"
        className="shrink-0 rounded-md px-1 font-[family-name:var(--era-font)] text-base font-semibold tracking-tight text-[color:var(--era-ink)] transition-opacity hover:opacity-70 md:text-lg"
      >
        Long&nbsp;Live
      </button>
      <div className="flex items-center gap-2">
        <ModeToggle
          mode={navMode}
          onChange={(m) => {
            // Leave the track stack first, or the new mode renders behind it.
            closeTrackGuide();
            setMode(m);
          }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="era-icon-btn grid size-11 shrink-0 place-items-center rounded-full"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
