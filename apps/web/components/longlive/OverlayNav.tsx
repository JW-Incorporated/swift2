'use client';

import { ChevronDown, Share2, X } from 'lucide-react';
import { useAppActions, useAppState, type ShareTarget } from '@/lib/longlive/store';
import type { Era } from '@swift2/experience';
import { ModeToggle } from './TopBar';

/**
 * A slim global-nav bar pinned to the top of the immersive track/song overlays
 * (#773 — those overlays cover the TopBar, so its wordmark and era context
 * otherwise disappear). It carries the same primary controls as the TopBar
 * and, crucially, navigates OUT: the wordmark goes home, the era label opens
 * the shared selector, and the global mode rail closes the track stack before
 * switching mode so the destination is actually visible. `onClose` is the
 * overlay's own one-level dismiss (kept as the familiar X).
 *
 * `shareTarget` (#707): because these overlays cover the TopBar, its Share
 * button is unreachable here — so the affordance rides in this shared chrome,
 * the same reason home/toggle do. Opens the same ShareSheet every surface uses.
 */
export function OverlayNav({
  era,
  onClose,
  shareTarget,
}: {
  era: Era;
  onClose: () => void;
  shareTarget?: ShareTarget;
}) {
  const { mode } = useAppState();
  const { goHome, setMode, closeTrackGuide, openShare, setSelectorOpen } = useAppActions();
  const navMode = mode === 'threads' ? 'threads' : 'era';

  function openEraSelector() {
    // The selector renders below TrackDetail in the overlay stack. Leave the
    // track stack first so the era menu is visible and its pick can navigate.
    closeTrackGuide();
    setSelectorOpen(true);
  }

  return (
    <nav
      aria-label="Track overlay navigation"
      className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-[color:var(--era-line)] bg-[color:var(--era-bg)]/85 px-4 py-2 backdrop-blur-md lg:flex-nowrap"
    >
      <div className="order-1 flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={goHome}
          aria-label="Long Live — back to home"
          className="shrink-0 rounded-md px-1 font-[family-name:var(--era-font)] text-base font-semibold tracking-tight text-[color:var(--era-ink)] transition-opacity hover:opacity-70 md:text-lg"
        >
          Long&nbsp;Live
        </button>
        <span className="h-5 w-px shrink-0 bg-[color:var(--era-line)]" aria-hidden />
        <button
          type="button"
          onClick={openEraSelector}
          aria-label={`${era.name} — open the eras menu`}
          className="group flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-left transition-colors hover:bg-[color:var(--era-surface)]"
        >
          <span className="min-w-0 truncate text-sm font-medium text-[color:var(--era-ink)]">
            <span className="sm:hidden">Era: {era.shortName}</span>
            <span className="hidden sm:inline">Era: {era.name}</span>
          </span>
          <ChevronDown
            className="size-3.5 shrink-0 text-[color:var(--era-ink-soft)] transition-transform group-hover:translate-y-0.5"
            aria-hidden
          />
          {era.isCurrent && (
            <span className="hidden shrink-0 items-center gap-1 rounded-full border border-[color:var(--era-accent)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-accent)] sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--era-accent)]" />
              Now
            </span>
          )}
        </button>
      </div>
      <div className="order-3 flex basis-full justify-center lg:order-2 lg:basis-auto">
        <ModeToggle
          mode={navMode}
          onChange={(m) => {
            // Leave the track stack first, or the new mode renders behind it.
            closeTrackGuide();
            setMode(m);
          }}
        />
      </div>
      <div className="order-2 ml-auto flex shrink-0 items-center gap-2 lg:order-3 lg:ml-0">
        {shareTarget && (
          <button
            type="button"
            onClick={() => openShare(shareTarget)}
            aria-label="Share"
            title="Share"
            className="era-icon-btn grid size-11 shrink-0 place-items-center rounded-full"
          >
            <Share2 className="size-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="era-icon-btn grid size-11 shrink-0 place-items-center rounded-full"
        >
          <X className="size-5" />
        </button>
      </div>
    </nav>
  );
}
