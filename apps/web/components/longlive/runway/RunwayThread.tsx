'use client';

import Image from 'next/image';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import { RUNWAY_LOOKS } from '@/lib/longlive/lenses';
import { contentForThreadInEra } from '@/lib/longlive/threads';
import { FromTheEras } from '../FromTheEras';

// Hotlinked photo URLs bypass Next's image optimizer (whose remotePatterns
// allowlist covers only YouTube posters) — same pattern as MomentDetail.
const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

/**
 * The Runway thread: one re-themed "room" per era, each opening on a
 * full-width feature photo and fanning out into a small real-photo gallery —
 * the fix for the old one-placeholder-photo-per-era version. No lightbox,
 * motif trail, or cross-thread weave yet (v0's ranked next steps) — this
 * pass is the highest-priority one alone: real, credited photos replacing
 * placeholders. Keeps the shared career scrubber (unlike the tight-arc
 * threads) since this genuinely spans all 12 eras.
 */
export function RunwayThread() {
  return (
    <div className="space-y-10 pt-8">
      {/* RUNWAY_LOOKS is authored oldest-first for readability; render newest-first
          to match the site-wide convention (top = now) and the adjacent scrubber.
          Copy before reversing — never mutate the exported array. (#433) */}
      {[...RUNWAY_LOOKS].reverse().map((look) => {
        const era = getEra(look.eraId);
        const [feature, ...rest] = look.images;
        // Auto-derived Era cross-links (issue #436): fashion-tagged content
        // from this same era — not hand-authored per look.
        const eraLinks = contentForThreadInEra('fashion', look.eraId);
        return (
          <div
            key={look.id}
            data-ll-item
            data-ll-date={new Date(era.start).getTime()}
            className="scroll-mt-28"
          >
            <section
              style={eraStyle(era)}
              className="era-card overflow-hidden rounded-3xl border bg-[color:var(--era-bg)] text-[color:var(--era-ink)]"
            >
              <div className="p-5 pb-0 sm:p-7 sm:pb-0">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest"
                  style={{ backgroundColor: `color-mix(in srgb, ${era.theme.accent} 14%, transparent)`, color: era.theme.accent }}
                >
                  {era.shortName} · {era.yearLabel}
                </div>
                <h3 className="mt-2 font-[family-name:var(--era-font)] text-2xl font-semibold sm:text-3xl">
                  {look.name}
                </h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                  {look.description}
                </p>
              </div>

              {feature && (
                <figure className="mt-5">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={feature.url}
                      alt={feature.caption ?? look.name}
                      fill
                      unoptimized={isRemoteUrl(feature.url)}
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-20"
                      style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--era-bg) 85%, transparent), transparent)' }}
                      aria-hidden
                    />
                  </div>
                  {feature.caption && (
                    <figcaption className="px-5 py-2.5 text-xs leading-relaxed text-[color:var(--era-ink-soft)] sm:px-7">
                      {feature.caption}
                      {feature.credit && <span> · {feature.credit}</span>}
                    </figcaption>
                  )}
                </figure>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 px-5 pb-5 sm:gap-3 sm:px-7 sm:pb-7">
                  {rest.map((img, i) => (
                    <figure key={i}>
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
                        <Image
                          src={img.url}
                          alt={img.caption ?? look.name}
                          fill
                          unoptimized={isRemoteUrl(img.url)}
                          className="object-cover"
                        />
                      </div>
                      {img.caption && (
                        <figcaption className="mt-1.5 text-[11px] leading-snug text-[color:var(--era-ink-soft)]">
                          {img.caption}
                          {img.credit && <span> · {img.credit}</span>}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 px-5 pb-5 pt-1 sm:px-7 sm:pb-7">
                {look.shopTags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[11px] text-[color:var(--era-ink-soft)]"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {eraLinks.length > 0 && (
                <div className="px-5 pb-5 sm:px-7">
                  <FromTheEras items={eraLinks} />
                </div>
              )}
            </section>
          </div>
        );
      })}
    </div>
  );
}
