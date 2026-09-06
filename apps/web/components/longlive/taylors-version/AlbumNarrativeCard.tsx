'use client';

import { useState } from 'react';
import { ChevronDown, Vault, Disc3, Calendar } from 'lucide-react';
import type { ReRecord } from '@swift2/experience';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { SpotifyCompare } from './SpotifyCompare';

/**
 * Per-album accordion: a collapsed stat row (name, status chip, vault count,
 * TV date) that expands into the editorial — the dispute context, why this
 * album/why then, the vault standout, fan reaction, and a Spotify compare.
 */
export function AlbumNarrativeCard({ album, index }: { album: ReRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = album.reclaimedYear === null;

  // Let the mobile back-swipe gesture collapse an expanded album instead of
  // leaving the app — same pattern as the app's other overlays. Cards can
  // stack (multiple expanded at once); useBackDismiss's shared stack
  // collapses the most-recently-expanded one first.
  useBackDismiss(expanded, () => setExpanded(false));

  return (
    <article className="era-card overflow-hidden" style={{ borderLeft: `3px solid ${isPending ? 'var(--status-pending-ink)' : album.color}` }}>
      <button className="w-full text-left" onClick={() => setExpanded((x) => !x)} aria-expanded={expanded} aria-controls={`narrative-${album.id}`}>
        <div className="flex items-start gap-4 p-4">
          <span className="mt-0.5 shrink-0 text-3xl font-bold leading-none tabular-nums" style={{ color: 'var(--era-ink-soft)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight" style={{ color: 'var(--era-ink)' }}>
                {album.album}
              </h3>
              {!isPending ? (
                <span
                  className="era-chip"
                  style={{ backgroundColor: 'var(--status-reclaimed)', color: 'var(--status-reclaimed-ink)', borderColor: 'var(--status-reclaimed-ink)' }}
                >
                  Taylor&apos;s Version
                </span>
              ) : (
                <span
                  className="era-chip"
                  style={{ backgroundColor: 'var(--status-pending)', color: 'var(--status-pending-ink)', borderColor: 'var(--status-pending-ink)' }}
                >
                  Awaited
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
              {album.note}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 text-right" aria-hidden>
            <div className="flex items-center gap-1.5">
              <Vault size={12} style={{ color: 'var(--era-accent)' }} />
              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--era-accent)' }}>
                {isPending ? '?' : album.vaultTracks}
              </span>
              <span className="text-xs" style={{ color: 'var(--era-ink-soft)' }}>
                vault
              </span>
            </div>
            {album.reclaimedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={12} style={{ color: 'var(--era-ink-soft)' }} />
                <span className="text-xs tabular-nums" style={{ color: 'var(--era-ink-soft)' }}>
                  {album.reclaimedDate}
                </span>
              </div>
            )}
            <ChevronDown
              size={16}
              style={{ color: 'var(--era-ink-soft)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', marginTop: '0.25rem' }}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div id={`narrative-${album.id}`} className="px-4 pb-5" style={{ borderTop: '1px solid var(--era-line)' }}>
          <div className="grid gap-4 pt-4 md:grid-cols-3">
            <div className="flex flex-col gap-4 md:col-span-2">
              <div>
                <h4 className="mb-2 text-xs uppercase tracking-widest" style={{ color: 'var(--era-accent)' }}>
                  The dispute
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
                  {album.context}
                </p>
              </div>
              {album.whyNow && (
                <div>
                  <h4 className="mb-2 text-xs uppercase tracking-widest" style={{ color: 'var(--era-accent)' }}>
                    Why this album, why then
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
                    {album.whyNow}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {album.vaultHighlight && (
                <div className="era-card-2 p-3" style={{ borderLeft: `2px solid ${album.color}` }}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Disc3 size={12} style={{ color: album.color }} />
                    <span className="text-xs uppercase tracking-widest" style={{ color: album.color }}>
                      Vault standout
                    </span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--era-ink)' }}>
                    {album.vaultHighlight}
                  </p>
                </div>
              )}

              <div className="era-card-2 p-3">
                <h4 className="mb-1.5 text-xs uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
                  Fan reception
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
                  {album.fanReaction}
                </p>
              </div>

              {!isPending && (
                <div className="flex items-center justify-between rounded px-3 py-2" style={{ backgroundColor: 'var(--status-reclaimed)', border: '1px solid var(--status-reclaimed-ink)' }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--status-reclaimed-ink)' }}>
                    Vault tracks
                  </span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--status-reclaimed-ink)' }}>
                    {album.vaultTracks}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--era-line)' }}>
            <SpotifyCompare spotify={album.spotify} albumName={album.album} isPending={isPending} />
          </div>
        </div>
      )}
    </article>
  );
}
