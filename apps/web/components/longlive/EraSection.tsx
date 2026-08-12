'use client';

import { useMemo, useState } from 'react';
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
  SlidersHorizontal,
  AlertTriangle,
  type LucideIcon,
  Clapperboard,
} from 'lucide-react';
import { useAppActions, useProgress } from '@/lib/longlive/store';
import { eraStyle } from '@/lib/longlive/theme';
import { contentForEra } from '@/lib/longlive/content';
import { tracksForEra } from '@/lib/longlive/tracks';
import { theoriesForEra } from '@/lib/longlive/theories';
import { threadsInEra, getThread } from '@/lib/longlive/lenses';
import { videosForEra, musicVideosForEra } from '@/lib/longlive/videos';
import { formatMonthYear } from '@/lib/longlive/format';
import { EraMedia } from './EraMedia';
import { EraVideos } from './EraVideos';
import { MomentVideo } from './MomentVideo';
import { SignificanceBadge } from './SignificanceBadge';
import { TAG_META } from '@/lib/longlive/tags';
import { TAG_COLORS, itemMatchesFilter, tagsPresent } from '@/lib/longlive/tagBadges';
import {
  focalPointOf,
  hasRealPrimaryImage,
  isSubConfirmed,
  primaryImageRef,
} from '@/lib/longlive/types';
import type { ContentItem, ContentTag, Era, LensId, VideoNote } from '@/lib/longlive/types';
import { assignFeedTiers, type CardTier } from '@/lib/longlive/feed-tiers';
import { cn } from '@/lib/utils';

/** A dated music video (see musicVideosForEra) eligible for a timeline entry. */
type TimelineVideo = VideoNote & { releasedOn: string };

/**
 * Tier -> grid footprint (#1017 part 3).
 *
 * The span vocabulary is deliberately just TWO values: full-width and
 * half-width. A richer one (thirds, sixths, NYT-style) packs badly here
 * because this feed is strictly chronological. The usual fix for the holes a
 * mixed-span grid leaves is `grid-auto-flow: dense`, and that is NOT available
 * to us: dense packing pulls later items up into earlier gaps, which would
 * both break the newest-first reading order and scramble TimelineScrubber's
 * position<->date anchors (it measures `[data-ll-item]` tops and interpolates,
 * assuming they descend in date as they descend the page).
 *
 * With only 1-cell and 2-cell spans, every half-width card pairs cleanly with
 * its neighbour and the only hole possible is a single trailing half-cell in
 * front of a full-width card — which reads as deliberate editorial air rather
 * than a broken layout.
 *
 * Below `md` this map is inert: the grid is a single column, so every card is
 * full width and the tiers separate on height and internal density instead.
 */
const TIER_SPAN: Record<CardTier, string> = {
  // The event. Twice the width of everything around it, and the tallest image
  // in the feed — dominance you cannot miss while scrolling past.
  hero: 'md:col-span-2',
  // The workhorse. Half width, so a hero beside it is unmistakably bigger.
  media: 'md:col-span-1',
  // Compact dense row; two sit side by side in the space of one media card.
  chip: 'md:col-span-1',
  // Pure typography breather, no image.
  text: 'md:col-span-1',
};

/** One entry in the merged, newest-first main feed: either a curated moment
 * or a music video duplicated in from the era's videos (issue #439). */
type FeedEntry = { kind: 'moment'; item: ContentItem } | { kind: 'video'; video: TimelineVideo };

/**
 * A single era in the infinite stream. Themed locally via eraStyle so stacked
 * sections each wear their own palette, while the global chrome tracks whichever
 * section is active. Items are tagged with data-ll-era so the scrubber can
 * scope its measurements to the era currently in view.
 *
 * Renders as one chronological list per docs/marketing/content-framework-
 * 2026-07-03.md §4 — never split into category-grouped sub-sections, so
 * "browse time like a timeline" (vision.md) holds. Each card carries a fixed
 * icon+color category badge (TagRow, via lib/longlive/tagBadges) and the
 * optional per-era filter below reuses that same icon/color set.
 */
