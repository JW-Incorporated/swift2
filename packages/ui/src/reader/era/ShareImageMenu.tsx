'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageDown } from 'lucide-react';
import type { ShareTarget } from '@swift2/experience';
import { useHost } from '../../host/context';
import { useReader } from '../../snapshot/context';
import { prefetchShareCard, shareCardImage } from '../lib/share-payload';
import type { ShareCardSize, ShareCardSource } from '../lib/share-card-params';

const CHOICES: { size: ShareCardSize; label: string; hint: string }[] = [
  { size: 'story', label: 'Story', hint: 'Tall 9:16 for Instagram, TikTok, Reels' },
  { size: 'portrait', label: 'Post', hint: '4:5 portrait for feeds and chats' },
];

const PANEL_POSITION = {
  right: 'right-0 top-full mt-2',
  left: 'left-0 top-full mt-2',
  above: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
} as const;

type Phase = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; message: string };

const DONE_MESSAGES = {
  native: '',
  copied: 'Image copied — paste it into your post',
  cancelled: '',
  downloaded: 'Saved to your device. Post it anywhere.',
  unavailable: "Couldn't save the image on this device.",
  error: "Couldn't make the image. Try again in a moment.",
} as const;

/**
 * "Share as image" (W9): pick Story or Post, get a branded PNG of this moment
 * or era through the native share sheet (or a download). The caption link
 * points back at the same page, so the picture pulls people into the site.
 */
export function ShareImageMenu({
  target,
  source,
  variant = 'pill',
  label = 'Share as image',
  align = 'right',
}: {
  target: ShareTarget;
  source: ShareCardSource;
  variant?: 'pill' | 'icon';
  label?: string;
  /** Where the Story/Post panel opens — chosen per mount so it never clips or leaves the screen. */
  align?: keyof typeof PANEL_POSITION;
}) {
  const q = useReader();
  const host = useHost();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    // Capture + stopPropagation: Escape closes this menu only, not the sheet beneath it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const run = async (size: ShareCardSize) => {
    setPhase({ kind: 'busy' });
    const result = await shareCardImage(target, source, size, q, host);
    const message = DONE_MESSAGES[result];
    setPhase(message ? { kind: 'done', message } : { kind: 'idle' });
    if (!message) setOpen(false);
  };

  const toggle = () => {
    setPhase({ kind: 'idle' });
    if (!open) for (const c of CHOICES) void prefetchShareCard(source, c.size, host.resolveUrl);
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className={variant === 'icon' ? 'relative' : 'relative inline-block'}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={label}
          className="era-icon-btn rounded-full p-2 backdrop-blur-md"
        >
          <ImageDown className="h-5 w-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="true"
          aria-expanded={open}
          className="era-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
        >
          <ImageDown className="h-4 w-4" aria-hidden />
          {label}
        </button>
      )}
      {open && (
        <div
          role="group"
          aria-label={label}
          className={`absolute z-20 w-64 ${PANEL_POSITION[align]} rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-2 text-left shadow-2xl`}
        >
          {CHOICES.map((c) => (
            <button
              key={c.size}
              type="button"
              disabled={phase.kind === 'busy'}
              onClick={() => void run(c.size)}
              className="block w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-[color:var(--era-surface-2)] disabled:opacity-60"
            >
              <span className="block text-sm font-semibold text-[color:var(--era-ink)]">
                {c.label}
              </span>
              <span className="block text-xs text-[color:var(--era-ink-soft)]">{c.hint}</span>
            </button>
          ))}
          <p aria-live="polite" className="px-3 pb-1 pt-1 text-xs text-[color:var(--era-ink-soft)]">
            {phase.kind === 'busy'
              ? 'Making your image…'
              : phase.kind === 'done'
                ? phase.message
                : ''}
          </p>
        </div>
      )}
    </div>
  );
}
