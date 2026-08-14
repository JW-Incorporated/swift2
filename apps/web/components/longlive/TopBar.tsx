'use client';

import {
  ChevronDown,
  Compass,
  Search,
  Share2,
  Layers,
  Sparkles,
  VenetianMask,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEra } from '@/lib/longlive/eras';
import { getThread } from '@/lib/longlive/lenses';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { Button } from '@/components/ui/button';
import { TimelineScrubber } from './TimelineScrubber';
import { topbarShareTarget } from '@/lib/longlive/share';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

export function TopBar() {
  const { mode, eraId, lensId } = useAppState();
  const { setMode, setSelectorOpen, setSearchOpen, openShare, goHome } = useAppActions();
  const era = getEra(eraId);

  const shareTarget = topbarShareTarget(mode, eraId, lensId);

  // Home is now (R1, PLAN.md 2026-08-14): the wordmark scrolls to the top of
  // the current era, not a separate home screen. goHome bumps eraJumpSeq,
  // which drives EraStream's own jump-scroll correction to the target era
  // section — no separate scroll call needed here.
  function handleHome() {
    goHome();
  }

  return (
    <header data-ll-topbar className="sticky top-0 z-40">
      {/* Peek strip / timeline lives at the very top in era mode. */}
      {mode === 'era' && <TimelineScrubber />}

      <div className={TOPBAR_ROW_CLASS}>
        <div className={TOPBAR_LEFT_CLASS}>
          <button
            type="button"
            onClick={handleHome}
            aria-label="Long Live — back to home"
            className="shrink-0 rounded-md font-era text-base font-semibold tracking-tight transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:text-xl"
          >
            Long&nbsp;Live
          </button>
          <span className="h-5 w-px shrink-0 bg-line" aria-hidden />
          {mode === 'era' ? (
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              aria-label={`${era.name} — open the eras menu`}
              className="group flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-left transition-colors hover:bg-surface"
            >
              <span className="min-w-0 truncate text-sm font-medium text-ink">
                {/* Context label (P4 step 19) — mobile shortens to the era's
                    shortName, desktop keeps the full name, same split the era
                    name itself already used. */}
                <span className="sm:hidden">Era: {era.shortName}</span>
                <span className="hidden sm:inline">Era: {era.name}</span>
              </span>
              <ChevronDown
                className="size-3.5 shrink-0 text-ink-soft transition-transform group-hover:translate-y-0.5"
                aria-hidden
              />
              {era.isCurrent && (
                <span className="hidden shrink-0 items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  Now
                </span>
              )}
            </button>
          ) : (
            <span className="min-w-0 truncate text-sm font-medium text-ink-soft">
              {mode === 'mood'
                ? 'Mood'
                : mode === 'clownbot'
                  ? 'Clownbot'
                  : mode === 'community'
                    ? 'Community'
                    : mode === 'merch'
                      ? 'Merch'
                      : lensId
                        ? `Thread: ${getThread(lensId).title}`
                        : 'The Threads'}
            </span>
          )}
        </div>

        <div className={TOPBAR_ACTIONS_CLASS}>
          {/* Mobile: the bottom tab bar is now the rail (P4 step 19), so the
              pills only render at md+. Desktop keeps them exactly as before. */}
          <div className="hidden md:block">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <Button
            variant="surface"
            size="icon"
            aria-label="Search the archive (press /)"
            title="Search (/)"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
          </Button>
          {/* Always rendered, disabled when there's nothing to share — never
              conditionally removed; see topbarShareTarget (#492/#453). */}
          <Button
            variant="surface"
            size="icon"
            aria-label="Share"
            title="Share"
            disabled={shareTarget == null}
            onClick={() => {
              if (shareTarget) openShare(shareTarget);
            }}
          >
            <Share2 />
          </Button>
        </div>
      </div>
    </header>
  );
}

export type ToggleMode = 'era' | 'threads' | 'mood' | 'clownbot' | 'community' | 'merch';

/** Tab order — also the indicator's translateX multiplier. */
const TOGGLE_ORDER: readonly ToggleMode[] = [
  'era',
  'threads',
  'mood',
  'clownbot',
  'community',
  'merch',
];

export function ModeToggle({
  mode,
  onChange,
  alwaysShowLabels = false,
}: {
  mode: ToggleMode;
  onChange: (m: ToggleMode) => void;
  /** Landing page (#684): the toggle is the front door's primary control, so
   *  its labels must be visible on every viewport, not just sm+. */
  alwaysShowLabels?: boolean;
}) {
  const labelClass = alwaysShowLabels ? undefined : 'hidden sm:inline';
  // With four labelled tabs the landing-page variant has no room for icons on
  // a narrow phone, so it goes text-only there and regains them at sm+.
  const iconClass = cn('size-3.5 md:size-4', alwaysShowLabels && 'hidden sm:block');
  // Six surfaces now, so the sliding indicator is sixths: container padding
  // is p-1 (0.25rem each side), so one tab is (W - 0.5rem) / 6. Same
  // derivation as the old 25% - 0.125rem; only the divisor changed.
  const index = Math.max(0, TOGGLE_ORDER.indexOf(mode));
  return (
    <div
      role="tablist"
      aria-label="Navigation mode"
      className={cn(
        'relative flex w-auto items-center rounded-full border border-line bg-surface p-1',
        // A fourth labelled tab overflows a 360px phone at a fixed width, so
        // the always-labelled (landing) variant is fluid up to its ideal size.
        // Fixed widths scaled 1.5x (352->528, 420->630) for the two new tabs.
        alwaysShowLabels ? 'w-full max-w-[528px] md:max-w-[630px]' : 'sm:w-[528px] md:w-[630px]',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 w-[calc((100%-0.5rem)/6)] rounded-full bg-accent transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      <button
        role="tab"
        aria-selected={mode === 'era'}
        // Below `sm` the visible label is hidden (icon-only), so name the tab
        // explicitly — otherwise a screen reader announces an unlabeled button
        // on mobile (#656, WCAG 4.1.2).
        aria-label="Eras"
        onClick={() => onChange('era')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'era' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Compass className={iconClass} />
        <span className={labelClass}>Eras</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'threads'}
        aria-label="Threads"
        onClick={() => onChange('threads')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'threads' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Layers className={iconClass} />
        <span className={labelClass}>Threads</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'mood'}
        // Same reason as the other two: below `sm` this is icon-only, so the
        // tab needs an explicit name or a screen reader announces an unlabeled
        // button (#656, WCAG 4.1.2).
        aria-label="Mood"
        onClick={() => onChange('mood')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'mood' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Sparkles className={iconClass} />
        <span className={labelClass}>Mood</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'clownbot'}
        // Same reason as the others (#656, WCAG 4.1.2).
        aria-label="Clownbot"
        onClick={() => onChange('clownbot')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'clownbot' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <VenetianMask className={iconClass} />
        <span className={labelClass}>Clownbot</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'community'}
        // Same reason as the others (#656, WCAG 4.1.2).
        aria-label="Community"
        onClick={() => onChange('community')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'community' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Users className={iconClass} />
        <span className={labelClass}>Community</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'merch'}
        // Same reason as the others (#656, WCAG 4.1.2).
        aria-label="Merch"
        onClick={() => onChange('merch')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'merch' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <ShoppingBag className={iconClass} />
        <span className={labelClass}>Merch</span>
      </button>
    </div>
  );
}
