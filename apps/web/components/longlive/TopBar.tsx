'use client';

import { Compass, Share2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEra } from '@/lib/longlive/eras';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { Button } from '@/components/ui/button';
import { TimelineScrubber } from './TimelineScrubber';

export function TopBar() {
  const { mode, eraId, lensId } = useAppState();
  const { setMode, setSelectorOpen, openShare, goHome } = useAppActions();
  const era = getEra(eraId);

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

      <div className="flex items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleHome}
            aria-label="Long Live — back to home"
            className="rounded-md font-era text-lg font-semibold tracking-tight transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:text-xl"
          >
            Long&nbsp;Live
          </button>
          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />
          {mode === 'era' ? (
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="group flex min-w-0 items-center gap-2 rounded-full px-2 py-1 text-left transition-colors hover:bg-surface"
            >
              <span className="min-w-0 truncate text-sm font-medium text-ink">{era.name}</span>
              {era.isCurrent && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  Now
                </span>
              )}
            </button>
          ) : (
            <span className="truncate text-sm font-medium text-ink-soft">The Threads</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <Button
            variant="surface"
            size="icon"
            aria-label="Share"
            onClick={() =>
              openShare(mode === 'era' ? { kind: 'era', eraId } : { kind: 'lens', lensId: lensId ?? 'love-story' })
            }
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
      className="relative flex items-center rounded-full border border-line bg-surface p-1"
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
          'relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm',
          mode === 'era' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Compass className="size-3.5 md:size-4" />
        Eras
      </button>
      <button
        role="tab"
        aria-selected={mode === 'threads'}
        onClick={() => onChange('threads')}
        className={cn(
          'relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm',
          mode === 'threads' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Layers className="size-3.5 md:size-4" />
        Threads
      </button>
    </div>
  );
}
