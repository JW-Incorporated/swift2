'use client';

import { useId, useState } from 'react';
import { ChevronDown, Radio } from 'lucide-react';
import type { CurrentItem } from '@swift2/shared';
import { outletFor, type FilterId } from '@swift2/experience';
import { useHost } from '../../host/context';
import { cn } from '../lib/utils';
import { SCRUBBER_GUTTER_CLASS } from '../shell/timelineScrubberLayout';

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function outletLabel(item: CurrentItem): string | undefined {
  const named = outletFor(item);
  if (named) return named;
  const url = item.sources[0]?.url;
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function shortDate(observedOn: string): string {
  const d = new Date(`${observedOn.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function Thumb({ item }: { item: CurrentItem }) {
  const { Image } = useHost();
  const [failed, setFailed] = useState(false);
  if (!item.imageUrl || failed) return null;
  return (
    <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg">
      <Image
        src={item.imageUrl}
        alt=""
        fill
        unoptimized={isRemoteUrl(item.imageUrl)}
        loading="lazy"
        sizes="56px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/**
 * Pinned "This week's news" (owner decision 2026-11-03): one compact row at the
 * top of the current era's feed that expands into the last 7 days of live items.
 * Rows open the existing CurrentItemDetail overlay via `onOpen`. Only shown
 * under the "All" filter (no chip active) and only when there is a story.
 */
export function ThisWeekNews({
  items,
  filters,
  onOpen,
}: {
  items: CurrentItem[];
  filters: ReadonlySet<FilterId>;
  onOpen: (item: CurrentItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  if (items.length === 0 || filters.size > 0) return null;
  const count = `${items.length} ${items.length === 1 ? 'story' : 'stories'}`;
  const toggle = () => setExpanded((v) => !v);
  const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--era-accent)]';

  return (
    <div className={`mx-auto max-w-4xl pl-4 pt-4 ${SCRUBBER_GUTTER_CLASS}`} data-testid="this-week-news">
      <div
        className="era-card rounded-2xl border-2 border-dashed"
        style={{ borderColor: 'var(--era-accent)' }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn('flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left', focusRing)}
        >
          <Radio className="h-3.5 w-3.5 shrink-0 text-[color:var(--era-accent)]" aria-hidden />
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--era-accent)]">
            This week&apos;s news
          </span>
          <span className="shrink-0 text-xs text-[color:var(--era-ink-soft)]">{count}</span>
          {!expanded && (
            <span className="hidden min-w-0 flex-1 truncate text-sm sm:block">{items[0]!.headline}</span>
          )}
          <span className={expanded ? 'flex-1' : 'flex-1 sm:hidden'} />
          <ChevronDown
            aria-hidden
            className={cn('h-4 w-4 shrink-0 transition-transform', expanded && 'rotate-180')}
          />
        </button>

        {expanded && (
          <div id={panelId}>
            <ul className="divide-y divide-[color:var(--era-ink-soft)]/20 border-t border-[color:var(--era-ink-soft)]/20">
              {items.map((item) => {
                const outlet = outletLabel(item);
                const date = shortDate(item.observedOn);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(item)}
                      className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left', focusRing)}
                    >
                      <Thumb item={item} />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-sm font-medium leading-snug">
                          {item.headline}
                        </span>
                        <span className="mt-0.5 block text-xs text-[color:var(--era-ink-soft)]">
                          {[outlet, date].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={toggle}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 border-t border-[color:var(--era-ink-soft)]/20 px-3 py-2 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]',
                focusRing,
              )}
            >
              Collapse
              <ChevronDown aria-hidden className="h-4 w-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
