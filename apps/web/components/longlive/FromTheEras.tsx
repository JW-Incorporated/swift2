'use client';

import Image from 'next/image';
import { ArrowRight, Compass } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { primaryImage, type ContentItem } from '@/lib/longlive/types';

// Hotlinked photo URLs bypass Next's image optimizer (whose remotePatterns
// allowlist covers only YouTube posters) — same pattern as MomentDetail.
const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

/**
 * The Thread -> Eras cross-link (issue #436). One shared, reusable card —
 * not a bespoke one per thread — that takes an already-resolved list of era
 * ContentItems (see `contentForThreadInRange`/`contentForThreadInEra` in
 * lib/longlive/threads.ts) and renders them as real, working links back into
 * the era they belong to via `openItem` (same navigation MomentDetail and
 * search already use, so this adds zero new navigation surface). Renders
 * nothing when `items` is empty — resolution is best-effort, so a thread
 * entry with no overlapping era content simply shows no section, never a
 * dead or empty-looking one.
 */
export function FromTheEras({
  items,
  heading = 'From the Eras',
  limit = 8,
}: {
  items: ContentItem[];
  heading?: string;
  limit?: number;
}) {
  const { openItem } = useAppActions();
  if (items.length === 0) return null;
  const shown = items.slice(0, limit);

  return (
    <section>
      <h3
        className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--era-ink-soft)' }}
      >
        <Compass size={13} />
        {heading}
      </h3>
      <div className="flex flex-col gap-1.5">
        {shown.map((item) => {
          const era = getEra(item.eraId);
          const img = primaryImage(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openItem(item.id)}
              className="era-card-2 flex items-center gap-3 p-2 text-left transition hover:border-[color:var(--era-accent)]"
              aria-label={`Open “${item.title}” (${era.shortName}, ${item.dateLabel})`}
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <Image src={img} alt="" fill unoptimized={isRemoteUrl(img)} className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium" style={{ color: 'var(--era-ink)' }}>
                  {item.title}
                </span>
                <span className="block truncate text-xs" style={{ color: 'var(--era-ink-soft)' }}>
                  {era.shortName} · {item.dateLabel}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'var(--era-ink-soft)' }} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
