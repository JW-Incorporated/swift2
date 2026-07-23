'use client';

import { useAppActions } from '@/lib/longlive/store';
import { EraGrid } from './EraGrid';
import { ModeToggle } from './TopBar';

/**
 * The site's front door (#684, founder decision 2026-07-15): a real page —
 * not a pop-up — with the Long Live wordmark, the Eras/Threads toggle
 * prominent alongside it, then the twelve-era grid. Picking an era steps
 * inside it (era mode); the toggle's Threads side goes straight to the
 * threads gallery. Back from either returns here via the nav stack.
 */
export function LandingPage() {
  const { openEra, setMode } = useAppActions();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pt-20">
        <header className="mb-10 flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--era-accent-2)]">
              A Taylor Swift time machine app
            </p>
            <h1 className="font-era text-5xl font-semibold tracking-tight sm:text-7xl">
              Long&nbsp;Live
            </h1>
            <p className="max-w-xs text-sm text-[color:var(--era-ink-soft)] sm:max-w-sm sm:text-base">
              Real-time updates on her whole life, or step back into any era.
            </p>
          </div>
          <ModeToggle
            mode="era"
            alwaysShowLabels
            onChange={(m) => {
              if (m === 'threads') setMode('threads');
            }}
          />
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
