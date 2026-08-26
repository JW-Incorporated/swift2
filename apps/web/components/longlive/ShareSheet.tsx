'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { useFocusTrap } from '@/lib/longlive/useFocusTrap';
import Image from 'next/image';
import { X, Check, Copy, Share2 } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { CURRENT_ERA_ID, getEra } from '@/lib/longlive/eras';
import { getContentItem } from '@/lib/longlive/content';
import { getThread } from '@/lib/longlive/lenses';
import { resolveTrackKey } from '@/lib/longlive/tracks';
import {
  clownbotShareCopy,
  communityShareCopy,
  merchShareCopy,
  momentShareCopy,
  moodShareCopy,
  siteShareCopy,
  theoryGuideShareCopy,
  threadsGalleryShareCopy,
  trackGuideShareCopy,
  trackShareCopy,
  type ShareCopy,
} from '@/lib/longlive/share';
import { eraStyle } from '@/lib/longlive/theme';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { focalPointOf, primaryImageRef, type Era, type ImageRef } from '@/lib/longlive/types';

const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

export function ShareSheet() {
  const { share } = useAppState();
  const { closeShare } = useAppActions();
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useScrollLock(Boolean(share));
  useFocusTrap(Boolean(share), dialogRef);

  useEffect(() => {
    setCopied(false);
    if (!share) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShare();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [share, closeShare]);

  // Let the mobile back-swipe gesture close this sheet instead of leaving the
  // app (it stacks above the moment pill's own entry, so back closes the
  // sheet first, then the pill).
  useBackDismiss(Boolean(share), closeShare);

  if (!share) return null;

  // Resolve the card's era + copy from the share target.
  let era: Era;
  let kicker: string;
  let title: string;
  let subtitle: string;
  /** Rich moment share copy (T12); null falls back to `${title} — ${subtitle}`. */
  let richCopy: ShareCopy | null = null;
  /** Card imagery — the moment's primary photo for item shares, era art otherwise. */
  let cardImage: ImageRef | undefined;

  if (share.kind === 'item') {
    const item = getContentItem(share.itemId);
    era = getEra(item?.eraId ?? 'ttpd');
    kicker = `${era.name} · ${item?.dateLabel ?? ''}`;
    title = item?.title ?? '';
    subtitle = item?.summary ?? '';
    if (item) {
      richCopy = momentShareCopy(item, era);
      cardImage = primaryImageRef(item);
    }
  } else if (share.kind === 'era') {
    era = getEra(share.eraId);
    kicker = era.yearLabel;
    title = era.name;
    subtitle = era.tagline;
  } else if (share.kind === 'lens') {
    const thread = getThread(share.lensId);
    era = getEra('ttpd');
    kicker = thread.kicker;
    title = thread.title;
    subtitle = thread.what;
  } else if (share.kind === 'track') {
    era = getEra(share.eraId);
    const track = resolveTrackKey(share.trackKey)?.track;
    kicker = `${era.album}${track?.trackNumber ? ` · Track ${track.trackNumber}` : ''}`;
    title = track?.title ?? era.album;
    subtitle = track?.note ?? '';
    if (track) richCopy = trackShareCopy(track, era);
  } else if (share.kind === 'trackGuide') {
    era = getEra(share.eraId);
    kicker = `Track guide · ${era.yearLabel}`;
    title = era.album;
    subtitle = 'Every song, each with a sourced note.';
    richCopy = trackGuideShareCopy(era);
  } else if (share.kind === 'theoryGuide') {
    era = getEra(share.eraId);
    kicker = `Theories & eggs · ${era.yearLabel}`;
    title = `${era.shortName} decoded`;
    subtitle = 'Every egg and theory, sourced and graded.';
    richCopy = theoryGuideShareCopy(era);
  } else if (share.kind === 'site') {
    era = getEra(CURRENT_ERA_ID);
    kicker = 'The Taylor Swift time machine';
    title = 'Long Live';
    subtitle = 'Real-time updates on her whole life, or step back into any era.';
    richCopy = siteShareCopy();
  } else if (share.kind === 'threads') {
    era = getEra(CURRENT_ERA_ID);
    kicker = 'The Threads';
    title = 'The stories between the eras';
    subtitle = 'Eras move forward in time. Threads cut sideways through every chapter.';
    richCopy = threadsGalleryShareCopy();
  } else if (share.kind === 'mood') {
    era = getEra(CURRENT_ERA_ID);
    kicker = 'Long Live';
    title = 'Mood';
    subtitle = "Tell it how you're feeling, get back the songs that fit.";
    richCopy = moodShareCopy();
  } else if (share.kind === 'clownbot') {
    era = getEra(CURRENT_ERA_ID);
    kicker = 'Long Live';
    title = 'Clownbot';
    subtitle = 'An unhinged, permanently-online superfan you can chat with.';
    richCopy = clownbotShareCopy();
  } else if (share.kind === 'community') {
    era = getEra(CURRENT_ERA_ID);
    kicker = 'Long Live';
    title = 'Fan communities';
    subtitle = 'Where Swifties gather, grouped by platform and curated by hand.';
    richCopy = communityShareCopy();
  } else if (share.kind === 'merch') {
    era = getEra(CURRENT_ERA_ID);
    kicker = 'Long Live';
    title = 'Merch';
    subtitle = 'Shop the look from real moments, plus the official store and fan-made finds.';
    richCopy = merchShareCopy();
  } else {
    era = getEra('ttpd');
    kicker = 'Lens';
    title = 'Long Live';
    subtitle = 'A journey through every era.';
  }

  // Point the shared link at the actual target (deep link via ?item=/?lens=/
  // ?era=, read on mount by AppProvider) rather than just the current page.
  const shareUrl = (() => {
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://longlive.app';
    if (share.kind === 'item') return `${base}?item=${encodeURIComponent(share.itemId)}`;
    if (share.kind === 'lens') return `${base}?lens=${encodeURIComponent(share.lensId)}`;
    if (share.kind === 'era') return `${base}?era=${encodeURIComponent(share.eraId)}`;
    if (share.kind === 'track') return `${base}?song=${encodeURIComponent(share.trackKey)}`;
    if (share.kind === 'trackGuide') return `${base}?guide=${encodeURIComponent(share.eraId)}`;
    if (share.kind === 'theoryGuide') return `${base}?theories=${encodeURIComponent(share.eraId)}`;
    // #2105 — Threads gallery / Mood / Clownbot / Community / Merch: the
    // surface as a destination, empty and ready. Never any user input (see
    // share.ts).
    if (share.kind === 'threads') return `${base}?mode=threads`;
    if (share.kind === 'mood') return `${base}?mode=mood`;
    if (share.kind === 'clownbot') return `${base}?mode=clownbot`;
    if (share.kind === 'community') return `${base}?mode=community`;
    if (share.kind === 'merch') return `${base}?mode=merch`;
    // share.kind === 'site' — the bare front door, no params.
    return base;
  })();

  async function onShare() {
    // Moment shares carry the rich copy (title + era + date + summary);
    // era/lens shares keep the existing thin form.
    const copy = richCopy ?? { title, text: `${title} — ${subtitle}` };
    if (navigator.share) {
      try {
        await navigator.share({ title: copy.title, text: copy.text, url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await navigator.clipboard.writeText(`${copy.text} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm detail-enter"
      onClick={closeShare}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        style={eraStyle(era)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
      >
        <div className="mb-3 flex items-center justify-between">
          <span id="share-sheet-title" className="text-sm font-medium text-white/80">
            Share card
          </span>
          <button
            onClick={closeShare}
            className="era-icon-btn rounded-full p-1.5"
            aria-label="Close share"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The shareable card preview */}
        <div className="overflow-hidden rounded-3xl border border-[color:var(--era-line)] bg-[color:var(--era-bg)] shadow-2xl">
          <div className="relative aspect-[4/5]">
            <Image
              src={cardImage?.url || era.image || '/placeholder.svg'}
              alt=""
              fill
              unoptimized={isRemoteUrl(cardImage?.url || era.image || '')}
              className="object-cover opacity-60"
              style={{ objectPosition: focalPointOf(cardImage) }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, var(--era-bg) 8%, color-mix(in srgb, var(--era-bg) 30%, transparent))',
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--era-ink-soft)]">
                {kicker}
              </span>
              <h3 className="mt-2 font-era text-3xl font-semibold leading-tight text-[color:var(--era-ink)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                {subtitle}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="h-1 w-8 rounded-full"
                  style={{ backgroundColor: 'var(--era-accent)' }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                  Long Live
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--era-accent)] px-4 py-3 text-sm font-semibold text-[color:var(--era-bg)] transition hover:opacity-90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="era-btn-ghost flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium"
            aria-label="Copy link"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
