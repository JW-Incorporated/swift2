'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, X, Check, Loader2 } from 'lucide-react';
import { useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';

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

  // Hydrate after mount, never during render — the same SSR-safe pattern
  // progress.ts's ProgressProvider uses: first paint (server AND client)
  // always shows the button, so there's no hydration mismatch, and the real
  // sessionStorage value swaps in once mounted.
  useEffect(() => {
    if (readDismissed()) setDismissed(true);
  }, []);

  function dismissForSession() {
    setOpen(false);
    setDismissed(true);
    writeDismissed();
  }

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

  // Dismissed for the rest of this session (sessionStorage) — render nothing,
  // not even the floating trigger. Checked after every hook above so hook
  // order stays identical across renders.
  if (dismissed) return null;

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
          role="dialog"
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

          {status === 'sent' ? (
            <p className="flex items-center gap-2 py-3 text-sm text-accent">
              <Check size={16} /> Thanks — your report was filed.
            </p>
          ) : (
            <>
              <textarea
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
              {errorMsg && <p className="mt-2 text-xs text-red-400">{errorMsg}</p>}
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
      )}

      {/* Mobile: floats above BottomNav (fixed, ~56px + safe-area-inset-bottom)
          instead of sitting on top of it; desktop is unchanged. Wrapped so the
          dismiss badge below can sit relative to the trigger, not the viewport. */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[71] md:bottom-4">
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
        {/* A sibling of the trigger, not nested inside it — dismisses the
            whole widget for the rest of the session (Joey: "it shouldn't keep
            coming back and annoying them"), distinct from just closing the
            compose panel. Only offered while idle; while composing, the
            panel's own close X is the relevant control. */}
        {!open && (
          <button
            type="button"
            onClick={dismissForSession}
            aria-label="Dismiss the feedback button for this session"
            className="era-icon-btn absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-line bg-bg text-ink-soft shadow"
          >
            <X size={11} />
          </button>
        )}
      </div>
    </>
  );
}
