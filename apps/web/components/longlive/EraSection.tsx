'use client';

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { eraStyle } from '@/lib/longlive/theme';
import { contentForEra } from '@/lib/longlive/content';
import { tracksForEra } from '@/lib/longlive/tracks';
import { threadsInEra } from '@/lib/longlive/lenses';
import { videosForEra, eraVideoFeed } from '@/lib/longlive/videos';
import { EraSecretCard } from './EraSecretCard';
import { TrackGuideBar } from './TrackGuideBar';
import { EraFeedList } from './EraFeedList';
import { EraThreadsPivot } from './EraThreadsPivot';
import { CurrentItemDetail } from './CurrentItemDetail';
import {
  embeddedYoutubeIds,
  eraKnownVideoIds,
  inlineVideoMomentIds,
  mergeEraFeed,
  visibleFeed,
  type EraFeedEntry,
} from '@/lib/longlive/era-feed';
import { useEraCurrentFeed } from '@/lib/longlive/use-era-current-feed';
import { threadDoorwaysForEra, eggDoorwaysForEra } from '@/lib/longlive/doorways';
import { spaceDoorways } from '@/lib/longlive/space-doorways';
import { feedCardImageHidden } from '@/lib/longlive/video-affordance';
import type { Era } from '@/lib/longlive/types';
import type { PlayableVideoNote } from '@/lib/longlive/videos';
import { assignFeedTiers, withInlineVideoTiers } from '@/lib/longlive/feed-tiers';
import type { CurrentItem } from '@swift2/shared';

/**
 * A single era in the infinite stream. Themed locally via eraStyle so stacked
 * sections each wear their own palette, while the global chrome tracks whichever
 * section is active. Items are tagged with data-ll-era so the scrubber can
 * scope its measurements to the era currently in view.
 *
 * Renders as one chronological list per docs/marketing/content-framework-
 * 2026-07-03.md §4 — never split into category-grouped sub-sections, so
 * "browse time like a timeline" (vision.md) holds. Filtering is global now
 * (R2) — one six-chip FilterBar for the whole stream, mounted once by
 * EraStream — so this section only reads the active set.
 *
 * PLAN.md P3 step 15 split this file (it had grown past 800 lines) into:
 * `MomentCard.tsx`/`MomentCardButton.tsx` (the moment card body), `VideoMomentCard.tsx`
 * (the video-record card), `DoorwayCard.tsx` (thread/egg doorway cards), and
 * `EraFeedList.tsx` (the four-kind render dispatch). Recorded in MAP.md.
 */
