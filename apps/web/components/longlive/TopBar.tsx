'use client';

import { ChevronDown, Compass, Search, Share2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEra } from '@/lib/longlive/eras';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { Button } from '@/components/ui/button';
import { TimelineScrubber } from './TimelineScrubber';
import {
  TOPBAR_ACTIONS_CLASS,
  TOPBAR_LEFT_CLASS,
  TOPBAR_ROW_CLASS,
  topbarShareTarget,
} from './topbarLayout';

export function TopBar() {
  const { mode, eraId, lensId } = useAppState();
  const { setMode, setSelectorOpen, setSearchOpen, openShare, goHome } = useAppActions();
  const era = getEra(eraId);
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
          {/* Always rendered so the actions group never changes width (the
              toggle-shift bug, #453). On the plain Threads gallery there is
              no share copy yet, so the button is disabled there (#492). */}
          <Button
            variant="surface"
            size="icon"
            aria-label="Share"
            disabled={shareTarget == null}
            onClick={() => shareTarget != null && openShare(shareTarget)}
          >
            <Share2 />
          </Button>
        </div>
      </div>
    </header>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'era' | 'threads';
  onChange: (m: 'era' | 'threads') => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Navigation mode"
      className="relative flex w-auto items-center rounded-full border border-line bg-surface p-1 sm:w-[196px]"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-accent transition-transform duration-300 ease-out"
        style={{ transform: mode === 'era' ? 'translateX(0)' : 'translateX(100%)' }}
      />
      <button
        role="tab"
        aria-selected={mode === 'era'}
        onClick={() => onChange('era')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm',
          mode === 'era' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Compass className="size-3.5 md:size-4" />
        <span className="hidden sm:inline">Eras</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'threads'}
        onClick={() => onChange('threads')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm',
          mode === 'threads' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Layers className="size-3.5 md:size-4" />
        <span className="hidden sm:inline">Threads</span>
      </button>
    </div>
  );
}
