'use client';

import Image from 'next/image';
import { Quote } from 'lucide-react';
import { getEra } from '@/lib/longlive/eras';
import { contentForThread } from '@/lib/longlive/threads';
import { focalPointOf, hasRealPrimaryImage, primaryImageRef } from '@/lib/longlive/types';
import type { ImageKind } from '@/lib/longlive/types';

// Same rule as MomentDetail: a stand-in image must never read as the real
// thing. 'primary' renders no badge.
const IMAGE_KIND_BADGE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference',
  archival: 'Archival',
};

// Hotlinked photo URLs bypass Next's image optimizer (whose remotePatterns
// allowlist covers only YouTube posters) — same pattern as MomentDetail.
const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

/**
 * The Proposal thread: the sourced Travis Kelce story, picture-heavy.
 *
 * DERIVED (consolidation stage 3, 2026-07-19): beats are the vault moments
 * tagged `the-proposal` (contentForThread, oldest-first) — no more parallel
 * hand-authored PROPOSAL_BEATS list, so a moment and its thread beat can
 * never tell different stories, and enriching the moment (photos, sources,
 * quotes) enriches the thread for free. Beat mapping: body ← item.summary,
 * quote ← item.pullQuote, source ← the item's first cited source, image ←
 * the real primary photo (era-art placeholders render text-only rather than
 * filling the gap with a misleading stand-in). No career scrubber: this is a
 * tight 2023-2026 arc (see docs/threads-rework-2026-07-10.md).
 */
export function ProposalThread() {
  const beats = contentForThread('the-proposal');
  return (
    <div className="pt-8">
      <div className="space-y-8">
        {beats.map((item) => {
          const era = getEra(item.eraId);
          const image = hasRealPrimaryImage(item) ? primaryImageRef(item) : undefined;
          const source = item.sources?.[0]?.name;
          return (
            <article key={item.id} className="era-card overflow-hidden rounded-2xl border">
              {image && (
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={image.url}
                    alt={image.caption ?? item.title}
                    fill
                    unoptimized={isRemoteUrl(image.url)}
                    className="object-cover"
                    style={{
                      objectPosition: focalPointOf(image),
                      ...(image.kind !== 'primary' ? { filter: 'grayscale(35%)' } : undefined),
                    }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-24"
                    style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--era-bg) 85%, transparent), transparent)' }}
                    aria-hidden
                  />
                  {image.kind !== 'primary' && (
                    <span
                      className="absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{ borderColor: 'var(--era-line)', backgroundColor: 'color-mix(in srgb, var(--era-surface) 90%, transparent)', color: 'var(--era-ink-soft)' }}
                    >
                      {IMAGE_KIND_BADGE[image.kind]}
                    </span>
                  )}
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest"
                    style={{ backgroundColor: `color-mix(in srgb, ${era.theme.accent} 14%, transparent)`, color: era.theme.accent }}
                  >
                    {era.shortName} · {item.dateLabel}
                  </span>
                  {source && (
                    <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--era-ink-soft)' }}>
                      Source: {source}
                    </span>
                  )}
                </div>

                <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
                  {item.summary}
                </p>

                {item.pullQuote && (
                  <blockquote
                    className="mt-3 flex gap-2 border-l-2 pl-3 text-[15px] italic leading-relaxed"
                    style={{ borderColor: era.theme.accent, color: 'var(--era-ink)' }}
                  >
                    <Quote className="mt-1 h-3.5 w-3.5 shrink-0" style={{ color: era.theme.accent }} />
                    <span>{item.pullQuote}</span>
                  </blockquote>
                )}

                {image?.caption && (
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
                    {image.caption}
                    {image.credit && <span> · {image.credit}</span>}
                  </p>
                )}
                {!image?.caption && image?.credit && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--era-ink-soft)' }}>
                    Photo: {image.credit}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
        Compiled from public reporting by an independent fan project. Not affiliated with or endorsed by Taylor Swift.
      </p>
    </div>
  );
}
