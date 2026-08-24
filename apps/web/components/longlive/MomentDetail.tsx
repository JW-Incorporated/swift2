'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X,
  Sparkles,
  Share2,
  ArrowRight,
  Route,
  Heart,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MessageCircleQuestion,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  useAppState,
  useAppActions,
  useProgress,
  useProgressActions,
} from '@/lib/longlive/store';
import { isPointerOutsideContainedImage } from '@/lib/longlive/contain-fit';
import { getContentItem } from '@/lib/longlive/content';
import { getEra } from '@/lib/longlive/eras';
import { getThread } from '@/lib/longlive/lenses';
import {
  resolveMotifTrail,
  resolveRelatedMoments,
  type MotifTarget,
  type RelatedMoment,
} from '@/lib/longlive/related';
import { TAG_META } from '@/lib/longlive/tags';
import { eraStyle } from '@/lib/longlive/theme';
import { MomentVideo } from './MomentVideo';
import { MomentSocialPost } from './MomentSocialPost';
import {
  detailVideoFor,
  footnoteVideoSources,
  heroVideoFor,
  imageDuplicatesPageVideo,
} from '@/lib/longlive/video-affordance';
import { ZoomableImage } from './ZoomableImage';
import { SignificanceBadge } from './SignificanceBadge';
import {
  isSubConfirmed,
  focalPointOf,
  primaryImageRef,
  type Confidence,
  type ImageKind,
  type ImageRef,
  type LensId,
  type Product,
  type RumorNote,
  type RumorStatus,
  type SubConfirmed,
} from '@/lib/longlive/types';
import { buildShopUrl, isAffiliate, SHOP_DISCLOSURE } from '@/lib/longlive/shop';
import { formatFullDate } from '@/lib/longlive/format';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

// A moment at/above CONFIRMED_TIER (types.ts) is established fact — no
// qualifier. Below it, the claim gets the UNMISSABLE banner below (not a
// subtle pill — replaced 2026-07-19): a bold label plus the reporting outlet
// and a one-line explainer, so a rumor can never visually pass as fact.
// Keyed by SubConfirmed (derived in types.ts from the same tuple as
// CONFIRMED_TIER), so moving a value across the tier is a compile error
// here, not a runtime undefined.
const CONFIDENCE_BANNER: Record<SubConfirmed, { label: string; blurb: string }> = {
  reputable_reporting: {
    label: 'Reported — not confirmed',
    blurb: 'Press reporting. Not confirmed by Taylor, her team, or an official source.',
  },
  strong_fan_consensus: {
    label: 'Rumor — unconfirmed',
    blurb: 'Widely believed by fans, but never confirmed.',
  },
  plausible: {
    label: 'Rumor — unconfirmed',
    blurb: 'A plausible but unconfirmed claim.',
  },
  clowning: {
    label: 'Rumor — unconfirmed',
    blurb: 'Fans are joking-but-hoping. Nothing here is confirmed.',
  },
  disproven: {
    label: 'Debunked',
    blurb: 'This claim has been disproven.',
  },
  joke_meme: {
    label: 'Joke / meme — not a real claim',
    blurb: 'Circulating as a joke, not as fact.',
  },
};

// Per-rumor status badges for the "What's rumored" section. 'unconfirmed' is
// the loud default; a resolved rumor keeps its entry with an honest badge.
const RUMOR_STATUS_BADGE: Record<RumorStatus, string> = {
  unconfirmed: 'Rumor — unconfirmed',
  partially_confirmed: 'Partially confirmed',
  confirmed: 'Since confirmed',
  debunked: 'Debunked',
  // A claim that was reported, never confirmed, never denied, and went quiet.
  // Saying that plainly is the honest end-state; leaving it "unconfirmed"
  // forever implies it is still live (docs/content-ops/rumor-pipeline.md).
  faded: 'Never confirmed or denied',
};

// Anything that isn't the real photo of THIS moment gets an explicit label —
// a stand-in must never read as the real thing. 'primary' renders no badge.
const IMAGE_KIND_BADGE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference',
  archival: 'Archival',
};
const IMAGE_KIND_NOTE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference — the real photo hasn’t surfaced yet.',
  archival: 'Archival.',
};

