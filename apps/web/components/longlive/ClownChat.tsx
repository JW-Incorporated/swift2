'use client';

/**
 * Clownbot rebuild (build B) — the reader-facing surface. PLAN.md Step 9,
 * reworked per the founder's chat-panel mockup (2026-08-14): the box must
 * instantly read as an app embedded in the page, not another block of era
 * content ("the user must immediately know it's a chatgpt type of chat
 * box"). The panel below uses the fixed `--clown-*` tokens (globals.css)
 * instead of the era palette — deliberate, not a bug. Only the accent
 * (`var(--era-accent)`) still re-themes per era, so the app still visibly
 * belongs to Long Live.
 *
 * A fixed-height, three-row app panel (titlebar / scrolling stream / docked
 * composer) — see ClownMessageRow.tsx for how one turn renders. Pre-filled
 * on load with a real worked example (`SEED_EXAMPLE`); placeholder "lets
 * clown around" is a real `placeholder` attribute, never submitted content.
 * The titlebar toggle expands the panel to a `fixed inset-0` CSS overlay
 * (never the native Fullscreen API — unreliable on iOS Safari for
 * non-video elements). `ClownBoard` below prefills the composer on tap,
 * never auto-sends.
 *
 * NEVER render Taylor Swift imagery on this surface and never persist the
 * reader's words anywhere but the one POST below.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Loader2, Maximize2, Minimize2, Plus, VenetianMask } from 'lucide-react';
import { SEED_EXAMPLE } from '@/lib/longlive/clown-seed-example';
import type { ClownAnswer } from '@/lib/longlive/clown-answer';
import type { BoardItem } from '@/lib/longlive/clown-board';
import type { ClownTurn } from '@/lib/longlive/clown-client';
import { promptForItem } from '@/lib/longlive/clown-starters';
import { measureChromeHeight } from '@/lib/longlive/chrome-offset';
import { useAppActions, useAppState, type ClownMessage } from '@/lib/longlive/store';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { ClownBoard } from './ClownBoard';
import { ClownMessageRow } from './ClownMessageRow';

/**
 * Mirrors the BottomNav clearance LongLive.tsx already reserves — `3.5rem +
 * env(safe-area-inset-bottom)`, tied to `BottomNav.tsx`'s own rendered height
 * (a `min-h-11` row of tab buttons plus its own safe-area padding; BottomNav
 * sets no explicit height class of its own, so LongLive established this
 * number as the single source of truth rather than each caller re-measuring
 * the DOM for the same fact). `md:hidden` there — BottomNav does not render
 * at md+, so this only applies to the mobile-viewport calc below.
 */
const BOTTOM_NAV_CLEARANCE = 'calc(3.5rem + env(safe-area-inset-bottom))';

/** Matches the container's own `pt-3` below — kept as one literal so the
 * mobile height calc and the padding that produces it can't drift apart. */
const CONTAINER_TOP_PADDING = '0.75rem';

const MAX_CHARS = 300;
const INPUT_PLACEHOLDER = 'lets clown around';
const NETWORK_ERROR = "That didn't go through. Try again in a moment?";

/**
 * Always the first bubble, and never part of the store's capped transcript —
 * it's a static shipped example, not something the reader sent or the model
 * answered live (see clown-seed-example.ts).
 */
const SEED_MESSAGE: ClownMessage = {
  id: 'seed',
  question: SEED_EXAMPLE.question,
  answer: SEED_EXAMPLE.answer,
};

/** A prior answer, flattened to plain text for the transcript sent to
 * `/api/clown` — the route passes earlier turns straight through to the
 * model as-is (clown-client.ts's `buildMessages`), so this is the one place
 * a `ClownAnswer`'s segments collapse back into a single utterance. */
function flattenAnswer(answer: ClownAnswer): string {
  return answer.segments.map((s) => s.text).join('\n\n');
}

