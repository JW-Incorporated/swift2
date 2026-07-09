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
import type { ContentItem, ContentTag, Era, LensId } from '@/lib/longlive/types';
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
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 55%, transparent) 0%, var(--era-bg) 92%)',
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
        <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-3 md:pr-10">
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
      <div className="mx-auto max-w-4xl px-4 py-10 md:pr-10">
        <ol className="relative space-y-5">
          {visible.map((item) => (
            <MomentCard key={item.id} item={item} onOpen={() => openItem(item.id)} />
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
          <div className="mx-auto max-w-4xl px-4 py-8 md:pr-10">
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
    </section>
  );
}

const PIVOT_ICONS: Partial<Record<LensId, typeof Heart>> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'the-proposal': Gem,
};

function MomentCard({ item, onOpen }: { item: ContentItem; onOpen: () => void }) {
  const hasClue = Boolean(item.hiddenClue);
  // Visited-state (localStorage-backed). First paint is always "unseen" —
  // progress hydrates post-mount, so server and client markup match.
  const { progress } = useProgress();
  const seen = progress.moments.has(item.id);
  return (
    <li
      className="relative scroll-mt-28"
      data-ll-item={item.id}
      data-ll-era={item.eraId}
      data-ll-date={new Date(item.date).getTime()}
    >
      <button
        onClick={onOpen}
        className="era-card group block w-full rounded-2xl border p-5 text-left transition"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {item.dateLabel}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {seen && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                <Check className="h-3 w-3" aria-hidden />
                Seen
              </span>
            )}
            <ArrowUpRight className="h-4 w-4 text-[color:var(--era-ink-soft)] transition group-hover:text-[color:var(--era-accent)]" />
          </span>
        </div>

        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {item.summary}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `hsl(${TAG_META[t].hue} / 0.16)`, color: `hsl(${TAG_META[t].hue})` }}
            >
              {TAG_META[t].label}
            </span>
          ))}
          {hasClue && (
            <span className="clue-glint ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--era-accent)]">
              <Sparkles className="h-3 w-3" />
              Hidden clue
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