// Hotlinked gallery/hero urls bypass Next's image optimizer (whose
// remotePatterns allowlist covers only YouTube posters); local era art and
// curated assets keep the optimized path.
const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

/**
 * The unmissable sub-confirmed banner: a full-width, bordered strip directly
 * under the title. Deliberately NOT the quiet pill treatment confirmed
 * moments get — a rumored moment must read as rumored at a glance, on the
 * era's own tokens (no hard-coded colors, per docs/longlive-experience.md §6).
 */
function ConfidenceBanner({ confidence, outlet }: { confidence: Confidence; outlet?: string }) {
  if (!isSubConfirmed(confidence)) return null;
  const banner = CONFIDENCE_BANNER[confidence];
  return (
    <div
      role="note"
      aria-label={`${banner.label}${outlet ? `, per ${outlet}` : ''}`}
      className="mt-5 rounded-xl border-2 border-dashed p-4"
      style={{
        borderColor: 'var(--era-accent)',
        backgroundColor: 'color-mix(in srgb, var(--era-accent) 8%, var(--era-surface))',
      }}
    >
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {banner.label}
        {outlet && (
          <span className="normal-case tracking-normal text-[color:var(--era-ink-soft)]">
            · per {outlet}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        {banner.blurb}
      </p>
    </div>
  );
}

/**
 * The "What's rumored" section — attributed, dated, reported-but-unconfirmed
 * claims, structurally and visually separate from the confirmed narrative
 * above it (dashed borders + its own labeled header + a standing disclaimer;
 * the pill language mirrors the dossier meaning tiers, where dashed = not
 * confirmed). Rumors must never blend into confirmed facts.
 */
function RumorSection({ rumors }: { rumors: RumorNote[] }) {
  return (
    <section
      aria-label="What's rumored — unconfirmed reports"
      className="mt-10 rounded-2xl border-2 border-dashed p-5"
      style={{ borderColor: 'var(--era-accent)' }}
    >
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
        <MessageCircleQuestion className="h-4 w-4 shrink-0" />
        What&apos;s rumored
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        Reported claims that have <strong>not</strong> been confirmed by Taylor, her team, or an
        official source — each one attributed to who reported it, and dated. Treat everything below
        as a rumor unless its badge says otherwise.
      </p>
      <ol className="mt-4 space-y-3">
        {rumors.map((r, i) => (
          <li
            // Two rumors can legitimately share a url (one roundup piece
            // reporting several claims), so the key needs the index.
            key={`${r.url}-${i}`}
            className="rounded-xl border border-dashed p-4"
            style={{
              borderColor: 'var(--era-line)',
              backgroundColor: 'var(--era-surface)',
              // A debunked rumor stays on record but visibly recedes.
              opacity: r.status === 'debunked' ? 0.75 : undefined,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={
                  r.status === 'unconfirmed'
                    ? {
                        border: '1px dashed var(--era-accent)',
                        color: 'var(--era-accent)',
                      }
                    : {
                        border: '1px solid var(--era-line)',
                        color: 'var(--era-ink-soft)',
                      }
                }
              >
                {RUMOR_STATUS_BADGE[r.status]}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[color:var(--era-ink-soft)] underline underline-offset-2 hover:text-[color:var(--era-ink)]"
              >
                Reported by {r.reportedBy} · {formatFullDate(r.reportedOn)}
              </a>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
              {r.claim}
            </p>
            {r.note && (
              <p className="mt-1.5 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
                {r.note}
              </p>
            )}
            {/* The citation that settled it. A claim marked "Since confirmed"
                or "Debunked" with nothing to click is just our word for it —
                the whole point of the resolution field is that the reader can
                check. */}
            {r.resolution && (
              <p className="mt-1.5 text-xs text-[color:var(--era-ink-soft)]">
                {r.status === 'debunked' ? 'Debunked by' : 'Confirmed by'}{' '}
                <a
                  href={r.resolution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                >
                  {r.resolution.outlet}
                </a>
                {' · '}
                {formatFullDate(r.resolution.on)}
                {r.resolution.note ? ` — ${r.resolution.note}` : ''}
              </p>
            )}
            {/* Audit transparency: "still unconfirmed" and "nobody has looked
                since June" render identically without this, and they are very
                different claims about how much to trust the label. */}
            {!r.resolution && r.lastCheckedOn && (
              <p className="mt-1.5 text-xs text-[color:var(--era-ink-soft)]">
                Last checked {formatFullDate(r.lastCheckedOn)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The little era-styled pill that marks a non-primary image. */
function ImageKindBadge({ kind }: { kind: Exclude<ImageKind, 'primary'> }) {
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
function MomentFigure({ img, onOpen }: { img: ImageRef; onOpen: () => void }) {
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
function MomentLightbox({
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

export function MomentDetail() {
  const { openItemId, share } = useAppState();
  const { closeItem, openShare, openItem } = useAppActions();
  const { progress } = useProgress();
  const { markMomentVisited, toggleFavorite } = useProgressActions();
  const [revealed, setRevealed] = useState(false);
  // Index into item.images for the full-screen photo viewer, or null when closed.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const item = openItemId ? getContentItem(openItemId) : undefined;

  // Any time the moment changes, make sure the viewer is closed.
  useEffect(() => setLightboxIndex(null), [openItemId]);

  // Reset the overlay's scroll whenever a different moment opens.
  //
  // Found by browser-testing the "Keep reading" rail (2026-07-20): tapping a
  // cross-link opened the right article but dropped the reader deep in its
  // middle, because the previous article's scroll position carried over. The
  // three call sites that try to handle this all call
  // `window.scrollTo({ top: 0 })` — but this overlay is `fixed inset-0
  // overflow-y-auto`, i.e. its OWN scroll container, so scrolling the window
  // does nothing to it.
  //
  // Fixing it here rather than in each onClick means every path into a moment
  // is covered — the rail, the thread pivots, and anything added later.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (openItemId) scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [openItemId]);

  // Opening a moment records it as visited (drives the era grid's seen dots
  // and the returning-user counts). Keyed on the resolved item so bad deep
  // links never record ghosts; marking is idempotent, so StrictMode's double
  // effect run is harmless.
  useEffect(() => {
    if (item) markMomentVisited(item.id);
  }, [item, markMomentVisited]);

  // Reset the clue reveal whenever a new item opens; lock body scroll.
  // Only if the id actually resolves — a stale/bad ?item= deep link
  // shouldn't lock scrolling on a modal that never renders.
  useScrollLock(item != null);

  useEffect(() => {
    setRevealed(false);
  }, [item]);

  // Close on Escape — but not while the share sheet is open on top of us;
  // that overlay owns Escape until it closes itself.
  useEffect(() => {
    if (!openItemId) return;
    const onKey = (e: KeyboardEvent) => {
      // While the full-screen viewer is open it owns Escape (closes itself).
      if (e.key === 'Escape' && !share && lightboxIndex === null) closeItem();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItemId, closeItem, share, lightboxIndex]);

  // Let the mobile back-swipe gesture close this pill instead of leaving the app.
  useBackDismiss(Boolean(item), closeItem);

  if (!item) return null;
  const era = getEra(item.eraId);
  const isFavorite = progress.favorites.has(item.id);
  // Clue Web trail this moment cross-links to (via relatedIds), if any.
  // Resolution is best-effort: no resolvable target simply means no link.
  const trail = resolveMotifTrail(item.relatedIds);
  // Moment -> moment cross-links, resolved separately: resolveMotifTrail
  // handles only motif:/egg: and returns null for `moment:` ids.
  const related = resolveRelatedMoments(item.relatedIds, item.id);
  // Hero = the primary image (else the first one); the rest form the gallery.
  // When even the hero is a stand-in (no primary exists) it gets the same
  // honest labeling the gallery uses.
  // The "What's confirmed" header and the RumorSection must appear/disappear
  // together — one flag guards both.
  const hasRumors = (item.rumors?.length ?? 0) > 0;
  // The video that belongs ABOVE the article, and the citations that still
  // embed in the footnote below it — see lib/longlive/video-affordance.ts.
  const detailVideo = detailVideoFor(item);
  const sourceVideos = footnoteVideoSources(item);
  // When the hero image is only a still of this moment's own footage, the hero
  // slot plays the footage instead (Joey, 2026-08-13: "the site would feel much
  // more natural if you played the video from the top"). `detailVideoFor`
  // already yielded the body slot in that case, so the page carries one player,
  // at the top, and no duplicate thumbnail below it.
  const heroVideo = heroVideoFor(item);
  // The image the hero WOULD show. Still resolved when the video won the slot,
  // because it is also the image the gallery must exclude — the promoted frame
  // must not reappear woven through the body.
  const heroImage: ImageRef | undefined = primaryImageRef(item);
  const hero: ImageRef | undefined = heroVideo ? undefined : heroImage;
  const heroUrl = hero?.url ?? '/placeholder.svg';
  // Everything the body may weave in: not the hero's own image, and not a still
  // of footage this page plays. Identity alone is not enough — "'Elizabeth
  // Taylor' goes to radio" carries maxres3 (promoted to the hero) AND maxres2,
  // two frames of the one video, so the second came back into the body under a
  // player of the very footage it is a frame of. Same id, different file, which
  // is the spread that made this repo match on the id in the path.
  const gallery = item.images.filter(
    (img) => img !== heroImage && !imageDuplicatesPageVideo(item, img.url),
  );
  // The photo viewer holds exactly the photographs the page shows, in the order
  // it shows them — never `item.images`, which still contains the frames dropped
  // above. Otherwise swiping out of a gallery photo lands on the still this
  // change exists to remove.
  const lightboxImages = hero ? [hero, ...gallery] : gallery;

  // Weave the non-hero photos through the body paragraphs (#XYZ v1) instead of
  // a trailing "Gallery" block: each image lands after a paragraph, spread
  // evenly. With more images than paragraphs, later slots carry more than one.
  const inlineSlots: ImageRef[][] = item.body.map(() => []);
  gallery.forEach((img, k) => {
    const target = Math.min(
      item.body.length,
      Math.max(1, Math.round(((k + 1) * item.body.length) / (gallery.length + 1))),
    );
    inlineSlots[target - 1]?.push(img);
  });

  // Names the sheet for assistive tech; see the dialog root below.
  const detailTitleId = `moment-detail-title-${item.id}`;

  // Open the full-screen photo viewer at a given image (matched by identity).
  const openLightbox = (img: ImageRef) =>
    setLightboxIndex(Math.max(0, lightboxImages.indexOf(img)));

  // Favorite / share / close, pinned to the sheet's top-right corner. Shared by
  // both hero branches so the three controls a reader needs to get back out of
  // the sheet sit in exactly one place in the source, and cannot end up in one
  // branch only. Over a video hero they clear the player: the slot's pt-16
  // reserves their row above it on a phone, and on desktop the player is capped
  // at 42vh*16/9 and centered, so they land in the gutter beside it.
  const heroControls = (
    <div className="absolute right-4 top-4 z-10 flex gap-2">
      <button
        onClick={() => toggleFavorite(item.id)}
        className="era-icon-btn rounded-full p-2 backdrop-blur-md"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
      >
        {/* currentColor, not accent: on the inverted .era-icon-btn (#525)
            the accent can vanish against the ink background (TTPD:
            #e8e8e8 on #ededed). Filled-vs-outline carries the state. */}
        <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={() => openShare({ kind: 'item', itemId: item.id })}
        className="era-icon-btn rounded-full p-2 backdrop-blur-md"
        aria-label="Share this moment"
      >
        <Share2 className="h-5 w-5" />
      </button>
      <button
        onClick={closeItem}
        className="era-icon-btn rounded-full p-2 backdrop-blur-md"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    // A MODAL, and now labelled as one. This sheet covers the viewport, locks
    // background scroll, traps Escape and offers a Close button — but it
    // carried no role at all, so assistive tech announced an anonymous div and
    // never told the reader a dialog had opened or what it was about. Only the
    // photo viewer nested inside it was ever a real dialog.
    //
    // Found via the E2E synthetic monitor, which had been looking for
    // `getByRole('dialog')` since it was written. That expectation was correct
    // and the app never satisfied it; the run was red for a real reason.
    //
    // Labelled BY the h1 rather than with a duplicate aria-label string, so the
    // accessible name can never drift from the visible title.
    <div
      ref={scrollRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={detailTitleId}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
    >
      {/* THE HERO SLOT — a photo, or the moment's own footage.

          The video branch (#2081, Joey: "it looks horrible… the site would feel
          much more natural if you played the video from the top") is taken only
          when the hero image would have been a still of that same video —
          `heroVideoFor`. On those pages the photo was never a photo: Photo
          Enrichment sourced a frame because the moment IS the video, so the
          reader met the footage as a static picture and then again as a player a
          screen below. Here the top of the page simply plays.

          Sizing: the photo hero is a fixed 42vh band, which a 16:9 player cannot
          honour at both ends — full-bleed 16:9 is 219px tall at 390px and 850px
          tall on a desktop. So the player is aspect-driven and CAPPED at the
          same 42vh by bounding its width at 42vh*16/9: on a phone it fills the
          column, on desktop it lands at exactly 42vh tall and centers, keeping
          the page's vertical rhythm identical to a photo page.

          Click-to-load is unchanged (#1935): `MomentVideo` renders `VideoPoster`
          — a plain <img> plus one labelled 44px+ button — and mounts the
          youtube-nocookie iframe only on a real click. A video hero PLAYS; it
          never opens the lightbox, which is for photographs. */}
      {heroVideo ? (
        <div className="relative w-full px-4 pb-2 pt-16">
          <div className="mx-auto w-full max-w-[calc(42vh*16/9)]">
            {/* `priority`: a `?item=` share link opens this sheet as the first
                paint, which makes this poster the page's LCP element — the same
                reason the photo hero below carries it. */}
            <MomentVideo video={heroVideo} className="" priority />
          </div>
          {heroControls}
        </div>
      ) : (
        <div className="relative h-[42vh] min-h-64 w-full">
          <Image
            src={heroUrl}
            alt={hero?.caption ?? ''}
            fill
            priority
            unoptimized={isRemoteUrl(heroUrl)}
            className="object-cover"
            style={{ objectPosition: focalPointOf(hero) }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 20%, transparent), var(--era-bg))',
            }}
          />
          {/* Tap the hero to open the full-screen viewer; the overlaid controls
              below sit later in the DOM, so they stay clickable on top. */}
          {hero && (
            <button
              type="button"
              onClick={() => openLightbox(hero)}
              aria-label="View photo full screen"
              className="absolute inset-0 cursor-zoom-in"
            />
          )}
          {/* A hero that isn't the real photo says so, right on the image.
              bottom-14 keeps it clear of the article, which overlaps the hero's
              bottom 2.5rem via -mt-10. */}
          {hero && hero.kind !== 'primary' && (
            <div className="absolute bottom-14 left-4 z-10 flex flex-wrap items-center gap-2">
              <ImageKindBadge kind={hero.kind} />
              <span className="text-xs text-[color:var(--era-ink-soft)]">
                {IMAGE_KIND_NOTE[hero.kind]}
                {hero.credit ? ` Credit: ${hero.credit}.` : ''}
              </span>
            </div>
          )}
          {heroControls}
        </div>
      )}

      {/* The article overlaps a PHOTO hero's bottom 2.5rem, which is where that
          hero's gradient has already faded to --era-bg. Over a player the same
          pull would crop the video and sit on top of its controls, so a video
          hero gets ordinary flow spacing instead. */}
      <article
        className={`relative z-10 mx-auto max-w-2xl px-5 pb-24 ${heroVideo ? 'mt-4' : '-mt-10'}`}
      >
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          {era.name} · {item.dateLabel}
        </span>
        {item.significance && (
          <div className="mt-2">
            <SignificanceBadge significance={item.significance} size="detail" />
          </div>
        )}
        <h1
          id={detailTitleId}
          className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl"
        >
          {item.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                // 10% (down from 16%) — see tags.ts (#659).
                backgroundColor: `hsl(${TAG_META[t].hue} / 0.1)`,
                color: `hsl(${TAG_META[t].hue})`,
              }}
            >
              {TAG_META[t].label}
            </span>
          ))}
        </div>

        {/* Sub-confirmed confidence is a full banner (2026-07-19), replacing
            the old quiet pill — see CONFIDENCE_BANNER. Confirmed moments
            (no confidence / confirmed tier) render exactly as before. */}
        {item.confidence && (
          <ConfidenceBanner confidence={item.confidence} outlet={item.sources?.[0]?.name} />
        )}

        {/* The footage, ABOVE the article (#2051, Joey 2026-08-13: "when a user
            clicks into the content they have to scroll all the way to the
            bottom to get the video"). It used to render after the entire body
            loop — every paragraph and every inline photo.

            It sits BELOW the confidence banner deliberately and that order is
            not negotiable: a reader must meet "Rumor — unconfirmed" before the
            media, never after. */}
        {detailVideo && (
          <MomentVideo video={detailVideo.video} caption={detailVideo.caption} />
        )}

        {/* With a rumor section below, the narrative gets an explicit
            "What's confirmed" header so the split is unmistakable. Without
            rumors the layout is unchanged. */}
        {hasRumors && (
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
            What&apos;s confirmed
          </h2>
        )}

        <div className="mt-7 space-y-6 text-lg leading-relaxed text-[color:var(--era-ink)]">
          {item.body.map((para, i) => (
            <Fragment key={i}>
              <p className="text-pretty">{para}</p>
              {inlineSlots[i].map((img, j) => (
                <MomentFigure key={`${img.url}-${j}`} img={img} onOpen={() => openLightbox(img)} />
              ))}
            </Fragment>
          ))}
          {/* No paragraphs to weave into — show the photos on their own. */}
          {item.body.length === 0 &&
            gallery.map((img, j) => (
              <MomentFigure key={`${img.url}-${j}`} img={img} onOpen={() => openLightbox(img)} />
            ))}
        </div>

        {/* The post the moment is about. Sits directly under the body, above
            rumors, because for a post-driven moment this IS the primary
            source — the reader should meet it before the commentary. */}
        {item.socialPost && <MomentSocialPost post={item.socialPost} />}

        {hasRumors && item.rumors && <RumorSection rumors={item.rumors} />}

        <ShopTheLook products={item.products} />

        {item.sources && item.sources.length > 0 && (
          <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--era-line)' }}>
            {/* A source that is a YouTube link embeds as a click-to-play facade
                (poster thumbnail only until the reader opts in — no iframe loads
                on mount, so this stays cheap in the feed), reusing MomentVideo.
                The citation line below still lists every source for the record.

                Which sources land here is decided by footnoteVideoSources,
                which drops only a citation duplicating the moment's own video
                (it would otherwise render twice on one page). Promoting a lone
                citation UP to the lead slot was considered and deliberately not
                done — see detailVideoFor. */}
            {sourceVideos.map((s, i) => (
              <MomentVideo
                key={`src-vid-${s.url}-${i}`}
                video={{ youtubeId: s.youtubeId, title: s.name }}
                caption={s.name}
                className="mb-4"
              />
            ))}
            {/* Footnote-scale, academic-text style — citations belong here on
                the expanded page, small, not competing with the article. */}
            <p className="text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
              {item.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
              {item.sources.map((s, i) => (
                <span key={`${s.url}-${i}`}>
                  {i > 0 && ', '}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                  >
                    {s.name}
                  </a>
                </span>
              ))}
            </p>
          </div>
        )}

        {item.hiddenClue && (
          <div className="era-card mt-8 rounded-2xl border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
              <Sparkles className="h-4 w-4" />
              Hidden clue
            </div>
            <p className="mt-2 text-[15px] italic leading-relaxed text-[color:var(--era-ink)]">
              “{item.hiddenClue.clue}”
            </p>
            {revealed ? (
              <div className="clue-reveal">
                <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
                  {item.hiddenClue.payoff}
                </p>
                {/* Decoded — now hand the visitor the thread it belongs to. */}
                <ClueWebCta trail={trail} />
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="era-btn-ghost mt-4 rounded-full px-4 py-2 text-sm font-medium"
              >
                Decode it
              </button>
            )}
          </div>
        )}

        {/* A moment can cross-link into a Clue Web trail without carrying its
            own hidden clue — give it the same invitation as its own card. */}
        {!item.hiddenClue && trail && (
          <div className="era-card mt-8 rounded-2xl border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
              <Route className="h-4 w-4" />
              Part of a bigger pattern
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
              This moment belongs to the “{trail.motif.label}” trail — {trail.motif.blurb}
            </p>
            <ClueWebCta trail={trail} />
          </div>
        )}

        {/* Era -> Thread, generalized beyond the Clue Web (issue #436): any
            moment tagged into a thread (via ContentItem.threadIds — today,
            Relationship/Fashion tags imply Love Story/Runway automatically)
            gets a "follow this thread" link. 'easter-eggs' is excluded here
            because a Clue Web cross-link already gets the richer, specific
            trail invitation above rather than a bare thread-home link. */}
        <FollowThreadsRow threadIds={item.threadIds} />

        {/* Moment -> moment cross-links. These were authored long before
            anything rendered them: MomentDetail only ever called
            resolveMotifTrail, which by design resolves `motif:`/`egg:` and
            returns null for everything else, so all 82 `moment:` ids in the
            seeds were inert. */}
        <RelatedMomentsRail related={related} onOpen={openItem} />
      </article>

      {lightboxIndex !== null && (
        <MomentLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          title={item.title}
        />
      )}
    </div>
  );
}

/**
 * "Shop the look" — the moment's shoppable products (ContentItem.products),
 * each row a DIRECT link to the exact retailer product page. Every href goes
 * through buildShopUrl() (lib/longlive/shop.ts) — never product.url directly
 * — so the later direct→affiliate flip is a one-function change with zero
 * content edits; rel="nofollow sponsored noopener noreferrer" is already the
 * correct annotation for both direct and paid links (noreferrer matches the
 * sources links' privacy posture — retailers don't get the referring moment
 * URL; affiliate attribution lives in the wrapped URL, not the Referer). A
 * product verified sold-out
 * (inStock: false) stays listed for the fashion record but renders dimmed
 * with an explicit "Sold out" label, never silently as purchasable. A
 * product that isn't the exact piece she wore (isAlternative: true — the
 * real one is custom/couture/discontinued) gets an explicit "Similar style"
 * label plus its altNote, never presented as the literal garment.
 */
function ShopTheLook({ products }: { products: Product[] | undefined }) {
  if (!products || products.length === 0) return null;
  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <ShoppingBag className="h-4 w-4" />
        Shop the look
      </div>
      <ul className="mt-3">
        {products.map((p, i) => {
          const soldOut = p.inStock === false;
          return (
            // border-t on the li itself (not divide-y on the ul): the era-line
            // color must sit on the element that owns the border, since
            // border-color doesn't inherit from the parent.
            <li
              key={`${p.url}-${i}`}
              className={`border-t first:border-t-0${soldOut ? ' opacity-50' : ''}`}
              style={{ borderColor: 'var(--era-line)' }}
            >
              <a
                href={buildShopUrl(p)}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-3"
                aria-label={`Shop ${p.brand} ${p.item}${soldOut ? ' (sold out)' : ''}${p.isAlternative ? ' (similar style, not the exact piece)' : ''} at ${p.retailer}`}
              >
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.12em] text-[color:var(--era-ink-soft)]">
                    {p.brand}
                  </span>
                  <span className="mt-0.5 block text-[15px] leading-snug text-[color:var(--era-ink)] underline-offset-2 group-hover:underline">
                    {p.item}
                  </span>
                  {soldOut && (
                    <span
                      className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]"
                      style={{ borderColor: 'var(--era-line)' }}
                    >
                      Sold out
                    </span>
                  )}
                  {/* Never let a close match pass as the literal piece she
                      wore (2026-07-20, docs/decisions.md) — same "Sold out"
                      pill treatment, era-accent color so it doesn't read as
                      a warning. */}
                  {p.isAlternative && (
                    <span
                      className="mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-accent)]"
                      style={{ borderColor: 'var(--era-accent)' }}
                      title={p.altNote}
                    >
                      Similar style
                    </span>
                  )}
                  {p.isAlternative && p.altNote && (
                    <span className="mt-1 block max-w-[26rem] text-xs leading-snug text-[color:var(--era-ink-soft)]">
                      {p.altNote}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-[color:var(--era-ink-soft)]">
                  {p.price}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {/* Renders only once buildShopUrl actually returns affiliate links —
          wiring it now is what makes the affiliate flip a shop.ts-only change. */}
      {products.some(isAffiliate) && (
        <p className="mt-3 text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
          {SHOP_DISCLOSURE}
        </p>
      )}
    </div>
  );
}

/**
 * The moment → any thread it belongs to, generalized from the Clue-Web-only
 * motif trail above to `ContentItem.threadIds` generally (issue #436). Reuses
 * the same `openThread` pivot every era -> thread jump already uses.
 */
/**
 * "Keep reading" — the moment-to-moment cross-links a writer authored on this
 * item via `relatedIds`.
 *
 * These existed in the seeds long before anything rendered them: MomentDetail
 * resolved `relatedIds` only through resolveMotifTrail, which handles the
 * `motif:`/`egg:` namespaces and returns null for `moment:` ids. All 82
 * authored moment links were therefore invisible.
 *
 * Renders nothing when nothing resolves, so an item whose links all dangle
 * degrades to the previous behaviour rather than showing an empty shell.
 */
function RelatedMomentsRail({
  related,
  onOpen,
}: {
  related: RelatedMoment[];
  onOpen: (id: string) => void;
}) {
  if (related.length === 0) return null;

  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <ArrowRight className="h-4 w-4" />
        Keep reading
      </div>
      <ul className="mt-4 space-y-2">
        {related.map(({ item: target, eraId }) => {
          const targetEra = getEra(eraId);
          const thumb = primaryImageRef(target);
          return (
            <li key={target.id}>
              <button
                onClick={() => {
                  onOpen(target.id);
                  // Match the era → thread pivot: re-anchor a frame later, so
                  // the jump lands after this overlay's scroll lock lifts.
                  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-[color:var(--era-surface)]"
                style={{ borderColor: 'var(--era-line)' }}
              >
                {thumb && (
                  <Image
                    src={thumb.url}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized={isRemoteUrl(thumb.url)}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    style={{ objectPosition: focalPointOf(thumb) }}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-[color:var(--era-ink)]">
                    {target.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[color:var(--era-ink-soft)]">
                    {targetEra?.shortName ?? eraId}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)]" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FollowThreadsRow({ threadIds }: { threadIds: LensId[] | undefined }) {
  const { openThread } = useAppActions();
  const ids = (threadIds ?? []).filter((id) => id !== 'easter-eggs');
  if (ids.length === 0) return null;

  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <Route className="h-4 w-4" />
        Part of a bigger story
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
        This moment is part of {ids.length > 1 ? 'these threads' : 'a thread'} that cuts across eras.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ids.map((id) => {
          const meta = getThread(id);
          return (
            <button
              key={id}
              onClick={() => {
                openThread(id);
                // Same instant re-anchor every era → thread pivot uses (EraSection) —
                // deferred a frame so it lands after this overlay's scroll lock lifts.
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
              }}
              className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
              aria-label={`Follow the ${meta.title} thread`}
            >
              Follow {meta.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The moment → Clue Web jump. With a resolved trail (from relatedIds) it opens
 * the Clue Web directly on that motif's trail; without one it falls back to a
 * plain "Explore the Clue Web" invitation (Clue Web home) — never a dead link.
 */
function ClueWebCta({ trail }: { trail: MotifTarget | null }) {
  const { openClueWebTrail, openThread } = useAppActions();
  return (
    <button
      onClick={() => {
        if (trail) openClueWebTrail(trail.motifId);
        else openThread('easter-eggs');
        // Same instant re-anchor every era → thread pivot uses (EraSection) —
        // deferred a frame so it lands after this overlay's scroll lock lifts.
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
      }}
      className="era-btn-ghost mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
      aria-label={
        trail ? `Follow the ${trail.motif.label} trail in the Clue Web` : 'Explore the Clue Web'
      }
    >
      {trail ? 'Follow this thread in the Clue Web' : 'Explore the Clue Web'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
