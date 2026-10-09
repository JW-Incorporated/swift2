'use client';

import { useRef, useState } from 'react';
import { Compass, Layers, Sparkles, VenetianMask, Users, ShoppingBag } from 'lucide-react';
import { useIsomorphicLayoutEffect } from '../lib/useIsomorphicLayoutEffect';
import { cn } from '../lib/utils';

export type ToggleMode = 'era' | 'threads' | 'mood' | 'clownbot' | 'community' | 'merch';

export function ModeToggle({
  mode,
  onChange,
  alwaysShowLabels = false,
  labelsFromContainer = false,
}: {
  mode: ToggleMode;
  onChange: (m: ToggleMode) => void;
  /** Landing page (#684): the toggle is the front door's primary control, so
   *  its labels must be visible on every viewport, not just sm+. */
  alwaysShowLabels?: boolean;
  /** TopBar: the xl labelled/630px state keys off the row's rem-based container
   *  width (76rem = 1216px content box, viewport >=1264px at 100% text) so large text falls back to icon-only
   *  instead of overflowing the row (#5328). */
  labelsFromContainer?: boolean;
}) {
  // #5023: md..xl (iPad) is icon-only and content-width — the fixed 630px pill
  // plus the actions overflowed the row and covered the era-menu button.
  const labelClass = alwaysShowLabels
    ? undefined
    : labelsFromContainer
      ? 'hidden sm:inline md:@max-[76rem]:hidden'
      : 'hidden sm:inline md:hidden xl:inline';
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
      role="group"
      aria-label="Navigation mode"
      className={cn(
        'relative flex w-auto items-center rounded-full border border-line bg-surface p-1',
        // A fourth labelled tab overflows a 360px phone at a fixed width, so
        // the always-labelled (landing) variant is fluid up to its ideal size.
        // Fixed widths scaled 1.5x (352->528, 420->630) for the two new tabs.
        alwaysShowLabels
          ? 'w-full max-w-[528px] md:max-w-[630px]'
          : labelsFromContainer
            ? 'sm:w-[528px] md:w-[630px] md:@max-[76rem]:w-auto'
            : 'sm:w-[528px] md:w-auto xl:w-[630px]',
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
        aria-pressed={mode === 'era'}
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
        aria-pressed={mode === 'threads'}
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
        aria-pressed={mode === 'mood'}
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
        aria-pressed={mode === 'clownbot'}
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
        aria-pressed={mode === 'community'}
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
        aria-pressed={mode === 'merch'}
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
