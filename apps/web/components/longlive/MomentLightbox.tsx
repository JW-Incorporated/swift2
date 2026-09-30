'use client';

// Split out of MomentDetail.tsx (R20). Everything that shows one of the
// moment's photographs at full size: the inline article figure, the honest
// "not the real photo" labelling, and the full-screen zoomable viewer.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFocusTrap } from '@/lib/longlive/useFocusTrap';
import { isPointerOutsideContainedImage } from '@/lib/longlive/contain-fit';
import { ZoomableImage } from './ZoomableImage';
import { autoFocalPoint, focalPointOf, type ImageKind, type ImageRef } from '@swift2/experience';

// Anything that isn't the real photo of THIS moment gets an explicit label —
// a stand-in must never read as the real thing. 'primary' renders no badge.
const IMAGE_KIND_BADGE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference',
  archival: 'Archival',
};
export const IMAGE_KIND_NOTE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference — the real photo hasn’t surfaced yet.',
  archival: 'Archival.',
};

// Hotlinked gallery/hero urls bypass Next's image optimizer (whose
// remotePatterns allowlist covers only YouTube posters); local era art and
// curated assets keep the optimized path.
export const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

/** The little era-styled pill that marks a non-primary image. */
export function ImageKindBadge({ kind }: { kind: Exclude<ImageKind, 'primary'> }) {
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-[color:var(--era-ink-soft)]"
      style={{ borderColor: 'var(--era-line)', backgroundColor: 'var(--era-surface)' }}
    >
      {IMAGE_KIND_BADGE[kind]}
    </span>
  );
}

// One full-width photo woven into the article body, with its honest labeling
// (kind badge / reference note), caption, and credit. Same figure the old
// trailing gallery used, now placed inline between paragraphs (#XYZ v1).
export function MomentFigure({ img, onOpen }: { img: ImageRef; onOpen: () => void }) {
  return (
    <figure className="era-card overflow-hidden rounded-2xl border">
      {/* Tap to open the full-screen zoomable viewer (#525 follow-up); the
          inline crop respects the image's focal point. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="View photo full screen"
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden"
      >
        <Image
          src={img.url}
          alt={img.caption ?? ''}
          fill
          unoptimized={isRemoteUrl(img.url)}
          className="object-cover"
          style={{ objectPosition: focalPointOf(img) }}
          onLoad={autoFocalPoint(img)}
        />
      </button>
      <figcaption className="space-y-1.5 p-3">
        {img.kind !== 'primary' && (
          <div>
            <ImageKindBadge kind={img.kind} />
          </div>
        )}
        {img.kind === 'reference' && (
          <p className="text-xs italic leading-relaxed text-[color:var(--era-ink-soft)]">
            {IMAGE_KIND_NOTE.reference}
          </p>
        )}
        {img.caption && (
          <p className="text-sm leading-relaxed text-[color:var(--era-ink)]">{img.caption}</p>
        )}
        {img.credit && (
          <p className="text-xs text-[color:var(--era-ink-soft)]">Credit: {img.credit}</p>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * Full-screen photo viewer (#525 follow-up): the whole photo (object-contain),
 * pinch / double-tap zoom via ZoomableImage, and keyboard/arrow paging through
 * the moment's gallery. Owns Escape while open.
 */
export function MomentLightbox({
  images,
  index,
  onIndex,
  onClose,
  title,
}: {
  images: ImageRef[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  /** Falls into the lightbox image's alt text when a photo has no caption —
   *  in here the photo is the dialog's sole content, so it can't go nameless
   *  the way an inline card's cropped thumbnail can (#834). */
  title: string;
}) {
  const img = images[index];
  const count = images.length;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Always active while mounted — the parent only renders this component
  // between openLightbox() and onClose(), so mount/unmount already is the
  // open/close lifecycle (mirrors the Escape effect below).
  useFocusTrap(true, dialogRef);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((index + 1) % count);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose]);
  if (!img) return null;

  // PORTALED TO document.body ON PURPOSE. The viewer is `fixed inset-0`, which
  // should pin it to the viewport — but it renders inside the moment overlay,
  // and that overlay carries `.detail-enter`, whose animation ends on
  // `transform: scale(1)` with fill-mode `both`. A non-none transform makes an
  // ancestor the containing block for `position: fixed` descendants, so the
  // viewer was anchoring to the SCROLLING OVERLAY instead of the screen: open a
  // photo after scrolling down and it appeared far above the viewport (Wyatt,
  // 2026-07-20). Portaling escapes the transformed ancestor entirely, which
  // also makes this immune to any future ancestor gaining a transform/filter.
  const viewer = (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 detail-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      // Clicking anywhere that is not the picture closes, same as the X.
      //
      // Two earlier attempts at this both failed, for the same reason: they
      // asked "did the click land on the root?" via target === currentTarget.
      // It never does. The root is a flex COLUMN completely covered by its own
      // three children — the header strip, the image row and the caption strip
      // — so every click reports one of those as the target, and the viewer
      // stayed open everywhere except the one spot each fix happened to test
      // (Wyatt, 2026-07-20, twice: "clicking outside the picture doesn't close
      // it", then again after the letterbox-only fix).
      //
      // So invert it. Close on everything EXCEPT the picture itself and the
      // controls, rather than trying to enumerate the places that count as
      // outside. `contain`-fitted images need the geometric test because the
      // <img> also covers its own letterbox; see lib/longlive/contain-fit.ts.
      onClick={(e) => {
        const target = e.target as HTMLElement;
        // Buttons and links own their behaviour: X, arrows, zoom, credits.
        if (target.closest('button, a, [role="button"]')) return;
        if (target instanceof HTMLImageElement) {
          if (
            isPointerOutsideContainedImage(
              e.clientX,
              e.clientY,
              target.getBoundingClientRect(),
              target.naturalWidth,
              target.naturalHeight,
            )
          ) {
            onClose();
          }
          return;
        }
        onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <span className="text-xs text-white/60">{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="grid size-11 place-items-center rounded-full hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
      </div>
      {/* Clicks here bubble to the root, which decides picture vs not. */}
      <div className="relative min-h-0 flex-1">
        <ZoomableImage
          key={img.url}
          src={img.url}
          alt={img.caption ?? `Photo — ${title}`}
          unoptimized={isRemoteUrl(img.url)}
          fit="contain"
          frameClassName="h-full w-full"
          // Fullscreen has nothing behind it to scroll, so the plain wheel
          // zooms here; on-screen +/− buttons because the gestures alone were
          // undiscoverable with a mouse.
          wheelZoom
          controls
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + count) % count)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % count)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>
      {(img.caption || img.credit) && (
        <div className="shrink-0 px-6 py-3 text-center">
          {img.caption && <p className="text-sm leading-relaxed text-white/85">{img.caption}</p>}
          {img.credit && <p className="mt-0.5 text-xs text-white/50">Credit: {img.credit}</p>}
        </div>
      )}
    </div>
  );

  // Guard for SSR / the first client render, where document does not exist yet.
  if (typeof document === 'undefined') return null;
  return createPortal(viewer, document.body);
}