export function ClownChat() {
  const [text, setText] = useState('');
  // clownMessages is the store's capped (6), memory-only, never-persisted
  // transcript (store.tsx) — this component holds no transcript state of its
  // own. The seed example always renders first and never counts toward it.
  const { clownMessages } = useAppState();
  const { addClownMessage, setClownChatExpanded } = useAppActions();
  const messages = useMemo(() => [SEED_MESSAGE, ...clownMessages], [clownMessages]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Full-screen toggle — a CSS overlay, deliberately not the native
  // Fullscreen API (requestFullscreen on a non-video element is unreliable
  // on iOS Safari, precisely where filling the screen matters most).
  const [expanded, setExpanded] = useState(false);
  const expandToggleRef = useRef<HTMLButtonElement>(null);
  const wasExpandedRef = useRef(false);

  useScrollLock(expanded);

  // Mirror `expanded` into the shared store so page furniture that floats
  // above every other overlay (FeedbackButton, z-[71]) can hide itself while
  // this fullscreen surface is up — the return cleanup covers both collapsing
  // AND unmounting (e.g. a mode switch) while still expanded, so the flag can
  // never get stuck true.
  useEffect(() => {
    setClownChatExpanded(expanded);
    return () => setClownChatExpanded(false);
  }, [expanded, setClownChatExpanded]);

  // Available height for the collapsed (non-fullscreen) panel on mobile,
  // where there is no room to spare: viewport minus the sticky top chrome
  // (TopBar; FilterBar never mounts here) minus the container's own top
  // padding minus the fixed BottomNav. Re-measured on resize/reflow so a
  // TopBar height change (breakpoint crossing, font swap) can't leave it
  // stale. `useLayoutEffect`, not `useEffect`, so the very first client paint
  // already reflects it — the same flash this codebase already guards
  // against in FeedbackButton.tsx.
  const [chromeOffsetPx, setChromeOffsetPx] = useState(0);
  useLayoutEffect(() => {
    const update = () => setChromeOffsetPx(measureChromeHeight());
    update();
    const topBar = document.querySelector<HTMLElement>('[data-ll-topbar]');
    const ro = topBar ? new ResizeObserver(update) : undefined;
    ro?.observe(topBar as HTMLElement);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Escape exits full screen. Listener only lives while expanded, and is
  // torn down on every collapse/unmount via the effect's own cleanup.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  // Return focus to the toggle button on collapse (Escape or the button
  // itself), so keyboard users aren't dumped at the top of the document.
  useEffect(() => {
    if (!expanded && wasExpandedRef.current) {
      expandToggleRef.current?.focus();
    }
    wasExpandedRef.current = expanded;
  }, [expanded]);

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);

  const ask = useCallback(
    async (question: string) => {
      setBusy(true);
      setError(null);
      try {
        // PRIOR turns only, from the store's clownMessages — never SEED_MESSAGE
        // (a shipped fixture, not something this visitor said) and never the
        // question being sent now (the route appends that itself; sending it
        // here too would double it in the model's eyes).
        const transcript: ClownTurn[] = clownMessages.flatMap((m) => [
          { role: 'user' as const, text: m.question },
          { role: 'assistant' as const, text: flattenAnswer(m.answer) },
        ]);
        // `chip` deliberately omitted: that flag routes to the deterministic
        // zero-model fallback (board taps only prefill the composer — once the
        // reader hits send, per the founder's brief it's a normal question and
        // gets the full model treatment). The route's chip path stays built
        // and tested but is not wired up here on purpose.
        const res = await fetch('/api/clown', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: question, transcript }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const answer: ClownAnswer = await res.json();
        addClownMessage(question, answer);
        setText('');
      } catch {
        setError(NETWORK_ERROR);
      } finally {
        setBusy(false);
      }
    },
    [addClownMessage, clownMessages],
  );

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = text.trim();
      if (!t || busy) return;
      void ask(t);
    },
    [text, busy, ask],
  );

  /** A board tap prefills the composer and brings it into view — it never
   * sends (founder brief item 3: "the user stays in control"). */
  const handleBoardSelect = useCallback((item: BoardItem) => {
    setText(promptForItem(item));
    requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textareaRef.current?.focus();
    });
  }, []);

  const panelClassName = expanded
    ? 'fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-[color:var(--clown-bg)]'
    : // Mobile: height comes from `--clown-panel-h` below, a measured fit
      // under the chrome and above BottomNav so the composer lands on
      // screen without scrolling (founder, first phone test, 2026-08-14).
      // `md:h-[46rem]` overrides it at the desktop breakpoint, same as
      // every other `md:` override in this file — no bottom nav there and
      // the fixed 46rem ceiling still reads comfortably.
      'relative flex h-[var(--clown-panel-h)] w-full flex-col overflow-hidden rounded-[1.25rem] border border-[color:var(--clown-line)] bg-[color:var(--clown-bg)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] md:h-[46rem]';

  const panelStyle = { '--clown-panel-h': `calc(100dvh - ${chromeOffsetPx}px - ${CONTAINER_TOP_PADDING} - ${BOTTOM_NAV_CLEARANCE})` } as React.CSSProperties;

  const titlebarClassName = `flex flex-none items-center gap-2.5 border-b border-[color:var(--clown-line)] bg-[color:var(--clown-panel)] px-4 py-3${
    expanded ? ' pt-[max(0.75rem,env(safe-area-inset-top))]' : ''
  }`;

  const composerWrapClassName = `flex-none bg-[color:var(--clown-bg)] px-4 pb-4 pt-3.5 sm:px-6${
    expanded ? ' pb-[max(1rem,env(safe-area-inset-bottom))]' : ''
  }`;

  return (
    // Page-level "clown bot" title removed (founder, first phone test,
    // 2026-08-14): the panel's own titlebar below already says "clown bot",
    // and between the TopBar mode label and the BottomNav tab it was a
    // fourth repetition that only pushed the panel down. pt-3 sits the panel
    // close under TopBar — kept in sync with CONTAINER_TOP_PADDING above.
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-3">
      <div className={panelClassName} style={panelStyle}>
        {/* titlebar — instant "this is an app" signal */}
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
            onClick={toggleExpanded}
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

        {/* message stream — scrolls internally */}
        <div
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4 pt-6 sm:px-6"
          aria-live="polite"
          aria-atomic="false"
          aria-busy={busy}
        >
          <span className="self-center text-[10px] uppercase tracking-[0.14em] text-[color:var(--clown-ink-soft)] opacity-70">
            Example conversation
          </span>
          {messages.map((m) => (
            <ClownMessageRow key={m.id} message={m} />
          ))}
          {error && (
            <p role="status" className="text-sm text-[color:var(--clown-ink-soft)]">
              {error}
            </p>
          )}
        </div>

        {/* composer — docked pill */}
        <div className={composerWrapClassName}>
          {/* Plus/send: same 32px-visual / 44px-hit-area split as the titlebar toggle, so the pill keeps the mockup's proportions. */}
          <form
            onSubmit={submit}
            className="flex items-center gap-1.5 rounded-full border border-[color:var(--clown-line)] bg-[color:var(--clown-panel)] py-1 pl-1 pr-1 focus-within:border-[color:var(--era-accent)]"
          >
            <button
              type="button"
              disabled
              aria-label="Add attachment"
              className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full text-[color:var(--clown-ink-soft)] before:absolute before:-inset-1.5 before:content-[''] disabled:cursor-default"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
            <label htmlFor="clown-input" className="sr-only">
              Ask the clown
            </label>
            <textarea
              id="clown-input"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submit(e);
              }}
              rows={1}
              placeholder={INPUT_PLACEHOLDER}
              className="h-9 min-w-0 flex-1 resize-none bg-transparent px-0 py-2 text-[15px] leading-relaxed text-[color:var(--clown-ink)] outline-none placeholder:text-[color:var(--clown-ink-soft)] placeholder:opacity-60"
            />
            <button
              type="submit"
              disabled={!text.trim() || busy}
              aria-label="Send to clown bot"
              className={`relative flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--clown-bg)] transition before:absolute before:-inset-1.5 before:content-[''] ${
                text.trim() ? 'opacity-100' : 'opacity-[0.45]'
              }`}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CornerDownLeft className="h-4 w-4" aria-hidden />
              )}
            </button>
          </form>
          <p className="mt-2.5 text-center text-[11px] text-[color:var(--clown-ink-soft)] opacity-80">
            clown bot theorises from the vault. It can be wrong &mdash; that&rsquo;s the point.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <ClownBoard onSelect={handleBoardSelect} />
      </div>
    </div>
  );
}
