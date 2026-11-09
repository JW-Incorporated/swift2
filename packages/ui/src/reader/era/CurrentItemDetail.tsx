'use client';

import { useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ExternalLink, House, MessageCircleQuestion, X } from 'lucide-react';
import type { CurrentItem } from '@swift2/shared';
import { outletLabel, dedupeSourcesByOutlet } from '@swift2/shared';
import type { Era } from '@swift2/experience';
import { useScrollLock } from '../lib/useScrollLock';
import { useBackDismiss } from '../lib/useBackDismiss';
import { useFocusTrap } from '../moment/lib/useFocusTrap';
import { formatFullDate } from '@swift2/experience';
import { CURRENT_ITEM_STATUS_COPY, outletFor } from '@swift2/experience';
import { eraStyle } from '../lib/theme';
import { useAppActions } from '../store';
import { useHost } from '../../host/context';

/** Same remote-vs-local-asset check every other card's `<Image>` call uses.
 * `item.imageUrl` is always a hotlinked `https://` publisher URL, so this
 * only ever picks the `unoptimized` branch. */
function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * The writer emits `detail` as 2-4 paragraphs separated by blank lines
 * (`apps/worker/src/extract/writer-prompt.ts`). A single `<p>` collapses
 * those newlines into one wall of text, so split them here; a body with no
 * breaks still renders as one paragraph.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * The current-era live item's detail overlay (PLAN.md Stage 5). A lighter
 * sibling of `MomentDetail.tsx`: it borrows the era-accent dashed language
 * for the status chip only, never the component — `MomentDetail.tsx` is
 * 1000+ lines of `ContentItem`-specific rendering (photo galleries, motif
 * trails, track guides…) none of which a `current_item` has.
 *
 * Reads top to bottom like an article (owner 2026-11-09): eyebrow with the
 * outlet and a compact status chip, headline, date, image, the lead as a
 * dek, the body as real paragraphs, then a quiet "about this story" footer
 * carrying the status explanation, the sources and the verify button. The
 * status stays MANDATORY at every status — a current_item is provisional by
 * definition until it's promoted into the Vault — but it is a chip plus a
 * footer line now, not a box that pushes the story below the fold.
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
  const { goHome } = useAppActions();
  const { apiFetch, Image } = useHost();
  const [verifyState, setVerifyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [imageFailed, setImageFailed] = useState(false);
  useScrollLock(item != null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useBackDismiss(item != null, onClose);
  useFocusTrap(item != null, dialogRef);

  if (!item) return null;
  const status = CURRENT_ITEM_STATUS_COPY[item.status];
  const outlet = outletFor(item);
  const showImage = Boolean(item.imageUrl) && !imageFailed;
  const paragraphs = splitParagraphs(item.detail);

  async function verify() {
    if (!item || verifyState === 'sending') return;
    setVerifyState('sending');
    try {
      const res = await apiFetch({
        path: '/api/intake',
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
      setVerifyState(res.status >= 200 && res.status < 300 ? 'sent' : 'error');
    } catch {
      setVerifyState('error');
    }
  }

  function handleHome() {
    onClose();
    goHome();
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={item.headline}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)]"
      style={eraStyle(era)}
    >
      <div className="relative mx-auto max-w-2xl px-5 pb-16 pt-16">
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={handleHome}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-label="Go to home"
          >
            <House className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pr-24">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-accent)]">
            Live{outlet ? ` · reported by ${outlet}` : ''}
          </span>
          <span
            role="note"
            aria-label={status.label}
            title={status.blurb}
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-accent)]"
            style={{
              borderColor: 'var(--era-accent)',
              backgroundColor: 'color-mix(in srgb, var(--era-accent) 10%, transparent)',
            }}
          >
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            {status.label}
          </span>
        </div>
        <h1 className="mt-3 font-[family-name:var(--era-font)] text-3xl font-semibold leading-tight">
          {item.headline}
        </h1>
        <p className="mt-1.5 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
          {formatFullDate(item.observedOn)}
        </p>

        {showImage && (
          <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={item.imageUrl!}
              alt={item.headline}
              fill
              unoptimized={isRemoteUrl(item.imageUrl!)}
              loading="lazy"
              sizes="(min-width: 768px) 100vw, 100vw"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          </div>
        )}

        <p
          className="mt-6 border-l-2 pl-4 text-[17px] font-medium leading-relaxed text-[color:var(--era-ink)]"
          style={{ borderColor: 'var(--era-accent)' }}
        >
          {item.summary}
        </p>

        <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-[color:var(--era-ink)]">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <aside
          aria-label="About this story"
          className="era-card-2 mt-8 space-y-3 px-4 py-3.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]"
        >
          <p>
            <span className="font-semibold text-[color:var(--era-accent)]">{status.label}.</span>{' '}
            {status.blurb}
          </p>
          {item.sources.length > 0 && (
            <p>
              <span className="font-semibold uppercase tracking-widest">Sources:</span>
              {(() => {
                const deduped = dedupeSourcesByOutlet(item.sources);
                const nodes: ReactNode[] = [];
                deduped.forEach((s, i) => {
                  if (i > 0) nodes.push(<span key={`sep-${i}`}> · </span>);
                  nodes.push(
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                    >
                      {outletLabel(s)}
                      <ExternalLink className="ml-0.5 inline h-3 w-3 align-[-1px]" />
                    </a>,
                  );
                });
                return nodes;
              })()}
            </p>
          )}
          <button
            type="button"
            onClick={verify}
            disabled={verifyState === 'sending' || verifyState === 'sent'}
            className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium disabled:opacity-60"
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
        </aside>
      </div>
    </div>
  );
}