export function EraSection({ era }: { era: Era }) {
  const { openItem, setSelectorOpen, openThread, openTrackGuide, openTheoryGuide } =
    useAppActions();
  // Filter STATE is still "off by default" (no tag selected = everything
  // shows, per the content-framework addendum). What changed is the
  // AFFORDANCE: the chips are always on screen instead of hidden behind a
  // Filter disclosure, because the disclosure cost an interaction on every
  // single use and the row it hid is only ever ≤5 chips (2026-08-11, founder
  // feedback from the live site). The old addendum's "not a persistent filter
  // row on every one of ~230 months" concern predates the era-section layout —
  // this is one row per era section, not per month.
  const [activeTags, setActiveTags] = useState<Set<ContentTag>>(new Set());
  const eraThreads = useMemo(() => threadsInEra(era.id), [era.id]);
  const trackCount = useMemo(() => tracksForEra(era.id).length, [era.id]);
  const theoryCount = useMemo(() => theoriesForEra(era.id).length, [era.id]);
  const videoCount = useMemo(() => videosForEra(era.id).length, [era.id]);

  const items = useMemo(() => contentForEra(era.id), [era.id]);
  // Pure client-side filter over already-resident Tier 0 data — no fetch, no
  // payload/schema change. Non-matching items are simply omitted from the
  // rendered list (same mechanism the pre-existing tag filter used), which
  // TimelineScrubber's own ResizeObserver already re-measures against
  // gracefully (see its "Catch layout changes from filtering" handling) —
  // the scrubber's rail, drag gesture and era position are unaffected, it
  // just remeasures the (now shorter) visible content.
  const visible = useMemo(() => {
    if (activeTags.size === 0) return items;
    return items.filter((it) => itemMatchesFilter(it.tags, activeTags));
  }, [items, activeTags]);
  // Card silhouette per item — recomputed against whatever's actually on
  // screen (so filtering doesn't reference invisible items), but a pure
  // function of that list's ids, so it's stable across re-renders.
  const tiers = useMemo(() => assignFeedTiers(visible), [visible]);

  // Music videos duplicated into the main timeline (issue #439), dated to
  // their release date, alongside — not instead of — the EraVideos rail
  // below. Skip any whose youtubeId is already embedded on a curated moment
  // above (e.g. a lead-single video that's also its own narrative beat) so
  // the same video never appears twice in this same list.
  const embeddedVideoIds = useMemo(
    () => new Set(items.map((it) => it.video?.youtubeId).filter((id): id is string => Boolean(id))),
    [items],
  );
  const timelineVideos = useMemo(
    () =>
      musicVideosForEra(era.id).filter((v) => !v.youtubeId || !embeddedVideoIds.has(v.youtubeId)),
    [era.id, embeddedVideoIds],
  );
  const visibleTimelineVideos = useMemo(
    () => (activeTags.size === 0 || activeTags.has('Music') ? timelineVideos : []),
    [timelineVideos, activeTags],
  );
  // Merge the (already tag-filtered) moments with the (already tag-gated)
  // video entries into one newest-first feed, keeping cross-type ordering
  // correct instead of just concatenating the two lists.
  const feedEntries = useMemo(() => {
    const entries: FeedEntry[] = [
      ...visible.map((item): FeedEntry => ({ kind: 'moment', item })),
      ...visibleTimelineVideos.map((video): FeedEntry => ({ kind: 'video', video })),
    ];
    return entries.sort((a, b) => {
      const dateA = a.kind === 'moment' ? a.item.date : a.video.releasedOn;
      const dateB = b.kind === 'moment' ? b.item.date : b.video.releasedOn;
      return dateB.localeCompare(dateA);
    });
  }, [visible, visibleTimelineVideos]);

  // tagsPresent() keeps chip order canonical; a video-only 'Music' presence
  // (issue #439) is folded in via a synthetic tag list rather than bypassing
  // the shared helper, so the filter's "only offer tags this era actually
  // uses" guarantee still holds for the timeline-video case too.
  const presentTags = useMemo(
    () =>
      tagsPresent(
        timelineVideos.length > 0
          ? [...items.map((it) => it.tags), ['Music']]
          : items.map((it) => it.tags),
      ),
    [items, timelineVideos],
  );

  function toggleTag(tag: ContentTag) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function clearTags() {
    setActiveTags(new Set());
  }

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

      {/* Per-era category filter: the chips are ALWAYS visible (only rendered
          at all when this era actually has tagged content), non-sticky so
          stacked sections don't fight for the top. Reuses the same icon+color
          set as the card badges below.

          Responsive shape: one `flex-wrap` rail. There are at most five
          category chips (ContentTag), so on a 360–390px phone the rail wraps
          to two short rows and every option stays on screen — no horizontal
          scroll rail, which would just re-hide options behind a gesture, and
          no disclosure, which is the interaction this change removes. `Clear`
          is styled as a chip too so it clears the same 24px minimum target as
          its neighbours (WCAG 2.5.8). */}
      {presentTags.length > 0 && (
        <div className="border-y border-[color:var(--era-line)] bg-[color:var(--era-surface)]/40">
          <div className="mx-auto max-w-4xl px-4 py-3 md:pr-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                id={`era-filter-label-${era.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-[color:var(--era-ink-soft)]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                Filter
              </span>

              <div
                id={`era-filter-${era.id}`}
                role="group"
                aria-labelledby={`era-filter-label-${era.id}`}
                className="flex flex-wrap gap-2"
              >
                {presentTags.map((tag) => {
                  const active = activeTags.has(tag);
                  const Icon = TAG_ICON[tag];
                  const color = TAG_COLORS[tag];
                  // TAG_COLORS are specced as mid-dark hues that clear AA
                  // *against white text* (see tagBadges.ts) — i.e. for the
                  // solid, selected pill. Painting the same hue as the LABEL
                  // of an unselected, transparent chip inverts that contract
                  // and lands at 2.3–3.0:1 on the darker era palettes. Now
                  // that the chips are always on screen (rather than hidden
                  // behind a disclosure, where the failure went unseen), the
                  // unselected label uses --era-ink, which every era theme
                  // guarantees against its own background; the tag hue stays
                  // as the identity cue on the border + icon, lifted toward
                  // the ink so it also reads on the dark eras.
                  const cue = `color-mix(in srgb, ${color} 70%, var(--era-ink))`;
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(tag)}
                      className="inline-flex min-h-6 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                      style={{
                        backgroundColor: active ? color : 'transparent',
                        borderColor: active ? color : cue,
                        color: active ? '#fff' : 'var(--era-ink)',
                      }}
                    >
                      <Icon
                        className="h-3.5 w-3.5"
                        aria-hidden
                        style={{ color: active ? '#fff' : cue }}
                      />
                      {TAG_META[tag].label}
                    </button>
                  );
                })}
                {activeTags.size > 0 && (
                  <button
                    type="button"
                    onClick={clearTags}
                    className="era-btn-ghost inline-flex min-h-6 items-center rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
              />
            ) : (
              <MomentCard
                key={entry.item.id}
                item={entry.item}
                tier={tiers.get(entry.item.id) ?? 'text'}
                onOpen={() => openItem(entry.item.id)}
              />
            ),
          )}
        </ol>
        {feedEntries.length === 0 && (
          <p className="py-16 text-center text-sm text-[color:var(--era-ink-soft)]">
            No moments match that filter in this era.
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
 * Lightweight timeline entry for a music video duplicated in from
 * musicVideosForEra (issue #439 part 2). Deliberately thinner than
 * MomentCard's tiers — director/symbolism/easter-egg depth stays in the
 * EraVideos rail card below; this is just the date, title, and the same
 * click-to-play facade (MomentVideo) used everywhere else a video embeds.
 */
function VideoMomentCard({ video, eraId }: { video: TimelineVideo; eraId: Era['id'] }) {
  // Full width regardless of tier: this card carries a 16/9 YouTube facade,
  // which is unreadable squeezed into a half-width track.
  //
  // NB: this comment lives OUTSIDE the tag on purpose. A `//` comment in JSX
  // attribute position parses under tsc but is a hard syntax error in Next's
  // SWC parser, so it passes typecheck and tests and then fails only in the
  // browser as a blank page (2026-07-21).
  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      data-ll-item={`era-video-${video.slug}`}
      data-ll-era={eraId}
      data-ll-date={new Date(video.releasedOn).getTime()}
    >
      <div className="era-card block w-full rounded-2xl border p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {formatMonthYear(video.releasedOn)}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[color:var(--era-accent)]">
            <Clapperboard className="h-3.5 w-3.5" />
            Music video
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
        {video.youtubeId && (
          <MomentVideo
            video={{ youtubeId: video.youtubeId, title: video.title }}
            caption={null}
            className="mt-4"
          />
        )}
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

function MomentCard({
  item,
  tier,
  onOpen,
}: {
  item: ContentItem;
  tier: CardTier;
  onOpen: () => void;
}) {
  const { progress } = useProgress();
  const seen = progress.moments.has(item.id);
  const hero = hasRealPrimaryImage(item) ? primaryImageRef(item) : undefined;

  // `min-w-0` is required on every grid item: a grid child defaults to
  // `min-width: auto`, which lets a long unbroken title push the track wider
  // than its share of the container and scroll the whole page sideways.
  // #1017 makes "the page body must never scroll horizontally" a hard
  // requirement, and this is the line that holds it.
  const listItemProps = {
    className: cn('relative min-w-0 scroll-mt-28', TIER_SPAN[tier]),
    'data-ll-item': item.id,
    'data-ll-era': item.eraId,
    'data-ll-date': new Date(item.date).getTime(),
  } as const;

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
      <li {...listItemProps}>
        <button
          onClick={onOpen}
          className="era-card group block w-full overflow-hidden rounded-2xl border text-left transition"
        >
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
      </li>
    );
  }

  // DENSE ROW — routine, day-to-day items. Tight, subordinate, small
  // thumbnail if there's a real one. Several of these packed together make
  // the next full card read as an event by contrast.
  if (tier === 'chip') {
    return (
      <li {...listItemProps}>
        <button
          onClick={onOpen}
          className="era-card group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition"
        >
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
      </li>
    );
  }

  // BREATHER — deliberately no image (either none exists, or this card was
  // chosen to break up a run of image cards), but typographically chosen,
  // not a degraded fallback: bigger date, more air, a left accent rule.
  if (tier === 'text') {
    return (
      <li {...listItemProps}>
        <button
          onClick={onOpen}
          className="era-card group block w-full rounded-2xl border-l-4 py-4 pl-5 pr-5 text-left transition"
          style={{ borderLeftColor: 'var(--era-accent)' }}
        >
          <MomentMeta item={item} seen={seen} />
          <h3 className="mt-2 break-words font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
            {item.title}
          </h3>
          <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {item.summary}
          </p>
          <TagRow tags={item.tags} />
        </button>
      </li>
    );
  }

  // WORKHORSE (media) — the default: contained image + text, at half the
  // hero's width so the hero reads as the event and this reads as the beat.
  return (
    <li {...listItemProps}>
      <button
        onClick={onOpen}
        className="era-card group block w-full overflow-hidden rounded-2xl border text-left transition"
      >
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
    </li>
  );
}
