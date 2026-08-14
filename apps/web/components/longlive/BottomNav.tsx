'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Compass, Layers, Sparkles, VenetianMask } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppActions, useAppState, type AppMode } from '@/lib/longlive/store';
import { layoutBottomNavTabs, type BottomNavEntry } from '@/lib/longlive/bottom-nav-layout';
import { shouldHideNavForFocus } from '@/lib/longlive/bottom-nav-focus';

type BottomNavMode = Extract<AppMode, 'era' | 'threads' | 'mood' | 'clownbot'>;

interface Tab extends BottomNavEntry {
  mode: BottomNavMode;
  icon: LucideIcon;
}

// R3 (PLAN.md): 4 tabs today, 6 at full growth once Marketplace and Community
// ship. Add those two here when they exist — BOTTOM_NAV_ICON_ONLY_THRESHOLD in
// bottom-nav-layout.ts already degrades the bar to icon-only once it does.
const TABS: readonly Tab[] = [
  { id: 'era', label: 'Eras', mode: 'era', icon: Compass },
  { id: 'threads', label: 'Threads', mode: 'threads', icon: Layers },
  { id: 'mood', label: 'Mood', mode: 'mood', icon: Sparkles },
  { id: 'clownbot', label: 'Clownbot', mode: 'clownbot', icon: VenetianMask },
];

/**
 * True while a text input, textarea, or contenteditable holds focus anywhere
 * in the app — Mood's chat box in particular. The third of the bottom bar's
 * three collisions (PLAN.md P4 step 20 / § Known risks): the on-screen
 * keyboard sits exactly where the bar does, so the bar gets out of the way
 * rather than fighting it.
 *
 * Stuck-flag fix (adversarial review finding #1, 2026-08-13): `focusout`
 * never fires when its target is removed from the DOM — e.g. Escape-closing
 * SearchOverlay or the feedback panel while their input holds focus — so
 * `onFocusOut` alone could never clear the flag for that case; the nav
 * stayed hidden until some unrelated input was focused and blurred. Two
 * layers now: `onFocusOut` re-derives from `document.activeElement` (never
 * `e.target`) for the fast path where the event does fire, and a per-frame
 * safety-net effect below covers the DOM-removal case where no event fires
 * at all — it keeps re-checking `document.activeElement` while hidden and
 * clears the flag the instant it's no longer a text input.
 */
function useTextInputFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (shouldHideNavForFocus(e.target as Element | null)) setFocused(true);
    };
    const onFocusOut = () => {
      // Focus has not necessarily moved yet at the moment this event fires.
      requestAnimationFrame(() => {
        setFocused(shouldHideNavForFocus(document.activeElement));
      });
    };
    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!focused) return;
    let raf: number;
    const check = () => {
      if (!shouldHideNavForFocus(document.activeElement)) {
        setFocused(false);
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [focused]);

  return focused;
}

/**
 * Mobile tab bar (PLAN.md P4 step 18, R3). Desktop keeps the existing top
 * pill rail (TopBar's ModeToggle) and gets no bottom bar at all — this is
 * `md:hidden`.
 *
 * `fixed` + `env(safe-area-inset-bottom)` padding so it clears the iPhone
 * home indicator and mobile browser chrome (§ Known risks — a prior
 * on-device test rejected a bottom bar for exactly this collision; Joey
 * overrode that call knowingly, so this padding is load-bearing).
 */
export function BottomNav() {
  const { mode } = useAppState();
  const { setMode } = useAppActions();
  const inputFocused = useTextInputFocused();
  const tabs = layoutBottomNavTabs(TABS);
  // The landing page (mode: 'landing') IS the era front door — LandingPage's
  // own desktop toggle hardcodes `mode="era"` for exactly that reason, so no
  // tab there ever reads as unselected. BottomNav has no 'landing' tab of its
  // own, so without this it fell through to no `aria-current` at all on
  // mobile while desktop showed Eras selected (re-review finding E,
  // 2026-08-13).
  const currentMode = mode === 'landing' ? 'era' : mode;

  // Unmount outright rather than visually hide — a hidden-but-present bar
  // could still eat a stray tap while the keyboard covers it.
  if (inputFocused) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-4xl items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentMode === tab.mode;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              onClick={() => setMode(tab.mode)}
              className={cn(
                'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors',
                active ? 'text-accent' : 'text-ink-soft',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {!tab.iconOnly && <span>{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
