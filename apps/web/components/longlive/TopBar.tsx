'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/longlive/useIsomorphicLayoutEffect';
import {
  Bell,
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
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getEra } from '@/lib/longlive/eras';
import { getThread } from '@/lib/longlive/lenses';
import { isInAppDocument, postToNativeApp } from '@/lib/longlive/in-app';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { Button } from '@/components/ui/button';
import { TimelineScrubber } from './TimelineScrubber';
import { topbarShareTarget } from '@/lib/longlive/share';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

export function TopBar() {
  const { mode, eraId, lensId } = useAppState();
  const { setMode, setSelectorOpen, setSearchOpen, openShare, goHome } = useAppActions();
  const era = getEra(eraId);

  // OS-002: inside the app, the bell hands off to the native notification
  // settings screen instead of navigating to the web page — see
  // `apps/web/lib/longlive/in-app.ts` and `docs/architecture.md`. `false`
  // until the mount effect runs so server and first-client render agree
  // (see `isInAppDocument`'s doc comment).
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setInApp(isInAppDocument());
  }, []);

  function handleBellPress() {
    postToNativeApp({ type: 'openNotificationSettings' });
  }

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
            aria-label="Notification settings"
            title="Notification settings"
            asChild={!inApp}
            onClick={inApp ? handleBellPress : undefined}
          >
            {inApp ? (
              <Bell />
            ) : (
              <Link href="/settings/notifications">
                <Bell />
              </Link>
            )}
          </Button>
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
  // #1991: below `sm` this instance (rendered as-is inside OverlayNav,
  // squeezed alongside the wordmark + share/close buttons) stays icon-only —
  // six always-visible labels don't fit that shared row's real width budget
  // (~150px on a 375px phone) even stacked. `aria-label` (#656) plus the
  // `title` tooltip on each tab cover screen readers and hover disambiguation
  // (the VenetianMask/Clownbot icon in particular); the tap targets and font
  // size below are bumped regardless (`py-2.5`/`text-xs`, from `py-1.5`/
  // `text-[11px]`) since that's a pure height change with no width cost.

  // The tab buttons are `flex-1 basis-0` but NOT equal width in practice —
  // they keep their default min-width:auto, so a long label (e.g.
  // "Clownbot") claims more than an even share and its neighbours get less.
  // A fixed fraction (`100% / tabCount`) for the sliding indicator therefore
  // drifted further out of alignment with every tab to its right.
  // Instead, measure the active tab's own box and copy it exactly — correct
  // for any label widths, and for tab count changing later.
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Partial<Record<ToggleMode, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    function measure() {
      const btn = buttonRefs.current[mode];
      if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [mode]);

  function registerTab(m: ToggleMode) {
    return (el: HTMLButtonElement | null) => {
      if (el) buttonRefs.current[m] = el;
    };
  }

  return (
    <div
      ref={containerRef}
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
        className="absolute inset-y-1 rounded-full bg-accent transition-[left,width] duration-300 ease-out"
        style={
          indicator
            ? { left: indicator.left, width: indicator.width }
            : { left: 0, width: 0, opacity: 0 }
        }
      />
      <button
        ref={registerTab('era')}
        role="tab"
        aria-selected={mode === 'era'}
        // Below `sm` the visible label is hidden (icon-only), so name the tab
        // explicitly — otherwise a screen reader announces an unlabeled button
        // on mobile (#656, WCAG 4.1.2).
        aria-label="Eras"
        title="Eras"
        onClick={() => onChange('era')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'era' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Compass className={iconClass} />
        <span className={labelClass}>Eras</span>
      </button>
      <button
        ref={registerTab('threads')}
        role="tab"
        aria-selected={mode === 'threads'}
        aria-label="Threads"
        title="Threads"
        onClick={() => onChange('threads')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'threads' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Layers className={iconClass} />
        <span className={labelClass}>Threads</span>
      </button>
      <button
        ref={registerTab('mood')}
        role="tab"
        aria-selected={mode === 'mood'}
        // Same reason as the other two: below `sm` this is icon-only, so the
        // tab needs an explicit name or a screen reader announces an unlabeled
        // button (#656, WCAG 4.1.2).
        aria-label="Mood"
        title="Mood"
        onClick={() => onChange('mood')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'mood' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Sparkles className={iconClass} />
        <span className={labelClass}>Mood</span>
      </button>
      <button
        ref={registerTab('clownbot')}
        role="tab"
        aria-selected={mode === 'clownbot'}
        // Same reason as the others (#656, WCAG 4.1.2).
        aria-label="Clownbot"
        title="Clownbot"
        onClick={() => onChange('clownbot')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'clownbot' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <VenetianMask className={iconClass} />
        <span className={labelClass}>Clownbot</span>
      </button>
      <button
        ref={registerTab('community')}
        role="tab"
        aria-selected={mode === 'community'}
        // Same reason as the others (#656, WCAG 4.1.2).
        aria-label="Community"
        title="Community"
        onClick={() => onChange('community')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'community' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Users className={iconClass} />
        <span className={labelClass}>Community</span>
      </button>
      <button
        ref={registerTab('merch')}
        role="tab"
        aria-selected={mode === 'merch'}
        // Same reason as the others (#656, WCAG 4.1.2).
        aria-label="Merch"
        title="Merch"
        onClick={() => onChange('merch')}
        className={cn(
          'relative z-10 flex flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-semibold transition-colors md:px-3 md:text-sm',
          mode === 'merch' ? 'text-bg' : 'text-ink-soft hover:text-ink',
        )}
      >
        <ShoppingBag className={iconClass} />
        <span className={labelClass}>Merch</span>
      </button>
    </div>
  );
}
