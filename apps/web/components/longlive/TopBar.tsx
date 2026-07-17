'use client';

import { ChevronDown, Compass, Search, Share2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEra } from '@/lib/longlive/eras';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { Button } from '@/components/ui/button';
import { TimelineScrubber } from './TimelineScrubber';
import { topbarShareTarget } from '@/lib/longlive/share';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

export function TopBar() {
  const { mode, eraId, lensId } = useAppState();
  const { setMode, setSelectorOpen, setSearchOpen, openShare, goHome } = useAppActions();
  const era = getEra(eraId);

  // The landing page renders its own wordmark + toggle instead (#684); the
  // shell never mounts TopBar there, this guard just narrows the type.
  if (mode === 'landing') return null;

  const shareTarget = topbarShareTarget(mode, eraId, lensId);

  function handleHome() {
    goHome();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <header className="sticky top-0 z-40">
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
                <span className="sm:hidden">{era.shortName}</span>
                <span className="hidden sm:inline">{era.name}</span>
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
            <span className="min-w-0 truncate text-sm font-medium text-ink-soft">The Threads</span>
          )}
        </div>

        <div className={TOPBAR_ACTIONS_CLASS}>
          <ModeToggle mode={mode} onChange={setMode} />
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

export function ModeToggle({
  mode,
  onChange,
  alwaysShowLabels = false,
}: {
  mode: 'era' | 'threads';
  onChange: (m: 'era' | 'threads') => void;
  /** Landing page (#684): the toggle is the front door's primary control, so
   *  its labels must be visible on every viewport, not just sm+. */
  alwaysShowLabels?: boolean;
}) {
  const labelClass = alwaysShowLabels ? undefined : 'hidden sm:inline';
  return (
    <div
      role="tablist"
      aria-label="Navigation mode"
      className={cn(
        'relative flex w-auto items-center rounded-full border border-line bg-surface p-1',
        alwaysShowLabels ? 'w-[196px]' : 'sm:w-[196px]',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-accent transition-transform duration-300 ease-out"
        style={{ transform: mode === 'era' ? 'translateX(0)' : 'translateX(100%)' }}
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
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm',
          mode === 'era' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Compass className="size-3.5 md:size-4" />
        <span className={labelClass}>Eras</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'threads'}
        aria-label="Threads"
        onClick={() => onChange('threads')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm',
          mode === 'threads' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Layers className="size-3.5 md:size-4" />
        <span className={labelClass}>Threads</span>
      </button>
    </div>
  );
}
