'use client';

import { X, Heart, Star, Music, BookText } from 'lucide-react';
import { getEra } from '@/lib/longlive/eras';
import { durationLabel, monthsBetween, soloLeadIn, type LoveStoryEntry } from '@/lib/longlive/love-story';

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
  const isRel = entry.kind === 'relationship';
  const color = entryColor(entry);

  return (
    <div className="era-card relative mt-3 overflow-hidden" style={{ borderLeftWidth: '3px', borderLeftColor: color }}>
      <div className="p-4 pb-3">
        <button onClick={onClose} className="era-btn-ghost absolute right-3 top-3 rounded p-1" aria-label="Close">
          <X size={14} style={{ color: 'var(--era-ink-soft)' }} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}22` }}>
            {isRel ? <Heart size={14} style={{ color }} /> : <Star size={14} style={{ color: 'var(--era-ink-soft)' }} />}
          </div>
          <div>
            <p className="text-base font-semibold leading-tight" style={{ color: 'var(--era-ink)' }}>
              {isRel ? entry.name : 'Solo'}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--era-ink-soft)' }}>
              {fmtYear(entry.start)} – {entry.end ? fmtYear(entry.end) : 'present'} · {durationLabel(entry.start, entry.end)}
              {!isRel && ` · ${monthsBetween(entry.start, entry.end)} months solo`}
            </p>
          </div>
        </div>

        {entry.id === 'kelce' && (
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
              {entry.songs.map((song) => (
                <span key={song} className="era-chip flex items-center gap-1 text-xs" style={{ borderColor: `${color}55` }}>
                  <Music size={10} className="shrink-0" />
                  {song}
                </span>
              ))}
            </div>
          </section>
        )}

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
