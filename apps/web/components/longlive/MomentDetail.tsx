'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { useFocusTrap } from '@/lib/longlive/useFocusTrap';
import { useAppState, useAppActions, useProgress, useProgressActions } from '@/lib/longlive/store';
import { getContentItem } from '@/lib/longlive/content';
import { getEra } from '@swift2/experience';
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
import { SignificanceBadge } from './SignificanceBadge';
import { primaryImageRef, type ImageRef } from '@swift2/experience';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { MomentHero } from './MomentHero';
import { MomentFigure, MomentLightbox } from './MomentLightbox';
import { MomentLinks } from './MomentLinks';
import { ConfidenceBanner, RumorSection } from './MomentRumors';
import { MomentSources, ShopTheLook } from './MomentSources';

// The moment sheet (R20 split — was one 1,200-line file). This file owns the
// sheet's lifecycle (open/close, scroll lock, focus trap, Escape, back-swipe)
// and the article body; the pieces live beside it:
//   MomentHero      — hero photo/footage + favorite/share/close controls
//   MomentLightbox  — inline photo figures + the full-screen photo viewer
//   MomentRumors    — the sub-confirmed banner + "What's rumored" section
//   MomentSources   — citation footnote + "Shop the look"
//   MomentLinks     — hidden clue, Clue Web trail, threads, "Keep reading"

export function MomentDetail() {
  const { openItemId } = useAppState();
  const { closeItem } = useAppActions();
  const { progress } = useProgress();
  const { markMomentVisited } = useProgressActions();
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

  // Lock body scroll.
  // Only if the id actually resolves — a stale/bad ?item= deep link
  // shouldn't lock scrolling on a modal that never renders.
  useScrollLock(item != null);
  // Focus moves into the sheet on open, is trapped inside it, and returns to
  // the trigger card on close (#657) — scrollRef doubles as the dialog root.
  useFocusTrap(item != null, scrollRef);

  useEffect(() => {
    if (!openItemId) return;
    const onKey = (e: KeyboardEvent) => {
      // While the full-screen viewer is open it owns Escape (closes itself).
      if (e.key === 'Escape' && lightboxIndex === null) closeItem();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItemId, closeItem, lightboxIndex]);

  // Let the mobile back-swipe gesture close this pill instead of leaving the app.
  useBackDismiss(Boolean(item), closeItem);

  if (!item) return null;
  const era = getEra(item.eraId);
  const isFavorite = progress.favorites.has(item.id);
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
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
    >
      <MomentHero
        itemId={item.id}
        isFavorite={isFavorite}
        heroVideo={heroVideo}
        hero={hero}
        openLightbox={openLightbox}
      />

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
        {detailVideo && <MomentVideo video={detailVideo.video} caption={detailVideo.caption} />}

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

        <ShopTheLook products={item.products} context={{ eraId: item.eraId, momentId: item.id }} />

        <MomentSources sources={item.sources} sourceVideos={sourceVideos} />

        <MomentLinks item={item} />
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
