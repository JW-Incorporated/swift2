'use client';

import { KeyRound, Repeat2 } from 'lucide-react';

/**
 * The climactic narrative beat of the Taylor's Version thread: the May 30,
 * 2025 purchase of all six original masters from Shamrock Capital. Deliberately
 * not another AlbumNarrativeCard — this is the turning point the whole
 * campaign was building toward, so it gets its own treatment between the
 * ownership chart and the album-by-album list.
 */
export function BuybackBeat() {
  return (
    <section
      aria-labelledby="buyback-heading"
      className="era-card relative mb-10 overflow-hidden"
      style={{ borderColor: 'var(--status-reclaimed-ink)', backgroundColor: 'var(--era-surface)' }}
    >
      <div aria-hidden className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: 'var(--status-reclaimed-ink)' }} />

      <div className="p-5 md:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span
            className="era-chip"
            style={{ backgroundColor: 'var(--status-reclaimed)', color: 'var(--status-reclaimed-ink)', borderColor: 'var(--status-reclaimed-ink)' }}
          >
            The turning point
          </span>
          <span className="text-xs uppercase tracking-widest tabular-nums" style={{ color: 'var(--era-ink-soft)' }}>
            May 30, 2025
          </span>
        </div>

        <h2 id="buyback-heading" className="mb-3 text-balance text-2xl font-bold leading-tight tracking-tight md:text-3xl" style={{ color: 'var(--era-ink)' }}>
          She bought all six masters back — in a single stroke.
        </h2>

        <blockquote className="my-5 max-w-2xl pl-4" style={{ borderLeft: '3px solid var(--status-reclaimed-ink)' }}>
          <p className="text-pretty font-serif text-lg italic leading-relaxed md:text-xl" style={{ color: 'var(--era-ink)' }}>
            &ldquo;All of the music I&apos;ve ever made now belongs to me. All the music videos, all the concert films, the album art and photography,
            the unreleased songs, the memories, the magic, the madness. Every single era. My entire life&apos;s work.&rdquo;
          </p>
          <cite className="mt-2 block text-xs uppercase tracking-widest not-italic" style={{ color: 'var(--era-ink-soft)' }}>
            — Taylor Swift, letter to fans · May 30, 2025
          </cite>
        </blockquote>

        <p className="mb-6 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: 'var(--era-ink-soft)' }}>
          After six years of being unable to buy her own recordings, Taylor purchased her entire back catalog outright from Shamrock Capital — the
          private-equity firm that had acquired the masters from Scooter Braun in 2020. Every original recording of the first six albums, the music
          videos, album art, and unreleased material: hers. She framed it as Shamrock being the first party to offer her the music &ldquo;outright,
          with no strings attached, no partnership, with full autonomy&rdquo;; many also argue the re-recording campaign softened the ground by
          undercutting the originals&apos; market value.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="era-card-2 p-4" style={{ borderLeft: '2px solid var(--status-reclaimed-ink)' }}>
            <div className="mb-1.5 flex items-center gap-2">
              <KeyRound size={14} style={{ color: 'var(--status-reclaimed-ink)' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--status-reclaimed-ink)' }}>
                Ownership · done
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
              Won in one move. All 6 of 6 original masters are hers as of May 2025. This axis of the fight is over.
            </p>
          </div>

          <div className="era-card-2 p-4" style={{ borderLeft: '2px solid var(--status-pending-ink)' }}>
            <div className="mb-1.5 flex items-center gap-2">
              <Repeat2 size={14} style={{ color: 'var(--status-pending-ink)' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--status-pending-ink)' }}>
                Re-records · ongoing
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
              A separate story. 4 of 6 Taylor&apos;s Versions are out; the debut and reputation re-records are still unreleased — now an artistic
              choice, not a reclamation tactic.
            </p>
          </div>
        </div>

        <p className="mt-5 pt-4 text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)', borderTop: '1px solid var(--era-line)' }}>
          <span style={{ color: 'var(--era-ink)', fontWeight: 600 }}>So will the last two still happen?</span>{' '}
          Nobody has to re-record anything anymore — she owns the originals. But the vault tracks, the fan rituals, and the chance to finally close
          the loop on her own terms are reasons enough that many believe debut (Taylor&apos;s Version) and reputation (Taylor&apos;s Version) are
          still coming. The motivation just changed from taking her work back to deciding how she wants to leave it.
        </p>
      </div>
    </section>
  );
}
