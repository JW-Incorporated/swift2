'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { contentForEra } from '@/lib/longlive/content';
import { ALL_TAGS, TAG_META } from '@/lib/longlive/tags';
import type { ContentItem, ContentTag } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';

export function EraMode() {
  const { eraId } = useAppState();
  const { openItem, setSelectorOpen } = useAppActions();
  const era = getEra(eraId);
  const [activeTags, setActiveTags] = useState<Set<ContentTag>>(new Set());

  const items = useMemo(() => contentForEra(eraId), [eraId]);
  const visible = useMemo(() => {
    if (activeTags.size === 0) return items;
    return items.filter((it) => it.tags.some((t) => activeTags.has(t)));
  }, [items, activeTags]);

  function toggleTag(tag: ContentTag) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  // Which tags actually appear in this era (others are dimmed/disabled).
  const presentTags = useMemo(() => {
    const s = new Set<ContentTag>();
    items.forEach((it) => it.tags.forEach((t) => s.add(t)));
    return s;
  }, [items]);

  return (
    <div key={eraId} className="era-enter">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={era.image || '/placeholder.svg'}
            alt=""
            fill
            priority
            className="object-cover opacity-40"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 55%, transparent) 0%, var(--era-bg) 92%)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-16 text-center sm:pt-24">
          <button
            onClick={() => setSelectorOpen(true)}
            className="era-chip mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]"
          >
            {era.isCurrent ? 'Current era' : era.yearLabel}
          </button>

          <h1 className="font-[family-name:var(--era-font)] text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            {era.name}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)] sm:text-lg">
            {era.intro}
          </p>

          <button
            onClick={() => setSelectorOpen(true)}
            className="era-btn-ghost mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Jump to another era
          </button>
        </div>
      </section>

      {/* Filter rail */}
      <div className="sticky top-[57px] z-20 border-y border-[color:var(--era-line)] bg-[color:var(--era-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto px-5 py-3 md:pr-16">
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
                style={
                  active
                    ? { backgroundColor: `hsl(${TAG_META[tag].hue})` }
                    : undefined
                }
              >
                {TAG_META[tag].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chronological feed */}
      <section className="mx-auto max-w-3xl px-5 py-10 md:pr-16">
        <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-[color:var(--era-line)]">
          {visible.map((item) => (
            <MomentCard key={item.id} item={item} onOpen={() => openItem(item.id)} />
          ))}
        </ol>
        {visible.length === 0 && (
          <p className="py-16 text-center text-sm text-[color:var(--era-ink-soft)]">
            No moments match that filter in this era.
          </p>
        )}
      </section>
    </div>
  );
}

function MomentCard({ item, onOpen }: { item: ContentItem; onOpen: () => void }) {
  const hasClue = Boolean(item.hiddenClue);
  return (
    <li
      className="relative scroll-mt-28 pl-8"
      data-ll-item={item.id}
      data-ll-date={new Date(item.date).getTime()}
    >
      <span
        className="absolute left-0 top-2.5 h-3.5 w-3.5 rounded-full border-2"
        style={{
          borderColor: 'var(--era-accent)',
          backgroundColor: 'var(--era-bg)',
        }}
        aria-hidden
      />
      <button
        onClick={onOpen}
        className="era-card group block w-full rounded-2xl border p-5 text-left transition"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {item.dateLabel}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)] transition group-hover:text-[color:var(--era-accent)]" />
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
              style={{
                backgroundColor: `hsl(${TAG_META[t].hue} / 0.16)`,
                color: `hsl(${TAG_META[t].hue})`,
              }}
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
