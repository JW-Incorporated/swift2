'use client';

import { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { RERECORDS } from '@swift2/experience';
import type { ReRecord } from '@swift2/experience';
import { OwnershipTimeline } from './OwnershipTimeline';
import { AlbumNarrativeCard } from './AlbumNarrativeCard';
import { BuybackBeat } from './BuybackBeat';

/**
 * The Taylor's Version thread: how she took her life's work back. Anchored by
 * an ownership-timeline Gantt chart (the thread's own temporal axis — no
 * career scrubber here, see docs/threads-rework-2026-07-10.md), a climactic
 * beat on the May 2025 buyback, then per-album narrative cards.
 */
export function TaylorsVersionThread({ albums = RERECORDS }: { albums?: ReRecord[] }) {
  const [sortOrder, setSortOrder] = useState<'chronological' | 'reclaimed'>('chronological');

  const sorted = [...albums].sort((a, b) => {
    if (sortOrder === 'reclaimed') {
      if (a.reclaimedYear && !b.reclaimedYear) return -1;
      if (!a.reclaimedYear && b.reclaimedYear) return 1;
      return (a.reclaimedYear ?? 9999) - (b.reclaimedYear ?? 9999);
    }
    return a.originalYear - b.originalYear;
  });

  const reRecordedCount = albums.filter((a) => a.reclaimedYear !== null).length;
  const ownedCount = albums.length; // all six, since the May 2025 buyback

  return (
    <div>
      <header className="mb-10 md:mb-14">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="era-chip"
            style={{ backgroundColor: 'var(--status-reclaimed)', color: 'var(--status-reclaimed-ink)', borderColor: 'var(--status-reclaimed-ink)' }}
          >
            {ownedCount} of 6 owned
          </span>
          <span
            className="era-chip"
            style={{ backgroundColor: 'var(--status-pending)', color: 'var(--status-pending-ink)', borderColor: 'var(--status-pending-ink)' }}
          >
            {reRecordedCount} of 6 re-recorded
          </span>
        </div>

        <p className="max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: 'var(--era-ink-soft)' }}>
          For six years she couldn&apos;t buy the originals, so she rebuilt them herself — then in May 2025 she bought all six masters outright.
          This is the campaign that made that possible, and the two re-records still to come.
        </p>

        <div className="mt-6 flex items-center gap-3" style={{ borderTop: '1px solid var(--era-line)', paddingTop: '1.25rem' }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--era-surface-2)', border: '1px solid var(--era-line)' }}>
            {ownedCount === 6 ? <Unlock size={14} style={{ color: 'var(--status-reclaimed-ink)' }} /> : <Lock size={14} style={{ color: 'var(--era-ink-soft)' }} />}
          </div>
          <p className="text-sm" style={{ color: 'var(--era-ink-soft)' }}>
            Covers the 6 studio albums sold with Big Machine Records in 2019, all bought back from Shamrock Capital in May 2025. folklore,
            evermore, Midnights, and TTPD were released on Republic Records and were never part of the dispute.
          </p>
        </div>
      </header>

      <section className="era-card mb-10 p-4 md:p-6" aria-labelledby="ownership-heading">
        <h2 id="ownership-heading" className="mb-5 text-xs uppercase tracking-widest" style={{ color: 'var(--era-accent)' }}>
          Who owned the masters · 2019 — present
        </h2>
        <OwnershipTimeline albums={albums} />
      </section>

      <BuybackBeat />

      <section aria-labelledby="albums-heading">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="albums-heading" className="text-xs uppercase tracking-widest" style={{ color: 'var(--era-accent)' }}>
            The albums
          </h2>

          <div
            className="flex items-center gap-1 rounded p-0.5"
            style={{ backgroundColor: 'var(--era-surface)', border: '1px solid var(--era-line)' }}
            role="group"
            aria-label="Sort albums"
          >
            {(['chronological', 'reclaimed'] as const).map((val) => (
              <button
                key={val}
                onClick={() => setSortOrder(val)}
                className="rounded px-3 py-1 text-xs transition-colors"
                style={{
                  backgroundColor: sortOrder === val ? 'var(--era-surface-2)' : 'transparent',
                  color: sortOrder === val ? 'var(--era-ink)' : 'var(--era-ink-soft)',
                  border: sortOrder === val ? '1px solid var(--era-line)' : '1px solid transparent',
                }}
                aria-pressed={sortOrder === val}
              >
                {val === 'chronological' ? 'Original order' : 'By TV date'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {sorted.map((album, i) => (
            <AlbumNarrativeCard key={album.id} album={album} index={i} />
          ))}
        </div>
      </section>

      <footer className="mt-10 pt-5 text-xs leading-relaxed" style={{ borderTop: '1px solid var(--era-line)', color: 'var(--era-ink-soft)' }}>
        Data sourced from public release announcements and Billboard chart records. All six original masters were reacquired from Shamrock Capital
        on May 30, 2025; albums without a released Taylor&apos;s Version are marked &ldquo;owned · TV soon.&rdquo;
      </footer>
    </div>
  );
}
