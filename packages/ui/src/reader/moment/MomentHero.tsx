import { Heart, House, Share2, X } from 'lucide-react';
import { useHost, useResolveUrl } from '../../host/context';
import { useReader } from '../../snapshot/context';
import { shareTarget as shareTargetNow } from '../lib/share-payload';
import { useAppActions, useProgress, useProgressActions } from '../store';
import { MomentVideo } from '../era/MomentVideo';
import { ShareImageMenu } from '../era/ShareImageMenu';
import {
  autoFocalPoint,
  focalPointOf,
  type ContentItem,
  type ImageRef,
  type MomentVideo as MomentVideoData,
} from '@swift2/experience';
import { ImageKindBadge } from './MomentFigure';
import { IMAGE_KIND_NOTE, isRemoteUrl } from './momentShared';

export function MomentHero({
  item,
  heroVideo,
  hero,
  openLightbox,
}: {
  item: ContentItem;
  heroVideo: MomentVideoData | null;
  hero: ImageRef | undefined;
  openLightbox: (img: ImageRef) => void;
}) {
  const q = useReader();
  const host = useHost();
  const { Image } = host;
  const resolveUrl = useResolveUrl();
  const { closeItem, goHome } = useAppActions();
  const { progress } = useProgress();
  const { toggleFavorite } = useProgressActions();
  const isFavorite = progress.favorites.has(item.id);
  const heroUrl = resolveUrl(hero?.url ?? '/placeholder.svg');

  // Favorite / share / close, pinned to the sheet's top-right corner. Shared by
  // both hero branches so the three controls a reader needs to get back out of
  // the sheet sit in exactly one place in the source, and cannot end up in one
  // branch only. Over a video hero they clear the player: the slot's pt-16
  // reserves their row above it on a phone, and on desktop the player is capped
  // at 42vh*16/9 and centered, so they land in the gutter beside it.
  const heroControls = (
    <div className="absolute right-4 top-4 z-10 flex gap-2">
      <button
        onClick={goHome}
        className="era-icon-btn rounded-full p-2 backdrop-blur-md"
        aria-label="Go to home"
      >
        <House className="h-5 w-5" />
      </button>
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
        onClick={() => void shareTargetNow({ kind: 'item', itemId: item.id }, q, host)}
        className="era-icon-btn rounded-full p-2 backdrop-blur-md"
        aria-label="Share this moment"
      >
        <Share2 className="h-5 w-5" />
      </button>
      <ShareImageMenu
        variant="icon"
        target={{ kind: 'item', itemId: item.id }}
        source={{ item: item.id }}
        label="Share this moment as an image"
      />
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
    <>
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
            onLoad={autoFocalPoint(hero)}
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
    </>
  );
}
