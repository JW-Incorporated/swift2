'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, MessageCircleQuestion, X } from 'lucide-react';
import type { CurrentItem } from '@swift2/shared';
import type { Era } from '@/lib/longlive/types';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { formatFullDate } from '@/lib/longlive/format';
import { CURRENT_ITEM_STATUS_COPY, outletFor } from '@/lib/longlive/current-feed';
import { eraStyle } from '@/lib/longlive/theme';

/**
 * The current-era live item's detail overlay (PLAN.md Stage 5). A lighter
 * sibling of `MomentDetail.tsx`, reusing its dashed-rumor visual language
 * (border-2 border-dashed, era-accent, AlertTriangle banner — see that
 * file's `ConfidenceBanner`/`RumorSection`) rather than the component
 * itself: `MomentDetail.tsx` is 1000+ lines of `ContentItem`-specific
 * rendering (photo galleries, motif trails, track guides…) none of which a
 * `current_item` has, and forking it on a second, incompatible data shape
 * would be exactly the "touch Vault rendering" this stage's brief rules
 * out. Unlike `ConfidenceBanner` (hidden once a moment is confirmed), the
 * banner here is MANDATORY at every status — a current_item is provisional
 * by definition until it's promoted into the Vault.
 *
 * State is owned locally by `EraSection` (not the shared store `MomentDetail`
 * reads) — proportional to this stage's single-era, additive scope; nothing
 * here needs deep-linking or cross-overlay stacking.
 */
export function CurrentItemDetail({
  item,
  era,
  onClose,
}: {
  item: CurrentItem | null;
  era: Era;
  onClose: () => void;
}) {
  const [verifyState, setVerifyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  useScrollLock(item != null);
  useBackDismiss(item != null, onClose);

  // Escape dismisses this overlay (#525), matching every other .era-icon-btn
  // close affordance — this one was a keyboard-only holdout (mouse/back-swipe
  // already worked via the X and useBackDismiss above).
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;
  const status = CURRENT_ITEM_STATUS_COPY[item.status];
  const outlet = outletFor(item);

  async function verify() {
    if (!item || verifyState === 'sending') return;
    setVerifyState('sending');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: item.headline,
          summary: item.summary,
          itemId: item.id,
          eraId: item.eraId,
          status: item.status,
          sources: item.sources,
        }),
      });
      setVerifyState(res.ok ? 'sent' : 'error');
    } catch {
      setVerifyState('error');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.headline}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)]"
      style={eraStyle(era)}
    >
      <div className="relative mx-auto max-w-2xl px-5 pb-16 pt-16">
        <button
          onClick={onClose}
          className="era-icon-btn absolute right-4 top-4 rounded-full p-2 backdrop-blur-md"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-accent)]">
          Live{outlet ? ` · reported by ${outlet}` : ''}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-3xl font-semibold leading-tight">
          {item.headline}
        </h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
          {formatFullDate(item.observedOn)}
        </p>

        <div
          role="note"
          aria-label={status.label}
          className="mt-5 rounded-xl border-2 border-dashed p-4"
          style={{
            borderColor: 'var(--era-accent)',
            backgroundColor: 'color-mix(in srgb, var(--era-accent) 8%, var(--era-surface))',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {status.label}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{status.blurb}</p>
        </div>

        <p className="mt-6 text-[17px] leading-relaxed text-[color:var(--era-ink)]">{item.summary}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">{item.detail}</p>

        {item.sources.length > 0 && (
          <ul className="mt-6 space-y-1.5">
            {item.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[color:var(--era-ink-soft)] underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                >
                  {s.name} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={verify}
          disabled={verifyState === 'sending' || verifyState === 'sent'}
          className="era-btn-ghost mt-8 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          <MessageCircleQuestion className="h-4 w-4" />
          {verifyState === 'sent'
            ? 'Thanks — flagged for review'
            : verifyState === 'sending'
              ? 'Sending…'
              : verifyState === 'error'
                ? 'Couldn’t send — tap to retry'
                : 'Help us verify this'}
        </button>
      </div>
    </div>
  );
}