export function EraSection({
  era,
  currentItems = [],
}: {
  era: Era;
  /** Current era's live `current_item` rows (Stage 5); ignored elsewhere. */
  currentItems?: CurrentItem[];
}) {
  const { openItem, setSelectorOpen, openThread, openTrackGuide, openTheoryGuide, pushReturnPoint } =
    useAppActions();
  // Stage 5 — live entries + overlay state (use-era-current-feed.ts).
  const { liveEntries, openCurrentItem, setOpenCurrentItem } = useEraCurrentFeed(
    era.id,
    era.start,
    era.end,
    currentItems,
  );
  // The filter is now global (R2) — one set of six FilterIds, OR-matched,
  // owned by the store and rendered once by FilterBar in EraStream. This
  // section only reads the active set; it no longer owns filter state.
  const { filters } = useAppState();
  const eraThreads = useMemo(() => threadsInEra(era.id), [era.id]);
  const trackCount = useMemo(() => tracksForEra(era.id).length, [era.id]);

  const items = useMemo(() => contentForEra(era.id), [era.id]);
  // Everything watchable in this era (all kinds, including the appearances the
  // 2026-08-12 taxonomy made representable), de-duped against the moments that
  // already embed them.
  const embeddedVideoIds = useMemo(() => embeddedYoutubeIds(items), [items]);
  const videoFeed = useMemo(
    () => eraVideoFeed(era.id, embeddedVideoIds),
    [era.id, embeddedVideoIds],
  );
  // Timeline doorways (PLAN.md P3 steps 13-15): one card per thread present in
  // this era, one per theory/egg the guide has for it. Built here (not once,
  // era-wide, elsewhere) because both builders need this era's own
  // start/end — see doorways.ts for the anchoring rules (including the P3
  // step 14a clamp for a thread point that falls outside the era's window).
  const doorwayEntries = useMemo(
    () => [
      ...threadDoorwaysForEra(era.id, era.start, era.end),
      ...eggDoorwaysForEra(era.id, era.start, era.end),
    ],
    [era.id, era.start, era.end],
  );
  // Merge EVERY moment, video, doorway and live current-item into one
  // unfiltered, newest-first feed, space the doorways (spaceDoorways —
  // 'current' entries pass through untouched), then filter in one pass (R2).
  // Selection itself lives in lib/longlive/era-feed.ts (pure + unit-tested).
  const mergedFeed = useMemo(
    () => spaceDoorways(mergeEraFeed(items, videoFeed, era.start, era.end, [...doorwayEntries, ...liveEntries])),
    [items, videoFeed, era.start, era.end, doorwayEntries, liveEntries],
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

  // A doorway tap (PLAN.md P3 step 16 — Joey: "back should take them right
  // back to the era they came from, at the spot on the timeline they came
  // from"). Push the origin era + scroll spot before navigating; the
  // destination pops and restores it on dismiss (restoreNav for a thread
  // doorway's mode switch, TheoryGuide's own close effect for an egg
  // doorway's overlay) — see store.tsx's ReturnPoint doc comment.
  const handleOpenDoorway = useCallback(
    (entry: Extract<EraFeedEntry<PlayableVideoNote>, { kind: 'thread' } | { kind: 'egg' }>) => {
      pushReturnPoint({
        mode: 'era',
        eraId: era.id,
        itemId: null,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      });
      if (entry.kind === 'thread') {
        openThread(entry.doorway.threadId);
      } else {
        // R4: open straight to this one egg's detail, not just the era's
        // guide in general. `eggId` is `${eraId}:${slug}` (doorways.ts) —
        // strip the era prefix this doorway already knows.
        const slug = entry.doorway.eggId.slice(era.id.length + 1);
        openTheoryGuide(era.id, slug);
      }
    },
    [era.id, openThread, openTheoryGuide, pushReturnPoint],
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
              <blockquote className="font-[family-name:var(--era-font)] text-pretty text-xl italic leading-snug text-[color:var(--era-ink-soft)] sm:text-2xl">
                {'“'}
                {era.lyric.line}
                {'”'}
              </blockquote>
            </figure>
          ) : (
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)] sm:text-lg">
              {era.intro}
            </p>
          )}
          {trackCount > 0 && (
            <TrackGuideBar
              onOpen={() => openTrackGuide(era.id)}
              trackCount={trackCount}
            />
          )}
        </div>
      </div>

      {/* Era Secret (#688): the first thing inside every era — one sourced,
          genuinely-obscure fact, so a fan learns something the moment they
          enter. Renders nothing for an era with no sourced secrets. */}
      <EraSecretCard eraId={era.id} />

      {/* Chronological feed (newest-first): moments, videos and doorways —
          see EraFeedList for the render dispatch. */}
      <EraFeedList
        entries={feedEntries}
        era={era}
        tiers={tiers}
        videoOwnerIds={videoOwnerIds}
        imageHiddenIds={imageHiddenIds}
        filters={filters}
        onOpenItem={openItem}
        onOpenDoorway={handleOpenDoorway}
        onOpenCurrentItem={setOpenCurrentItem}
      />

      <CurrentItemDetail item={openCurrentItem} era={era} onClose={() => setOpenCurrentItem(null)} />

      <EraThreadsPivot era={era} eraThreads={eraThreads} onOpenThread={openThread} />

      {/* Scrubber end-of-content sentinel (not visible). The scrubber only
          builds its scroll anchors from [data-ll-item] elements; without this
          marker the last anchor is the last feed card, so dragging to the
          bottom of the rail stops there instead of past the threads pivot
          strip below. Assigning it the era's start date (<= any real item's
          date) keeps the anchor list's date/position ordering consistent for
          the interpolation in TimelineScrubber. */}
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
