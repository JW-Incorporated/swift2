'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Heart,
  Shirt,
  RefreshCw,
  Gem,
  ListMusic,
  Check,
  Music,
  Mic2,
  ScrollText,
  AlertTriangle,
  type LucideIcon,
  Clapperboard,
  X,
} from 'lucide-react';
import { useAppActions, useAppState, useProgress } from '@/lib/longlive/store';
import { eraStyle } from '@/lib/longlive/theme';
import { contentForEra } from '@/lib/longlive/content';
import { tracksForEra } from '@/lib/longlive/tracks';
import { theoriesForEra } from '@/lib/longlive/theories';
import { threadsInEra, getThread } from '@/lib/longlive/lenses';
import { videosForEra, eraVideoFeed, VIDEO_KIND_LABEL } from '@/lib/longlive/videos';
import type { PlayableVideoNote } from '@/lib/longlive/videos';
import { formatMonthYear } from '@/lib/longlive/format';
import { EraMedia } from './EraMedia';
import { EraSecretCard } from './EraSecretCard';
import { EraVideos } from './EraVideos';
import { MomentVideo, VideoPoster } from './MomentVideo';
import { SignificanceBadge } from './SignificanceBadge';
import { TAG_META } from '@/lib/longlive/tags';
import { TAG_COLORS } from '@/lib/longlive/tagBadges';
import {
  embeddedYoutubeIds,
  emptyFeedMessage,
  eraKnownVideoIds,
  inlineVideoMomentIds,
  mergeEraFeed,
  visibleFeed,
} from '@/lib/longlive/era-feed';
import { feedCardImageHidden, feedVideoFor } from '@/lib/longlive/video-affordance';
import {
  focalPointOf,
  hasRealPrimaryImage,
  isSubConfirmed,
  primaryImageRef,
} from '@/lib/longlive/types';
import type { ContentItem, ContentTag, Era, LensId } from '@/lib/longlive/types';
import { assignFeedTiers, withInlineVideoTiers, type CardTier } from '@/lib/longlive/feed-tiers';
import {
  TIER_BODY,
  TIER_BOX,
  TIER_BOX_STYLE,
  TIER_FOOTER,
  TIER_SPAN,
} from '@/lib/longlive/card-chrome';
import { cn } from '@/lib/utils';

// Per-tier card chrome (grid span, box, body, footer) lives in
// lib/longlive/card-chrome.ts — see its module comment for why the box is a
// wrapper rather than the button itself (#2057).

/**
 * A single era in the infinite stream. Themed locally via eraStyle so stacked
 * sections each wear their own palette, while the global chrome tracks whichever
 * section is active. Items are tagged with data-ll-era so the scrubber can
 * scope its measurements to the era currently in view.
 *
 * Renders as one chronological list per docs/marketing/content-framework-
 * 2026-07-03.md §4 — never split into category-grouped sub-sections, so
 * "browse time like a timeline" (vision.md) holds. Each card carries a fixed
 * icon+color category badge (TagRow, via lib/longlive/tagBadges). Filtering
 * is global now (R2) — one six-chip FilterBar for the whole stream, mounted
 * once by EraStream — so this section only reads the active set.
 */
