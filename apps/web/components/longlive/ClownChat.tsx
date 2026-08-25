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
 * composer) — see ClownChatTitlebar.tsx, ClownChatComposer.tsx and
 * ClownMessageRow.tsx for how the titlebar, composer and one transcript turn
 * each render. Empty on load until the reader sends a first message
 * (EMPTY_STATE_TEXT); placeholder "lets clown around" is a real
 * `placeholder` attribute, never submitted content. The titlebar toggle
 * expands the panel to a `fixed inset-0` CSS overlay (never the native
 * Fullscreen API — unreliable on iOS Safari for non-video elements).
 * `ClownBoard` below prefills the composer on tap, never auto-sends.
 *
 * NEVER render Taylor Swift imagery on this surface. The reader's words DO
 * leave this component in more than the one POST below: the client holds no
 * transcript of its own beyond the store's capped `clownMessages` (never
 * persisted — see the comment on that field), but the server side of that
 * POST forwards the question/transcript to Anthropic's Claude API to answer
 * it, and — once the anonymous-identity system in `clown-memory.ts` is
 * switched on — stores the conversation in Supabase for up to 180 days
 * (`legal.ts`'s "Clownbot" privacy-policy section, issue #3251). This
 * component itself still does nothing beyond the one `fetch` below; the
 * warning above was simply wrong about what happens after that.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClownAnswer, InvestigationStep } from '@/lib/longlive/clown-answer';
import type { BoardItem } from '@/lib/longlive/clown-board';
import type { ClownTurn } from '@/lib/longlive/clown-client';
import { promptForItem } from '@/lib/longlive/clown-starters';
import { useChromeOffset } from '@/lib/longlive/useChromeOffset';
import { flattenAnswer, investigationLabel } from '@/lib/longlive/clown-chat-helpers';
import { readClownStream } from '@/lib/longlive/clown-stream';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { useStickToBottomScroll } from '@/lib/longlive/clown-chat-ui';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { ClownBoard } from './ClownBoard';
import { ClownChatComposer } from './ClownChatComposer';
import { ClownChatTitlebar } from './ClownChatTitlebar';
import { ClownEmptyState } from './ClownEmptyState';
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

const NETWORK_ERROR = "That didn't go through. Try again in a moment?";
const EMPTY_STATE_TEXT = 'Try our chat bot — ask a question below.';

export function ClownChat() {
  const [text, setText] = useState('');
  // clownMessages is the store's capped (6), memory-only, never-persisted
  // transcript (store.tsx) — this component holds no transcript state of its
  // own.
  const { clownMessages } = useAppState();
  const { addClownMessage, setClownChatExpanded } = useAppActions();
  const messages = clownMessages;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The agent loop's live trail (PLAN.md Stage 10) — reset per ask, cleared
  // once the final answer lands (it is rendered from `message.answer.
  // investigation` after that, not from this transient state).
  const [investigating, setInvestigating] = useState<InvestigationStep | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // Full-screen toggle — a CSS overlay, deliberately not the native
  // Fullscreen API (requestFullscreen on a non-video element is unreliable
  // on iOS Safari, precisely where filling the screen matters most).
  const [expanded, setExpanded] = useState(false);
  const expandToggleRef = useRef<HTMLButtonElement>(null);
  const wasExpandedRef = useRef(false);

  useScrollLock(expanded);

  // Scrolls the stream to the newest content — a new turn, a streamed
  // investigation step, or an error — but only when the reader was already
  // near the bottom.
  useStickToBottomScroll(streamRef, [messages, investigating, error]);

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
  // padding minus the fixed BottomNav. See `useChromeOffset.ts` for the
  // measure/re-measure mechanics (split out for file-length hygiene).
  const chromeOffsetPx = useChromeOffset('[data-ll-topbar]');

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
      setInvestigating(null);
      try {
        // PRIOR turns only, from the store's clownMessages — never the
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
        // Session continuity (architect-directed redesign, HUMAN-ACTIONS.md
        // #15 round 4): the route's server-side identity now round-trips via
        // an `HttpOnly` cookie the browser sends/receives automatically on
        // this same-origin `fetch` — no client-side token capture or storage
        // needed at all.
        const res = await fetch('/api/clown', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: question, transcript }),
        });
        if (!res.ok) throw new Error(String(res.status));
        // PLAN.md Stage 10: the route streams the agent loop's investigation
        // trail as it happens, then exactly one final answer event — every
        // deterministic (non-loop) response still arrives as a single event
        // under this same reader, so this replaces the old `res.json()` for
        // every path, not just the loop's.
        let answer: ClownAnswer | null = null;
        await readClownStream(res, (event) => {
          if (event.type === 'investigation') setInvestigating(event.step);
          else answer = event.answer;
        });
        if (!answer) throw new Error('no answer event in stream');
        addClownMessage(question, answer);
        setText('');
      } catch {
        setError(NETWORK_ERROR);
      } finally {
        setInvestigating(null);
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

  const handleStarterSelect = useCallback((prompt: string) => {
    setText(prompt);
    requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
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
        <ClownChatTitlebar
          className={titlebarClassName}
          expanded={expanded}
          onToggle={toggleExpanded}
          toggleRef={expandToggleRef}
        />

        {/* message stream — scrolls internally */}
        <div
          ref={streamRef}
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4 pt-6 sm:px-6"
          aria-live="polite"
          aria-atomic="false"
          aria-busy={busy}
        >
          {messages.length === 0 ? (
            <ClownEmptyState intro={EMPTY_STATE_TEXT} onSelect={handleStarterSelect} />
          ) : (
            messages.map((m) => <ClownMessageRow key={m.id} message={m} />)
          )}
          {busy && investigating && (
            <p role="status" className="text-xs italic text-[color:var(--clown-ink-soft)] opacity-80">
              {investigationLabel(investigating)}
            </p>
          )}
          {error && (
            <p role="status" className="text-sm text-[color:var(--clown-ink-soft)]">
              {error}
            </p>
          )}
        </div>

        {/* composer — docked pill */}
        <ClownChatComposer
          className={composerWrapClassName}
          text={text}
          setText={setText}
          submit={submit}
          busy={busy}
          textareaRef={textareaRef}
        />
      </div>

      <div className="mt-10">
        <ClownBoard onSelect={handleBoardSelect} />
      </div>
    </div>
  );
}
