'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { MessageSquarePlus, X, Check, Loader2 } from 'lucide-react';
import { useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { useFocusTrap } from '@/lib/longlive/useFocusTrap';

// A floating "report an issue" button, fixed to the bottom-right so it follows
// the viewport as you scroll. Opens a small free-form panel; on submit it POSTs
// to /api/feedback, which files a GitHub issue (a "ticket") mirroring the Karen
// shape but flagged user-submitted, and records WHERE in the app the feedback
// was given (era, view, open moment/track/theory, URL).

type Location = {
  eraId?: string;
  eraName?: string;
  mode?: string;
  view?: string;
  openMomentId?: string | null;
  openTrackKey?: string | null;
  trackGuideEraId?: string | null;
  theoryGuideEraId?: string | null;
  lensId?: string | null;
  url?: string;
  pageTitle?: string;
  viewport?: string;
  userAgent?: string;
  ts?: string;
};

const MAX = 5000;

/** Session-scoped (not localStorage) — Joey: "closed for the rest of their
 * session," not forever. Dismissing is a per-visit choice, not a permanent one. */
const DISMISSED_KEY = 'll-feedback-dismissed-v1';

function readDismissed(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    /* private mode / quota — the dismissal just won't persist */
  }
}

export function FeedbackButton() {
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const textareaId = useId();

  // Hydrate before paint, never during render — reading sessionStorage
  // during render would break SSR (no `window`), but a plain post-paint
  // `useEffect` let an already-dismissed session flash the trigger back on
  // every full reload before flipping it hidden again (re-review finding G,
  // 2026-08-13). `useLayoutEffect` still can't run on the server (SSR/first
  // paint always renders the un-dismissed button, so no hydration mismatch),
  // but on the client it commits before the browser paints, so a returning,
  // already-dismissed session never actually shows the flash.
  useLayoutEffect(() => {
    if (readDismissed()) setDismissed(true);
  }, []);

  function dismissForSession() {
    setOpen(false);
    setDismissed(true);
    writeDismissed();
  }

  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Dismissed for the rest of this session (sessionStorage), or the clown
  // bot chat is expanded to its own `fixed inset-0` fullscreen overlay
  // (ClownChat.tsx) — either way, render nothing, not even the floating
  // trigger. A genuinely fullscreen app surface owns the top layer while
  // active; page furniture has no business floating above it, and unmounting
  // outright (not just visually hiding it) also keeps it out of the tab
  // order while it's invisible. Checked after every hook above so hook order
  // stays identical across renders.
  if (dismissed || state.clownChatExpanded) return null;

  /** Human-readable description of the current view for the ticket. */
  function describeView(): string {
    if (state.openItemId) return `moment detail (${state.openItemId})`;
    if (state.openTrackKey) return `track detail (${state.openTrackKey})`;
    if (state.trackGuideEraId) return `track guide (${state.trackGuideEraId})`;
    if (state.theoryGuideEraId) return `theories/eggs (${state.theoryGuideEraId})`;
    if (state.searchOpen) return 'search';
    if (state.mode === 'threads') return state.lensId ? `thread: ${state.lensId}` : 'threads gallery';
    return 'era stream';
  }

  function buildLocation(): Location {
    let eraName: string | undefined;
    try {
      eraName = getEra(state.eraId)?.name;
    } catch {
      eraName = undefined;
    }
    return {
      eraId: state.eraId,
      eraName,
      mode: state.mode,
      view: describeView(),
      openMomentId: state.openItemId,
      openTrackKey: state.openTrackKey,
      trackGuideEraId: state.trackGuideEraId,
      theoryGuideEraId: state.theoryGuideEraId,
      lensId: state.lensId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      pageTitle: typeof document !== 'undefined' ? document.title : undefined,
      viewport:
        typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ts: new Date().toISOString(),
    };
  }

  async function submit() {
    const message = msg.trim();
    if (!message || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, location: buildLocation(), hp }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('sent');
        setMsg('');
        window.setTimeout(() => {
          setOpen(false);
          setStatus('idle');
        }, 1800);
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Couldn’t send that — please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please try again.');
    }
  }

  return (
    <>
      {open && (
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
          // Mobile: cleared of BottomNav (fixed, ~56px + safe-area-inset-bottom)
          // by sitting well above it; desktop is unchanged (no bottom nav there).
          className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] right-4 z-[71] w-[min(92vw,21rem)] rounded-2xl border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur-md md:bottom-20"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-ink">Find an issue? Report it here!</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close feedback"
              className="era-icon-btn -mr-1 -mt-1 rounded-full"
            >
              <X size={16} />
            </button>
          </div>

          {/* Persistent live region (#835) — this div itself never
              unmounts, only the content inside it swaps, which is what makes
              screen readers actually announce the change (a live region
              added at the same moment as its content often isn't announced).
              `polite` covers the success text; the error `<p>` additionally
              carries `role="alert"` for its own assertive announcement. */}
          <div role="status" aria-live="polite">
            {status === 'sent' ? (
              <p className="flex items-center gap-2 py-3 text-sm text-accent">
                <Check size={16} /> Thanks — your report was filed.
              </p>
            ) : (
              <>
                <label htmlFor={textareaId} className="sr-only">
                  Describe the issue
                </label>
                <textarea
                  id={textareaId}
                  ref={textareaRef}
                  value={msg}
                  maxLength={MAX}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
                  }}
                  placeholder="Wrong date, bad photo, typo, broken link… tell us what you saw."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-line bg-bg p-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
                />
                {/* Honeypot — hidden from humans, catches bots. */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="hidden"
                  aria-hidden="true"
                />
                {errorMsg && (
                  <p role="alert" className="mt-2 text-xs text-red-400">
                    {errorMsg}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-soft">
                    Reporting from: {describeView()}
                  </span>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!msg.trim() || status === 'sending'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-opacity disabled:opacity-40"
                  >
                    {status === 'sending' ? <Loader2 size={14} className="animate-spin" /> : null}
                    {status === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile: floats above BottomNav (fixed, ~56px + safe-area-inset-bottom)
          instead of sitting on top of it; desktop is unchanged. A row, not a
          badge overlapping the trigger: `.era-icon-btn` forces BOTH buttons
          to a 44px floor, so a `size-5` badge absolutely positioned over the
          icon-only mobile trigger actually covered nearly all of it — tapping
          "Feedback" silently dismissed the widget instead of opening it
          (re-review finding D, 2026-08-13). Laid out side by side with a gap
          instead, so the two 44px targets never overlap. */}
      <div
        data-social-hide="feedback-button"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[71] flex items-center gap-2 md:bottom-4"
      >
        {/* Dismisses the whole widget for the rest of the session (Joey: "it
            shouldn't keep coming back and annoying them"), distinct from just
            closing the compose panel. Only offered while idle; while
            composing, the panel's own close X is the relevant control. */}
        {!open && (
          <button
            type="button"
            onClick={dismissForSession}
            aria-label="Dismiss the feedback button for this session"
            className="era-icon-btn rounded-full border border-line bg-bg text-ink-soft shadow"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close feedback' : 'Send feedback'}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-4 py-3 text-sm font-medium text-ink shadow-2xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        >
          {open ? <X size={18} /> : <MessageSquarePlus size={18} />}
          <span className="hidden sm:inline">Feedback</span>
        </button>
      </div>
    </>
  );
}