export function EraSection({ era }: { era: Era }) {
  const { openItem, setSelectorOpen, openThread, openTrackGuide, openTheoryGuide } =
    useAppActions();
  // The filter is now global (R2) — one set of six FilterIds, OR-matched,
  // owned by the store and rendered once by FilterBar in EraStream. This
  // section only reads the active set; it no longer owns filter state.
  const { filters } = useAppState();
  const eraThreads = useMemo(() => threadsInEra(era.id), [era.id]);
  const trackCount = useMemo(() => tracksForEra(era.id).length, [era.id]);
  const theoryCount = useMemo(() => theoriesForEra(era.id).length, [era.id]);
  const videoCount = useMemo(() => videosForEra(era.id).length, [era.id]);

  const items = useMemo(() => contentForEra(era.id), [era.id]);
  // Everything watchable in this era (all kinds, including the appearances the
  // 2026-08-12 taxonomy made representable), de-duped against the moments that
  // already embed them.
  const embeddedVideoIds = useMemo(() => embeddedYoutubeIds(items), [items]);
  const videoFeed = useMemo(
    () => eraVideoFeed(era.id, embeddedVideoIds),
    [era.id, embeddedVideoIds],
  );
  // Merge EVERY moment and EVERY watchable video into one unfiltered,
  // newest-first feed, then filter it in a single pass (R2 — Videos is a peer
  // chip, not a second axis, so there is exactly one selection rule now
  // instead of a branch choosing between two candidate lists).
  //
  // Selection itself lives in lib/longlive/era-feed.ts (pure + unit-tested);
  // this component only wires it to the store and renders the result.
  const mergedFeed = useMemo(
    () => mergeEraFeed(items, videoFeed, era.start, era.end),
    [items, videoFeed, era.start, era.end],
  );
  const feedEntries = useMemo(() => visibleFeed(mergedFeed, filters), [mergedFeed, filters]);
  // The filtered feed's moment items — everything downstream that reasons
  // about "the moments actually on screen" (video ownership, image
  // suppression, card tiers) reads this instead of `items`.
  const visible = useMemo(
    () => feedEntries.flatMap((e) => (e.kind === 'moment' ? [e.item] : [])),
    [feedEntries],
  );
  // Which moments own their video's inline player, when two of them embed the
  // same one (#2057). Derived from `visible`, NOT from `items`, for the same
  // reason the tiers below are: ownership is a property of the list on screen.
  // Over `items` a filter that hides the owner would leave the survivor with no
  // play control at all — a card that carries footage looking exactly like one
  // that doesn't, which is the #2051 bug this chain exists to close.
  const videoOwnerIds = useMemo(() => inlineVideoMomentIds(visible), [visible]);
  // Every video id this era can play — the moments' own embeds plus the Videos
  // rail's records. It is the comparison set for the deferring-card suppression
  // below, so a card showing a frame of a video it will not play is caught
  // whether that video is its own or a sibling's.
  //
  // Era-wide (over `items`, not `visible`) on purpose: whether a picture is a
  // still from footage the era carries is a fact about the era, not about which
  // chips happen to be lit, so a tag filter can never make a suppressed frame
  // blink back on.
  const knownVideoIds = useMemo(
    () => eraKnownVideoIds(items, videosForEra(era.id)),
    [items, era.id],
  );
  // The cards whose photo will not render: a card carrying footage whose picture
  // is a still of a video the era plays — either the one its own poster is about
  // to show (#2080) or one it defers to another card and so has no control for.
  // The second half is Joey's tloas report: "'Elizabeth Taylor' goes to radio"
  // opened with a hero-sized still from the Elizabeth Taylor music video and no
  // play button, because the embed belongs to the supercut card above it. See
  // `feedCardImageHidden`.
  const imageHiddenIds = useMemo(() => {
    const hidden = new Set<string>();
    for (const item of visible) {
      if (feedCardImageHidden(item, knownVideoIds)) hidden.add(item.id);
    }
    return hidden;
  }, [visible, knownVideoIds]);
  // Card silhouette per item — recomputed against whatever's actually on
  // screen (so filtering doesn't reference invisible items), but a pure
  // function of that list's ids, so it's stable across re-renders.
  //
  // `withInlineVideoTiers` then floors the cards that actually play a video at
  // `media` (#2080): the full-width poster every video now renders through
  // cannot sit under a 56px `chip` row or inside the no-photo `text` breather
  // without destroying the silhouette that IS that tier. See feed-tiers.ts.
  //
  // Tiers are scored against the cards' REAL contents, which for a deferring
  // card now means "no picture": its photo is suppressed and, unlike an owner's,
  // nothing takes the slot — no poster, because it does not play. Left unsaid,
  // "'Elizabeth Taylor' goes to radio" would keep the hero silhouette it earned
  // as a photo card and render it empty. Owners are deliberately NOT in this
  // set: their poster fills the image slot, so their tier is still honest.
  //
  // This lowers the SCORE-derived tiers only. `significance` still outranks it,
  // exactly as it outranks the score (feed-tiers.ts): a 'defining' card stays
  // `hero` and a 'notable' card keeps its `media` floor with no photo, because
  // significance is a judgment about the event, and a missing picture is not a
  // reason to demote one. Both tiers already render imageless today.
  const tierlessImageIds = useMemo(
    () => new Set([...imageHiddenIds].filter((id) => !videoOwnerIds.has(id))),
    [imageHiddenIds, videoOwnerIds],
  );
  const tiers = useMemo(
    () => withInlineVideoTiers(assignFeedTiers(visible, tierlessImageIds), videoOwnerIds),
    [visible, videoOwnerIds, tierlessImageIds],
  );
  return (
    <section
      data-ll-section={era.id}
      style={eraStyle(era)}
      className="relative bg-[color:var(--era-bg)] text-[color:var(--era-ink)]"
    >
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={era.image || '/placeholder.svg'}
            alt=""
            fill
            priority
            className="object-cover opacity-40"
          />
          {/* Fades in from era-bg at the very top (blending into the solid-
              color EraTransition band above this section, so the image
              doesn't start abruptly at full opacity right at the seam) and
              back out to era-bg at the bottom (for text legibility), instead
              of the old hard-stop gradient that left a visible cut. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, var(--era-bg) 0%, color-mix(in srgb, var(--era-bg) 55%, transparent) 18%, color-mix(in srgb, var(--era-bg) 55%, transparent) 55%, var(--era-bg) 100%)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-8 pt-14 text-center sm:pt-20">
          <button
            onClick={() => setSelectorOpen(true)}
            className="era-chip mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]"
          >
            {era.isCurrent ? 'Current era' : era.yearLabel}
          </button>

          <h1 className="font-[family-name:var(--era-font)] text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            {era.name}
          </h1>
          {era.lyric ? (
            <figure className="mx-auto mt-6 max-w-xl">
              <blockquote className="font-[family-name:var(--era-font)] text-pretty text-xl italic leading-snug text-[color:var(--era-ink)] sm:text-2xl">
                {'\u201C'}
                {era.lyric.line}
                {'\u201D'}
              </blockquote>
            </figure>
          ) : (
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)] sm:text-lg">
              {era.intro}
            </p>
          )}
          {era.media && <EraMedia media={era.media} />}

          {/* Era guides — each only when this era has sourced records. */}
          {(trackCount > 0 || theoryCount > 0 || videoCount > 0) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {trackCount > 0 && (
                <button
                  onClick={() => openTrackGuide(era.id)}
                  className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                >
                  <ListMusic className="h-4 w-4 text-[color:var(--era-accent)]" />
                  Track guide
                  <span className="text-xs text-[color:var(--era-ink-soft)]">
                    {trackCount} {trackCount === 1 ? 'song' : 'songs'}
                  </span>
                </button>
              )}
              {theoryCount > 0 && (
                <button
                  onClick={() => openTheoryGuide(era.id)}
                  className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                >
                  <Sparkles className="h-4 w-4 text-[color:var(--era-accent)]" />
                  Theories &amp; eggs
                  <span className="text-xs text-[color:var(--era-ink-soft)]">{theoryCount}</span>
                </button>
              )}
              {videoCount > 0 && (
                <button
                  onClick={() =>
                    document
                      .getElementById(`era-videos-${era.id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                >
                  <Clapperboard className="h-4 w-4 text-[color:var(--era-accent)]" />
                  Videos
                  <span className="text-xs text-[color:var(--era-ink-soft)]">{videoCount}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Era Secret (#688): the first thing inside every era — one sourced,
          genuinely-obscure fact, so a fan learns something the moment they
          enter. Renders nothing for an era with no sourced secrets. */}
      <EraSecretCard eraId={era.id} />

      {/* Chronological feed (newest-first). Music videos (issue #439) are
          merged in alongside curated moments, dated to their release date —
          the fuller card for each still lives in the EraVideos rail below. */}
      <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
        {/* Editorially-weighted grid (#1017 part 3). Card tier drives the
            number of GRID CELLS a story occupies, which is what actually makes
            the tiers read as different silhouettes — the previous layout was a
            single column where hero vs media was only a font-size and
            image-ratio difference, i.e. the founder's "pretty much all
            articles present as the same."

            `items-start` is load-bearing: without it a chip sharing a row with
            a media card would stretch to that card's height, which destroys
            the compactness that IS the chip tier. */}
        {/* Visually hidden: card titles are h3, so without this the outline
            jumps h1 (era) → h3 (card) — axe `heading-order` (#703). */}
        <h2 className="sr-only">Moments from {era.shortName}</h2>
        <ol className="relative grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
          {feedEntries.map((entry) =>
            entry.kind === 'video' ? (
              <VideoMomentCard
                key={`era-video-${entry.video.slug}`}
                video={entry.video}
                eraId={era.id}
                sortDate={entry.anchor.sortDate}
              />
            ) : (
              <MomentCard
                key={entry.item.id}
                item={entry.item}
                tier={tiers.get(entry.item.id) ?? 'text'}
                ownsVideo={videoOwnerIds.has(entry.item.id)}
                hideImage={imageHiddenIds.has(entry.item.id)}
                onOpen={() => openItem(entry.item.id)}
              />
            ),
          )}
        </ol>
        {feedEntries.length === 0 && (
          <p className="py-16 text-center text-sm text-[color:var(--era-ink-soft)]">
            {emptyFeedMessage(filters, era.shortName)}
          </p>
        )}
      </div>

      {/* Official videos for the era — click-to-play embeds + metadata cards. */}
      <EraVideos eraId={era.id} />

      {/* Era → Thread pivot: jump sideways into any story that runs through here. */}
      {eraThreads.length > 0 && (
        <div className="border-t border-[color:var(--era-line)]">
          <div className="mx-auto max-w-4xl px-4 py-8 md:pr-8">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
              Threads running through {era.shortName}
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {eraThreads.map(({ id, count }) => {
                const Icon = PIVOT_ICONS[id] ?? Heart;
                const meta = getThread(id);
                return (
                  <button
                    key={id}
                    onClick={() => {
                      openThread(id);
                      window.scrollTo({ top: 0, behavior: 'auto' });
                    }}
                    className="era-card group inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition hover:border-[color:var(--era-accent)]"
                  >
                    <Icon className="h-4 w-4 text-[color:var(--era-accent)]" />
                    {meta.title}
                    <span className="text-xs text-[color:var(--era-ink-soft)]">
                      {count} {count === 1 ? 'moment' : 'moments'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--era-ink-soft)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--era-accent)]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scrubber end-of-content sentinel (not visible). The scrubber only
          builds its scroll anchors from [data-ll-item] elements; without this
          marker the last anchor is the last MomentCard, so dragging to the
          bottom of the rail stops there instead of past EraVideos/the threads
          pivot strip below. Assigning it the era's start date (<= any real
          item's date) keeps the anchor list's date/position ordering
          consistent for the interpolation in TimelineScrubber. */}
      <div
        aria-hidden
        data-ll-item={`${era.id}__end`}
        data-ll-era={era.id}
        data-ll-date={new Date(era.start).getTime()}
        style={{ height: 0, width: 0 }}
      />
    </section>
  );
}

const PIVOT_ICONS: Partial<Record<LensId, typeof Heart>> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'the-proposal': Gem,
};

/** One stable icon per content tag — the other half of the category badge
 * (paired with the fixed colors in lib/longlive/tagBadges). Reused by both
 * the card badge (TagRow) and the per-era filter chips above. */
const TAG_ICON: Record<ContentTag, LucideIcon> = {
  Music,
  Fashion: Shirt,
  Tour: Mic2,
  Relationship: Heart,
  Lore: ScrollText,
};

/**
 * Lightweight timeline entry for a video duplicated in from the era's videos
 * (issue #439 part 2 for music videos; every kind under the Videos filter).
 * Deliberately thinner than MomentCard's tiers — director/symbolism/easter-egg
 * depth stays in the EraVideos rail card below; this is just the date, title,
 * and the same click-to-play facade (MomentVideo) used everywhere else a video
 * embeds.
 *
 * A record with no `releasedOn` (only reachable under the Videos filter) is
 * anchored at `sortDate` — the entry's `anchor.sortDate` from mergeEraFeed
 * (era-feed.ts), which resolveAnchor (anchor-date.ts) computes.
 *
 * Leaving it unanchored was the first instinct — never invent a date — and it
 * was wrong in a way review caught: an unanchored card leaves TimelineScrubber
 * interpolating across a region containing no anchors at all, so dragging maps
 * to badly wrong dates exactly where the filter is most used. The anchor is
 * not a fabricated claim about the video: nothing renders it, the card still
 * reads "Date unknown".
 */
function VideoMomentCard({
  video,
  eraId,
  sortDate,
}: {
  video: PlayableVideoNote;
  eraId: Era['id'];
  sortDate: string;
}) {
  const anchorProps = {
    'data-ll-item': `era-video-${video.slug}`,
    'data-ll-era': eraId,
    'data-ll-date': new Date(video.releasedOn ?? sortDate).getTime(),
  };
  const kindLabel = video.kind ? VIDEO_KIND_LABEL[video.kind] : 'Video';
  // Every video record reaching this component plays: `videosForEra` hides the
  // ones with no verified embed rather than rendering them (playable-first,
  // docs/decisions.md 2026-08-13). That is why there is no else branch here and
  // no `youtubeId` guard — the type says the id is present.
  //
  // Full width because this card always carries a 16/9 YouTube facade, which is
  // unreadable squeezed into a half-width track.
  //
  // NB: this comment lives OUTSIDE the tag on purpose. A `//` comment in JSX
  // attribute position parses under tsc but is a hard syntax error in Next's
  // SWC parser, so it passes typecheck and tests and then fails only in the
  // browser as a blank page (2026-07-21).
  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      {...anchorProps}
    >
      <div className="era-card block w-full rounded-2xl border p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {video.releasedOn ? formatMonthYear(video.releasedOn) : 'Date unknown'}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[color:var(--era-accent)]">
            <Clapperboard className="h-3.5 w-3.5" aria-hidden />
            {kindLabel}
          </span>
        </div>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
          {video.title}
        </h3>
        {video.summary && (
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {video.summary}
          </p>
        )}
        <MomentVideo
          video={{ youtubeId: video.youtubeId, title: video.title }}
          caption={null}
          playNoun={kindLabel.toLowerCase()}
          className="mt-4"
        />

      </div>
    </li>
  );
}

/** Date/tags/clue/seen row shared by every card tier. */
function MomentMeta({
  item,
  seen,
  size = 'default',
}: {
  item: ContentItem;
  seen: boolean;
  size?: 'default' | 'compact';
}) {
  const hasClue = Boolean(item.hiddenClue);
  // Sub-confirmed moments carry their qualifier on the CARD, not just one
  // click later in the detail view — a rumor must never scroll by as fact
  // (rumor tier, 2026-07-19). 'disproven' gets its own word; every other
  // sub-confirmed value reads "Unconfirmed" at feed altitude.
  const unconfirmed = item.confidence && isSubConfirmed(item.confidence);
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={cn(
          'uppercase tracking-widest text-[color:var(--era-ink-soft)]',
          size === 'compact' ? 'text-[10px]' : 'text-xs',
        )}
      >
        {item.dateLabel}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {item.significance && size === 'default' && (
          <SignificanceBadge significance={item.significance} />
        )}
        {unconfirmed && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--era-accent)]"
            style={{ borderColor: 'var(--era-accent)' }}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {size === 'default' && (item.confidence === 'disproven' ? 'Debunked' : 'Unconfirmed')}
          </span>
        )}
        {hasClue && (
          <span className="clue-glint inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--era-accent)]">
            <Sparkles className="h-3 w-3" />
            {size === 'default' && 'Hidden clue'}
          </span>
        )}
        {seen && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            <Check className="h-3 w-3" aria-hidden />
            {size === 'default' && 'Seen'}
          </span>
        )}
        {size === 'default' && (
          <ArrowUpRight className="h-4 w-4 text-[color:var(--era-ink-soft)] transition group-hover:text-[color:var(--era-accent)]" />
        )}
      </span>
    </div>
  );
}

