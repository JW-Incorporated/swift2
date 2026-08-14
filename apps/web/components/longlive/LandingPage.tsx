'use client';

import { Share2 } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { EraGrid } from './EraGrid';
import { LandingMasthead } from './LandingMasthead';
import { ModeToggle } from './TopBar';

/**
 * The site's front door (#684, founder decision 2026-07-15): a real page —
 * not a pop-up — with the Long Live wordmark, the Eras/Threads toggle
 * prominent alongside it, then the twelve-era grid. Picking an era steps
 * inside it (era mode); the toggle's Threads side goes straight to the
 * threads gallery. Back from either returns here via the nav stack.
 */
export function LandingPage() {
  const { openEra, setMode, openShare } = useAppActions();

  return (
    <div className="min-h-screen">
      <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pt-20">
        {/* The front door has no TopBar (#684), so its Share button lives here
            — it's the single most-seen screen, and sharing is a founder-
            declared requirement for every screen (#707). Shares the bare site
            URL (no deep-link params needed for the landing page itself). */}
        <button
          type="button"
          onClick={() => openShare({ kind: 'site' })}
          aria-label="Share Long Live"
          title="Share"
          className="era-icon-btn absolute right-5 top-5 grid size-11 place-items-center rounded-full sm:top-6"
        >
          <Share2 className="size-5" />
        </button>
        <header className="mb-10 flex flex-col items-center gap-6 text-center">
          <LandingMasthead
            onNavigate={(m) => {
              // Same rule as the toggle below: 'era' is a no-op because the
              // landing page IS the era front door. The rest are real jumps.
              if (m === 'threads' || m === 'mood' || m === 'clownbot') setMode(m);
            }}
          />
          {/* Desktop only. On mobile BottomNav is the rail now, and showing
              both would put the same four destinations on screen twice. */}
          <div className="hidden md:block">
            <ModeToggle
              mode="era"
              alwaysShowLabels
              onChange={(m) => {
                // 'era' is a no-op here: the front door IS the era surface, so
                // its own tab stays selected. The others are real jumps.
                if (m === 'threads' || m === 'mood' || m === 'clownbot') setMode(m);
              }}
            />
          </div>
        </header>

        <div className="mb-6">
          <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold">
            Choose an era
          </h2>
          <p className="mt-1 text-sm text-[color:var(--era-ink-soft)]">
            Twelve chapters, newest first. Tap one to step inside.
          </p>
        </div>

        <EraGrid onPick={openEra} />
      </div>
    </div>
  );
}
