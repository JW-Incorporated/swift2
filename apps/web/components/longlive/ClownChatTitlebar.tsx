'use client';

/**
 * The clown-bot panel's titlebar — split out of ClownChat.tsx to keep that
 * file under the 300-line cap (see MAP.md). Instant "this is an app" signal:
 * mask icon, name, online dot, and the full-screen toggle.
 */

import { Maximize2, Minimize2, VenetianMask } from 'lucide-react';
import type { RefObject } from 'react';

export function ClownChatTitlebar({
  expanded,
  onToggleExpanded,
  expandToggleRef,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
  expandToggleRef: RefObject<HTMLButtonElement | null>;
}) {
  const titlebarClassName = `flex flex-none items-center gap-2.5 border-b border-[color:var(--clown-line)] bg-[color:var(--clown-panel)] px-4 py-3${
    expanded ? ' pt-[max(0.75rem,env(safe-area-inset-top))]' : ''
  }`;

  return (
    <div className={titlebarClassName}>
      <span
        aria-hidden
        className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--clown-bg)]"
      >
        <VenetianMask className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold tracking-wide text-[color:var(--clown-ink)]">
          clown bot
        </span>
        <span className="block text-[11px] text-[color:var(--clown-ink-soft)]">
          grounded in the vault &middot; never guesses
        </span>
      </span>
      <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[color:var(--clown-ink-soft)]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-400" />
        online
      </span>
      {/* 32px visual box, 44px hit area via an invisible ::before (-inset-1.5 = 6px/side) — keeps the titlebar slim. */}
      <button
        ref={expandToggleRef}
        type="button"
        onClick={onToggleExpanded}
        aria-pressed={expanded}
        aria-label={expanded ? 'Exit full screen' : 'Expand to full screen'}
        className="relative ml-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[color:var(--clown-ink-soft)] transition before:absolute before:-inset-1.5 before:content-[''] hover:bg-[color:var(--clown-raised)] hover:text-[color:var(--clown-ink)]"
      >
        {expanded ? (
          <Minimize2 className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </div>
  );
}
