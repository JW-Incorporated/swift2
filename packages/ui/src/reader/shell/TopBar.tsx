'use client';

import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Search, Share2 } from 'lucide-react';
import { useHost } from '../../host/context';
import { useReader } from '../../snapshot/context';
import { getEra, getThread } from '@swift2/experience';
import { isInAppDocument, postToNativeApp } from '../lib/in-app';
import { useAppActions, useAppState } from '../store';
import { Button } from './button';
import { ModeToggle } from './ModeToggle';
import { TimelineScrubber } from './TimelineScrubber';
import { topbarShareTarget } from '../lib/share';
import { shareTarget as share } from '../lib/share-payload';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

export function TopBar() {
  const host = useHost();
  const { Link } = host;
  const q = useReader();
  const { mode, eraId, lensId } = useAppState();
  const { setMode, setSelectorOpen, setSearchOpen, goHome } = useAppActions();
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
            className="shrink-0 rounded-md font-era text-[length:min(1rem,20px)] font-semibold tracking-tight transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:text-xl"
          >
            Long&nbsp;Live
          </button>
          <span className="h-5 w-px shrink-0 bg-line @max-[15rem]:hidden" aria-hidden />
          {mode === 'era' ? (
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="group flex min-w-0 items-center gap-[min(0.25rem,4px)] rounded-full px-[min(0.5rem,8px)] py-1 text-left transition-colors hover:bg-surface"
            >
              <span className="min-w-0 truncate text-sm font-medium text-ink">
                {/* Context label (P4 step 19) — mobile shortens to the era's
                    shortName, desktop keeps the full name, same split the era
                    name itself already used. */}
                <span className="sm:hidden">
                  <span className="@max-[20rem]:hidden">Era: </span>
                  {era.shortName}
                </span>
                <span className="hidden sm:inline">Era: {era.name}</span>
                <span className="sr-only">{' — open the eras menu'}</span>
              </span>
              <ChevronDown
                className="size-[min(0.875rem,14px)] shrink-0 text-ink-soft transition-transform group-hover:translate-y-0.5"
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
            <ModeToggle mode={mode} onChange={setMode} labelsFromContainer />
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
              if (shareTarget) void share(shareTarget, q, host);
            }}
          >
            <Share2 />
          </Button>
        </div>
      </div>
    </header>
  );
}

export { ModeToggle, type ToggleMode } from './ModeToggle';
