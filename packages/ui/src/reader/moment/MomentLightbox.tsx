import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useResolveUrl } from '../../host/context';
import type { ImageRef } from '@swift2/experience';
import { useFocusTrap } from './lib/useFocusTrap';
import { useBackDismiss } from '../lib/useBackDismiss';
import { isPointerOutsideContainedImage } from './lib/contain-fit';
import { ZoomableImage } from './ZoomableImage';
import { isRemoteUrl } from './momentShared';

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
  const resolveUrl = useResolveUrl();
  const img = images[index];
  const count = images.length;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Always active while mounted — the parent only renders this component
  // between openLightbox() and onClose(), so mount/unmount already is the
  // open/close lifecycle (mirrors the Escape effect below).
  useFocusTrap(true, dialogRef);
  useBackDismiss(true, onClose);
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
          src={resolveUrl(img.url)}
          alt={img.caption ?? `Photo — ${title}`}
          unoptimized={isRemoteUrl(resolveUrl(img.url))}
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
