'use client';

import { useEffect } from 'react';
import { X, Heart, Star, Music, BookText } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { durationLabel, monthsBetween, soloLeadIn, type LoveStoryEntry } from '@/lib/longlive/love-story';
import { contentForThreadInRange } from '@/lib/longlive/threads';
import { songTargetOf, trackKey } from '@/lib/longlive/tracks';
import { FromTheEras } from '../FromTheEras';

function fmtYear(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

function entryColor(entry: LoveStoryEntry): string {
  return entry.kind === 'relationship' ? getEra(entry.eraIds[0]).theme.accent : 'var(--era-ink-soft)';
}

/**
 * The expanded detail view for a timeline entry — relationship or solo
 * period. Only real content is shown: no TODO placeholders. Sections with no
 * data (impact, theories, photos, era cross-links) are simply omitted for
 * now, tracked as follow-up in docs/threads-rework-2026-07-10.md rather than
 * shown as an unfinished-looking gap in a shipped page.
 */
export function EntryDetail({ entry, timeline, onClose }: { entry: LoveStoryEntry; timeline: LoveStoryEntry[]; onClose: () => void }) {
  const { share, trackGuideEraId } = useAppState();
  const { openSong } = useAppActions();

  // Escape collapses the expanded entry (#525), matching its X. Only mounted
  // while an entry is expanded, so the listener exists only then; higher
  // overlays own Escape while they are open on top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share && !trackGuideEraId) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [share, trackGuideEraId, onClose]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    for (const song of entry.songs ?? []) {
      if (!song.relatedId) {
        console.warn(`Love Story entry "${entry.id}" has no track-guide link for "${song.title}"`);
      } else if (!songTargetOf(song.relatedId)) {
        console.error(`Love Story entry "${entry.id}" has an unresolved song link: ${song.relatedId}`);
      }
    }
  }, [entry]);

  const isRel = entry.kind === 'relationship';
  const color = entryColor(entry);
  // Only relationships carry a portrait, and only when the subject is a public
  // figure. Most are CC BY-SA, so the credit line below is a licence condition,
  // not a nicety.
  const portrait = entry.kind === 'relationship' ? entry.image : undefined;
  // Auto-derived Era cross-links (issue #436): everything tagged into the
  // Love Story thread whose date falls inside this entry's own window — not
  // hand-authored per relationship/solo period.
  const eraLinks = contentForThreadInRange('love-story', entry.start, entry.end);

  return (
    <div className="era-card relative mt-3 overflow-hidden" style={{ borderLeftWidth: '3px', borderLeftColor: color }}>
      <div className="p-4 pb-3">
        <button onClick={onClose} className="era-icon-btn absolute right-3 top-3 rounded-full" aria-label="Close">
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-12">
          {/* A portrait when we have one, the heart glyph otherwise. Wyatt,
              2026-07-22: "when I click on a relationship, it should have a
              picture of the guy." Not every entry gets one — a solo period has
              no subject, and one relationship is deliberately left without a
              photo because he is not a public figure in his own right. */}
          {portrait ? (
            <img
              src={portrait.url}
              alt={portrait.alt}
              loading="lazy"
              className="mt-0.5 size-11 shrink-0 rounded-full object-cover"
              style={{ boxShadow: `0 0 0 2px ${color}55` }}
            />
          ) : (
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}22` }}>
              {isRel ? <Heart size={14} style={{ color }} /> : <Star size={14} style={{ color: 'var(--era-ink-soft)' }} />}
            </div>
          )}
          <div>
            <p className="text-base font-semibold leading-tight" style={{ color: 'var(--era-ink)' }}>
              {isRel ? entry.name : 'Solo'}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--era-ink-soft)' }}>
              {fmtYear(entry.start)} – {entry.end ? fmtYear(entry.end) : 'present'} · {durationLabel(entry.start, entry.end)}
              {!isRel && ` · ${monthsBetween(entry.start, entry.end)} months solo`}
            </p>
            {/* Attribution is a LICENCE CONDITION on the CC BY-SA portraits,
                not a nicety — it has to render, not sit in the data. */}
            {portrait && (
              <p className="mt-0.5 text-[10px]" style={{ color: 'var(--era-ink-soft)' }}>
                {portrait.credit}
              </p>
            )}
          </div>
        </div>

        {entry.id === 'rel-kelce' && (
          <div className="mt-3 flex items-center gap-2 rounded px-3 py-2 text-xs font-medium" style={{ background: `${color}18`, color }}>
            <Heart size={12} className="fill-current" />
            Married July 2026 — the resolution.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4" style={{ borderTop: '1px solid var(--era-line)', paddingTop: '1rem' }}>
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
            <BookText size={13} />
            {isRel ? 'The Story' : 'Solo'}
          </h3>
          {!isRel && (
            <p className="mb-1.5 text-sm font-medium leading-relaxed" style={{ color: 'var(--era-ink)' }}>
              {soloLeadIn(entry, timeline)}
            </p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: isRel ? 'var(--era-ink)' : 'var(--era-ink-soft)' }}>
            {entry.note}
          </p>
        </section>

        {entry.songs && entry.songs.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
              <Music size={13} />
              The Songs
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.songs.map((song) => {
                const target = song.relatedId ? songTargetOf(song.relatedId) : null;
                const contents = (
                  <>
                    <Music size={10} className="shrink-0" />
                    {song.title}
                  </>
                );

                return target ? (
                  <button
                    key={song.title}
                    type="button"
                    onClick={() => openSong(target.eraId, trackKey(target.eraId, target.track))}
                    className="era-chip flex min-h-11 items-center gap-1 rounded-full px-2.5 text-xs transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
                    style={{ borderColor: `${color}55` }}
                    aria-label={`Open song: ${song.title}`}
                  >
                    {contents}
                  </button>
                ) : (
                  <span
                    key={song.title}
                    className="era-chip flex items-center gap-1 text-xs"
                    style={{ borderColor: `${color}55` }}
                  >
                    {contents}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {eraLinks.length > 0 && <FromTheEras items={eraLinks} />}

        {isRel && entry.eraIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.eraIds.map((id) => {
              const era = getEra(id);
              return (
                <span
                  key={id}
                  className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  style={{ borderColor: era.theme.accent, color: era.theme.accent, backgroundColor: `color-mix(in srgb, ${era.theme.accent} 12%, transparent)` }}
                >
                  {era.shortName}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
