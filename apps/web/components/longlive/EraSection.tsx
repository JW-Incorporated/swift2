'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowUpRight, ArrowRight, Heart, Shirt, RefreshCw, Gem, ListMusic, Check } from 'lucide-react';
import { useAppActions, useProgress } from '@/lib/longlive/store';
import { eraStyle } from '@/lib/longlive/theme';
import { contentForEra } from '@/lib/longlive/content';
import { tracksForEra } from '@/lib/longlive/tracks';
import { theoriesForEra } from '@/lib/longlive/theories';
import { threadsInEra, getThread } from '@/lib/longlive/lenses';
import { EraMedia } from './EraMedia';
import { EraVideos } from './EraVideos';
import { ALL_TAGS, TAG_META } from '@/lib/longlive/tags';
import { hasRealPrimaryImage, primaryImageRef } from '@/lib/longlive/types';
import type { ContentItem, ContentTag, Era, LensId } from '@/lib/longlive/types';
import { assignFeedTiers, type CardTier } from '@/lib/longlive/feed-tiers';
import { cn } from '@/lib/utils';

/**
 * A single era in the infinite stream. Themed locally via eraStyle so stacked
 * sections each wear their own palette, while the global chrome tracks whichever
 * section is active. Items are tagged with data-ll-era so the scrubber can
 * scope its measurements to the era currently in view.
 */
export function EraSection({ era }: { era: Era }) {
  const { openItem, setSelectorOpen, openThread, openTrackGuide, openTheoryGuide } = useAppActions();
  const [activeTags, setActiveTags] = useState<Set<ContentTag>>(new Set());
  const eraThreads = useMemo(() => threadsInEra(era.id), [era.id]);
  const trackCount = useMemo(() => tracksForEra(era.id).length, [era.id]);
  const theoryCount = useMemo(() => theoriesForEra(era.id).length, [era.id]);

  const items = useMemo(() => contentForEra(era.id), [era.id]);
  const visible = useMemo(() => {
    if (activeTags.size === 0) return items;
    return items.filter((it) => it.tags.some((t) => activeTags.has(t)));
  }, [items, activeTags]);
  // Card silhouette per item — recomputed against whatever's actually on
  // screen (so filtering doesn't reference invisible items), but a pure
  // function of that list's ids, so it's stable across re-renders.
  const tiers = useMemo(() => assignFeedTiers(visible), [visible]);

  const presentTags = useMemo(() => {
    const s = new Set<ContentTag>();
    items.forEach((it) => it.tags.forEach((t) => s.add(t)));
    return s;
  }, [items]);

  function toggleTag(tag: ContentTag) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
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
          <Image src={era.image || '/placeholder.svg'} alt="" fill priority className="object-cover opacity-40" />
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
          {(trackCount > 0 || theoryCount > 0) && (
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
            </div>
          )}
        </div>
      </div>

      {/* Filter row (non-sticky so stacked sections don't fight for the top). */}
      <div className="border-y border-[color:var(--era-line)] bg-[color:var(--era-surface)]/40">
        <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-3 md:pr-8">
          <span className="shrink-0 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            Filter
          </span>
          {ALL_TAGS.map((tag) => {
            const present = presentTags.has(tag);
            const active = activeTags.has(tag);
            return (
              <button
                key={tag}
                disabled={!present}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'border-transparent text-[color:var(--era-bg)]'
                    : 'border-[color:var(--era-line)] text-[color:var(--era-ink-soft)] hover:text-[color:var(--era-ink)]',
                  !present && 'cursor-not-allowed opacity-30',
                )}
                style={active ? { backgroundColor: `hsl(${TAG_META[tag].hue})` } : undefined}
              >
                {TAG_META[tag].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chronological feed (newest-first). */}
      <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
        <ol className="relative space-y-5">
          {visible.map((item) => (
            <MomentCard
              key={item.id}
              item={item}
              tier={tiers.get(item.id) ?? 'text'}
              onOpen={() => openItem(item.id)}
            />
          ))}
        </ol>
        {visible.length === 0 && (
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

function TagRow({ tags }: { tags: ContentTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: `hsl(${TAG_META[t].hue} / 0.16)`, color: `hsl(${TAG_META[t].hue})` }}
        >
          {TAG_META[t].label}
        </span>
      ))}
    </div>
  );
}

function MomentCard({ item, tier, onOpen }: { item: ContentItem; tier: CardTier; onOpen: () => void }) {
  const { progress } = useProgress();
  const seen = progress.moments.has(item.id);
  const hero = hasRealPrimaryImage(item) ? primaryImageRef(item) : undefined;

  const listItemProps = {
    className: 'relative scroll-mt-28',
    'data-ll-item': item.id,
    'data-ll-era': item.eraId,
    'data-ll-date': new Date(item.date).getTime(),
  } as const;

  // CHAPTER BREAK — rare (paced out in feed-tiers.ts), full-bleed image,
  // big serif title. Registers as an event specifically because it's rare.
  if (tier === 'hero' && hero) {
    return (
      <li {...listItemProps}>
        <button onClick={onOpen} className="era-card group block w-full overflow-hidden rounded-2xl border text-left transition">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(hero.url)}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
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
          <div className="p-6">
            <MomentMeta item={item} seen={seen} />
            <h3 className="mt-2 font-[family-name:var(--era-font)] text-balance text-2xl font-semibold leading-snug sm:text-3xl">
              {item.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
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
          className="era-card group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition"
        >
          {hero && (
            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={hero.url}
                alt=""
                fill
                unoptimized={/^https?:\/\//.test(hero.url)}
                className="object-cover"
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
          <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
            {item.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {item.summary}
          </p>
          <TagRow tags={item.tags} />
        </button>
      </li>
    );
  }

  // WORKHORSE (media) — the default: contained image + text.
  return (
    <li {...listItemProps}>
      <button
        onClick={onOpen}
        className="era-card group block w-full overflow-hidden rounded-2xl border text-left transition"
      >
        {hero && (
          <div className="relative aspect-[21/9] w-full overflow-hidden">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(hero.url)}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
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
        <div className="p-5">
          <MomentMeta item={item} seen={seen} />
          <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
            {item.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {item.summary}
          </p>
          <TagRow tags={item.tags} />
        </div>
      </button>
    </li>
  );
}