/**
 * Category badge row: icon + fixed-color filled pill, one per tag on this
 * item (content-framework doc §4 — icon+color, not the old era-accent-tinted
 * text label). Colors come from lib/longlive/tagBadges (era-independent), so
 * a category reads the same across every era's re-skin.
 */
function TagRow({ tags }: { tags: ContentTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {tags.map((t) => {
        const Icon = TAG_ICON[t];
        return (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: TAG_COLORS[t] }}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {TAG_META[t].label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * One moment in the era feed: the card itself, plus its play affordance when
 * the moment carries footage (#2051).
 *
 * The two live as SIBLINGS on purpose. `MomentCardButton` is a single big
 * <button> that opens the story — that is the whole point of the #1017
 * editorial tiers — and the play affordance cannot go inside it without nesting
 * one interactive element in another. So: tap the poster and the video plays
 * right here in the feed; tap anywhere else on the card and the story opens,
 * exactly as before.
 *
 * The affordance IS `VideoPoster` — the same component the video-record cards
 * render (#2080). One video treatment in the feed: full-width 16:9, the video's
 * own thumbnail, one big centered accent glyph, whatever kind of card it hangs
 * on. #2063's compact 96px "Play video" row is gone; Joey rejected it on his
 * phone precisely because a second vocabulary for "this plays" leaves the reader
 * still having to learn which cards do.
 *
 * `hideImage` is the other half of that uniformity, and it is not cosmetic: 8 of
 * the 16 moments carrying footage have the video's OWN thumbnail as their photo
 * (Photo Enrichment reached for it because the moment IS the video). Rendering
 * both would print the same frame twice inside one card — for two of them the
 * card photo is the byte-identical url the poster requests. So when the photo is a frame of
 * the video being played, the poster takes the image slot instead of joining it,
 * and the card lands on exactly the video-record shape Joey pointed at: text
 * above, big poster below. A photo from anywhere else is a different picture and
 * is kept.
 *
 * It also covers the opposite failure, which is worse: a card that DEFERS its
 * embed (`ownsVideo` false) showing a frame of the video it will not play. On
 * tloas that put a hero-sized still of the Elizabeth Taylor music video on
 * "'Elizabeth Taylor' goes to radio" with no play control anywhere on it — a big
 * video-looking picture that does nothing when tapped. Suppressed, the card is
 * the story it always was (radio airplay), and its tier falls back to a
 * no-photo one because that is now what it is. Both halves are decided by
 * `feedCardImageHidden` and handed down as this one boolean.
 *
 * They are siblings INSIDE THE CARD'S BOX, which is the #2057 fix: the box is
 * drawn by the wrapper below (TIER_BOX), not by the button, so an affordance
 * rendered beside the button still lands within the border instead of floating
 * in the gap under the card. See card-chrome.ts.
 *
 * Playback is one tap, not two: the poster IS the user's play gesture, so the
 * embed mounts already playing (`startPlaying`). The #1935 click-to-load
 * posture is intact — no iframe exists in the feed until this state flips, and
 * only a real click flips it. The poster is then replaced by the player rather
 * than sitting beside it, so the card never shows two play controls.
 *
 * `ownsVideo` is the #2057 duplicate-embed rule: when two moments in one era
 * embed the same YouTube id, only the first in feed order renders the player
 * (see inlineVideoMomentIds). A later duplicate keeps every word of its own
 * story — it just doesn't play the same video a second time.
 */
function MomentCard({
  item,
  tier,
  ownsVideo,
  hideImage,
  onOpen,
}: {
  item: ContentItem;
  tier: CardTier;
  ownsVideo: boolean;
  hideImage: boolean;
  onOpen: () => void;
}) {
  const video = ownsVideo ? feedVideoFor(item) : null;
  const [playing, setPlaying] = useState(false);
  const { openItemId } = useAppState();

  // Stop feed playback when a moment detail opens over it.
  //
  // MomentDetail is a `fixed inset-0 z-50` sheet rendered ALONGSIDE a still-
  // mounted EraStream, so without this the iframe keeps playing underneath it:
  // audible, invisible, and unreachable until the reader closes the sheet and
  // scrolls back to find it. Tapping the card is the very next gesture after
  // tapping its play badge, so this is the common path, not a corner case. For
  // the same moment it also avoids two players of one video running at once.
  useEffect(() => {
    if (openItemId) setPlaying(false);
  }, [openItemId]);

  // `min-w-0` is required on every grid item: a grid child defaults to
  // `min-width: auto`, which lets a long unbroken title push the track wider
  // than its share of the container and scroll the whole page sideways.
  // #1017 makes "the page body must never scroll horizontally" a hard
  // requirement, and this is the line that holds it.
  return (
    <li
      className={cn('relative min-w-0 scroll-mt-28', TIER_SPAN[tier])}
      data-ll-item={item.id}
      data-ll-era={item.eraId}
      data-ll-date={new Date(item.date).getTime()}
    >
      {/* The card's visual box. It is this wrapper, not the button, so that the
          play affordance below can be a SIBLING of the button and still render
          inside the border (#2057 — see card-chrome.ts). */}
      <div className={TIER_BOX[tier]} style={TIER_BOX_STYLE[tier]}>
        <MomentCardButton
          item={item}
          tier={tier}
          hideImage={hideImage}
          onOpen={onOpen}
        />
        {video && (
          <div className={TIER_FOOTER[tier]}>
            {playing ? (
              <>
                <MomentVideo video={video} caption={null} className="" startPlaying />
                {/* The way back out. Without it the only exits from a playing
                    card are opening the detail or leaving the era. */}
                <button
                  type="button"
                  onClick={() => setPlaying(false)}
                  aria-label={`Hide video: ${video.title}`}
                  className="era-btn-ghost mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Hide video
                </button>
              </>
            ) : (
              <VideoPoster video={video} onPlay={() => setPlaying(true)} />
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** The card body — one <button> per tier, the feed's only route into the story
 * detail. Kept as its own component so `MomentCard` above owns exactly one
 * thing: the relationship between that button and the play affordance beside
 * it.
 *
 * Each tier's root className comes from TIER_BODY, which carries layout and
 * padding but deliberately NO surface/border/radius: the box belongs to the
 * wrapper in `MomentCard`, so that whatever renders beside this button renders
 * inside the same border (#2057). Drawing a second box here would put the
 * affordance back outside one of them.
 *
 * `hideImage` drops this button's photo block for either of the two reasons a
 * card's picture must not render (both decided by `feedCardImageHidden`): the
 * sibling `VideoPoster` is about to show the same frame (#2080), or the photo is
 * a still of a video this card does not play and has no control for (#2081).
 * Passed in rather than derived here because the decision needs the era's video
 * set and the #2057 ownership answer, neither of which a card can see. */
function MomentCardButton({
  item,
  tier,
  hideImage,
  onOpen,
}: {
  item: ContentItem;
  tier: CardTier;
  hideImage: boolean;
  onOpen: () => void;
}) {
  const { progress } = useProgress();
  const seen = progress.moments.has(item.id);
  const hero = !hideImage && hasRealPrimaryImage(item) ? primaryImageRef(item) : undefined;

  // CHAPTER BREAK — rare (paced out in feed-tiers.ts), full-bleed image,
  // big serif title. Registers as an event specifically because it's rare.
  //
  // The image block below is conditional on `hero` (a real photo) — but the
  // tier itself is not: `significance: 'defining'` (docs/decisions.md,
  // 2026-07-18) guarantees this tier regardless of imagery, so a defining
  // item with no real photo yet must still get the bigger typography, not
  // silently fall through to the plain media-tier card below. Found in
  // review (2026-07-18) — the original version gated the whole branch on
  // `tier === 'hero' && hero`, which is correct for "should this look like
  // a photo hero" but wrong for "did significance actually change anything
  // for this item," which is the guarantee the feature makes.
  if (tier === 'hero') {
    return (
      <button onClick={onOpen} className={TIER_BODY.hero}>
        {/* Tallest image in the feed, at twice the width of any other card:
              16/9 across the full 2-column track is roughly 500px of picture,
              against ~270px for the half-width media card. */}
        {hero && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(hero.url)}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              style={{ objectPosition: focalPointOf(hero) }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, color-mix(in srgb, var(--era-surface) 88%, transparent), transparent 55%)',
              }}
            />
          </div>
        )}
        <div className="p-6 md:p-8">
          <MomentMeta item={item} seen={seen} />
          <h3 className="mt-2 font-[family-name:var(--era-font)] text-balance break-words text-3xl font-semibold leading-[1.1] sm:text-4xl">
            {item.title}
          </h3>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)]">
            {item.summary}
          </p>
          <TagRow tags={item.tags} />
        </div>
      </button>
    );
  }

  // DENSE ROW — routine, day-to-day items. Tight, subordinate, small
  // thumbnail if there's a real one. Several of these packed together make
  // the next full card read as an event by contrast.
  if (tier === 'chip') {
    return (
      <button onClick={onOpen} className={TIER_BODY.chip}>
        {hero && (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(hero.url)}
              className="object-cover"
              style={{ objectPosition: focalPointOf(hero) }}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <MomentMeta item={item} seen={seen} size="compact" />
          <h3 className="mt-0.5 truncate font-[family-name:var(--era-font)] text-[15px] font-semibold leading-snug">
            {item.title}
          </h3>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--era-ink-soft)] transition group-hover:text-[color:var(--era-accent)]" />
      </button>
    );
  }

  // BREATHER — deliberately no image (either none exists, or this card was
  // chosen to break up a run of image cards), but typographically chosen,
  // not a degraded fallback: bigger date, more air, a left accent rule.
  if (tier === 'text') {
    return (
      <button onClick={onOpen} className={TIER_BODY.text}>
        <MomentMeta item={item} seen={seen} />
        <h3 className="mt-2 break-words font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {item.summary}
        </p>
        <TagRow tags={item.tags} />
      </button>
    );
  }

  // WORKHORSE (media) — the default: contained image + text, at half the
  // hero's width so the hero reads as the event and this reads as the beat.
  return (
    <button onClick={onOpen} className={TIER_BODY.media}>
      {hero && (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={hero.url}
            alt=""
            fill
            unoptimized={/^https?:\/\//.test(hero.url)}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            style={{ objectPosition: focalPointOf(hero) }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, color-mix(in srgb, var(--era-surface) 85%, transparent), transparent 50%)',
            }}
          />
        </div>
      )}
      <div className="p-4">
        <MomentMeta item={item} seen={seen} />
        <h3 className="mt-2 break-words font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {item.summary}
        </p>
        <TagRow tags={item.tags} />
      </div>
    </button>
  );
}
