'use client';

/**
 * The shared "put a link and hit submit" form (PLAN.md, Joey 2026-08-14),
 * rendered at the bottom of both CommunitySection and MerchSection. POSTs to
 * `/api/submit-link` (owned by a parallel agent, PLAN.md step 2) with
 * `{ url, section, hp, token }`. Nothing a user submits ever renders on the
 * site — a human reviews every submission before it's added (issue #36's
 * no-go on user-generated content hosting liability) — so the success state
 * says that plainly rather than implying anything auto-publishes.
 *
 * `token` is a Cloudflare Turnstile response token — the widget only renders
 * (and only then is a token sent) when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is
 * set; otherwise this form behaves exactly as before Turnstile existed. The
 * site key is public by design (it identifies the widget, not a secret).
 * Server-side verification and its fail-open/fail-closed rule live in
 * lib/longlive/submit-link.ts's `verifyTurnstile`.
 */

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export interface SubmitLinkFormProps {
  section: 'community' | 'merch';
}

const SECTION_COPY: Record<SubmitLinkFormProps['section'], { heading: string; placeholder: string }> = {
  community: {
    heading: 'Know a community we should add?',
    placeholder: 'https://discord.gg/…',
  },
  merch: {
    heading: 'Found something we should add?',
    placeholder: 'https://…',
  },
};

function looksLikeUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function SubmitLinkForm({ section }: SubmitLinkFormProps) {
  const [url, setUrl] = useState('');
  const [hp, setHp] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const copy = SECTION_COPY[section];
  const inputId = `submit-link-${section}`;
  const statusId = `submit-link-${section}-status`;
  const trimmed = url.trim();
  const valid = looksLikeUrl(trimmed);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  // Renders the Turnstile widget only when a site key is configured — inert
  // otherwise, per lib/longlive/submit-link.ts's verifyTurnstile contract.
  // "Managed" mode (the widget type set via data-appearance below) usually
  // passes invisibly and only shows a checkbox when Cloudflare's risk signal
  // is ambiguous, which is the least-annoying option that still gates bots.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    function render() {
      if (cancelled || !turnstileRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: 'interaction-only',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    }

    if (window.turnstile) {
      render();
      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    if (!existing) {
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);
    return () => {
      cancelled = true;
      script.removeEventListener('load', render);
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || status === 'submitting') return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/submit-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, section, hp, token: turnstileToken }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setUrl('');
      } else {
        setStatus('error');
        setErrorMsg(data.error || "Couldn't submit that — please try again.");
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please try again.');
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-dashed border-[color:var(--era-line)] bg-[color:var(--era-surface)]/50 p-5">
      <h2 className="font-[family-name:var(--era-font)] text-lg font-semibold text-[color:var(--era-ink)]">
        {copy.heading}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--era-ink-soft)]">
        Drop a link and hit submit — a human reviews every submission before it appears; nothing you send goes live automatically.
      </p>

      <form onSubmit={submit} className="mt-4">
        <label htmlFor={inputId} className="sr-only">
          Link URL
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id={inputId}
            type="url"
            inputMode="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={copy.placeholder}
            aria-describedby={statusId}
            className="min-h-[44px] flex-1 rounded-lg border border-[color:var(--era-line)] bg-[color:var(--era-bg)] px-3 text-sm text-[color:var(--era-ink)] placeholder:text-[color:var(--era-ink-soft)]/70 focus:border-[color:var(--era-accent)] focus:outline-none"
          />
          {/* Honeypot — visually hidden via off-screen positioning, not
              display:none, which automated form-fillers can detect and skip
              (same field mechanics as FeedbackButton.tsx's honeypot; the
              hiding technique differs on purpose). Any fill-in flags the
              submission as a bot server-side. */}
          <input
            type="text"
            name="company"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          />
          <button
            type="submit"
            disabled={!valid || status === 'submitting'}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[color:var(--era-accent)] bg-transparent px-5 text-sm font-medium text-[color:var(--era-accent)] transition-colors hover:bg-[color:var(--era-accent)]/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {status === 'submitting' ? 'Sending…' : 'Submit'}
          </button>
        </div>

        {/* Turnstile spam gate — only mounted when a site key is configured
            (see the useEffect above); an unconfigured deployment renders
            nothing here and the form works exactly as before Turnstile. */}
        {TURNSTILE_SITE_KEY && <div ref={turnstileRef} className="mt-2.5" />}

        <div id={statusId} aria-live="polite" className="mt-2 min-h-[1.25rem] text-xs">
          {status === 'success' && (
            <span className="flex items-center gap-1.5 text-[color:var(--era-accent)]">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Thanks — sent for review. A human looks at every submission before it appears.
            </span>
          )}
          {status === 'error' && <span className="text-red-400">{errorMsg}</span>}
        </div>
      </form>
    </section>
  );
}
