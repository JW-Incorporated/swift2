'use client';

import { useState } from 'react';
import type { ReRecord } from '@/lib/longlive/types';

const CHART_START = 2019;
const CHART_END = 2026;
const TOTAL_SPAN = CHART_END - CHART_START;

function yearToPercent(year: number) {
  return ((year - CHART_START) / TOTAL_SPAN) * 100;
}

/** Converts a date string like "May 30, 2025" into a fractional year (2025.41). */
function dateToFrac(dateStr: string) {
  const d = new Date(dateStr);
  const yearStart = new Date(d.getFullYear(), 0, 1).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const dayOfYear = (d.getTime() - yearStart) / dayMs;
  return d.getFullYear() + dayOfYear / 365;
}

/**
 * The anchor visual for the Taylor's Version thread: a Gantt-style chart of
 * all 6 albums, 2019 to today. Each row has three zones — disputed (dark
 * rust), TV-exists-but-original-still-held (hatched), and owned (green) —
 * with the May 30, 2025 Shamrock buyback rendered as a single climactic
 * vertical line where every bar turns green at once. Re-record dates get
 * their own milestone pin, independent of the ownership axis.
 */
export function OwnershipTimeline({
  albums,
  disputeYear = 2019,
  buybackDate = 'May 30, 2025',
  todayYear = 2026,
}: {
  albums: ReRecord[];
  disputeYear?: number;
  /** Date Taylor bought all six masters back from Shamrock Capital. */
  buybackDate?: string;
  todayYear?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const buybackFrac = dateToFrac(buybackDate);
  const tickYears = Array.from({ length: CHART_END - CHART_START + 1 }, (_, i) => CHART_START + i);

  // Post-buyback, every album's original master is hers. The album-by-album
  // journey that remains is *re-recording* (freeing the vault), not ownership.
  const owned = albums.length;
  const reRecorded = albums.filter((a) => a.reclaimedYear !== null).length;
  const awaitingTV = albums.filter((a) => a.reclaimedYear === null).length;
  const vaultTotal = albums.reduce((s, a) => s + a.vaultTracks, 0);

  return (
    <section aria-label="Masters ownership timeline" style={{ color: 'var(--era-ink)' }}>
      {/* Summary bar */}
      <div
        className="mb-6 grid grid-cols-3 gap-px"
        style={{ border: '1px solid var(--era-line)', borderRadius: '0.5rem', overflow: 'hidden' }}
      >
        {[
          { label: 'Masters owned', value: `${owned} / ${albums.length}`, accent: 'var(--status-reclaimed-ink)' },
          { label: 'Vault tracks freed', value: vaultTotal, accent: 'var(--era-accent)' },
          { label: "Awaiting Taylor's Version", value: awaitingTV, accent: 'var(--status-pending-ink)' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="flex flex-col gap-1 px-4 py-3" style={{ backgroundColor: 'var(--era-surface)' }}>
            <span className="text-2xl font-bold leading-none tabular-nums" style={{ color: accent }}>
              {value}
            </span>
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart header + legend */}
      <div
        className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
        style={{ borderBottom: '1px solid var(--era-line)', paddingBottom: '0.5rem' }}
      >
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
          Original masters — 2019 to today
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {[
            { color: 'var(--status-disputed)', ink: 'var(--status-disputed-ink)', label: 'Disputed', hatched: false },
            { color: 'var(--status-disputed)', ink: 'var(--status-disputed-ink)', label: 'TV exists, originals still held', hatched: true },
            { color: 'var(--status-reclaimed)', ink: 'var(--status-reclaimed-ink)', label: 'Owned', hatched: false },
          ].map(({ color, ink, label, hatched }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: color,
                  border: `1px solid ${ink}`,
                  backgroundImage: hatched
                    ? 'repeating-linear-gradient(45deg, transparent, transparent 1.5px, rgba(240,236,227,0.35) 1.5px, rgba(240,236,227,0.35) 3px)'
                    : undefined,
                }}
              />
              <span className="text-xs" style={{ color: 'var(--era-ink-soft)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt chart */}
      <div className="relative">
        <div className="relative mb-1 h-5" aria-hidden>
          {tickYears.map((yr) => (
            <span
              key={yr}
              className="absolute text-xs tabular-nums"
              style={{ left: `${yearToPercent(yr)}%`, transform: 'translateX(-50%)', color: 'var(--era-ink-soft)', fontSize: '0.6875rem' }}
            >
              {yr}
            </span>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {tickYears.map((yr) => (
            <div
              key={yr}
              className="absolute bottom-0 top-0 w-px"
              style={{ left: `${yearToPercent(yr)}%`, backgroundColor: 'var(--era-line)', opacity: yr === disputeYear ? 1 : 0.4 }}
            />
          ))}
        </div>

        {/* The buyback line — the climax: all masters reclaimed at once */}
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: `${yearToPercent(buybackFrac)}%`,
            top: '1.5rem',
            bottom: '1.5rem',
            width: '2px',
            backgroundColor: 'var(--status-reclaimed-ink)',
            boxShadow: '0 0 8px var(--status-reclaimed-ink)',
          }}
          aria-hidden
        />

        <div className="flex flex-col gap-2 pb-2 pt-1">
          {albums.map((album) => {
            const isHovered = hovered === album.id;
            const reRecordFrac = album.reclaimedDate !== null ? dateToFrac(album.reclaimedDate) : null;

            const solidDisputeEnd = reRecordFrac ?? buybackFrac;
            const solidWidth = yearToPercent(solidDisputeEnd) - yearToPercent(CHART_START);
            const hatchedWidth = reRecordFrac !== null ? yearToPercent(buybackFrac) - yearToPercent(reRecordFrac) : 0;
            const ownedWidth = yearToPercent(todayYear) - yearToPercent(buybackFrac);
            const reRecordPct = reRecordFrac !== null ? yearToPercent(reRecordFrac) : null;

            return (
              <div
                key={album.id}
                className="relative flex items-center gap-3"
                onMouseEnter={() => setHovered(album.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(album.id)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
              >
                <div className="shrink-0 text-right" style={{ width: 'clamp(80px, 15%, 120px)' }}>
                  <span
                    className="block text-xs font-medium leading-tight"
                    style={{ color: isHovered ? 'var(--era-accent)' : 'var(--era-ink)', transition: 'color 0.15s' }}
                  >
                    {album.album}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--era-ink-soft)' }}>
                    {album.originalYear}
                  </span>
                </div>

                <div className="relative h-7 flex-1 overflow-hidden rounded" style={{ backgroundColor: 'var(--era-surface)' }}>
                  <div className="absolute left-0 top-0 h-full" style={{ width: `${solidWidth}%`, backgroundColor: 'var(--status-disputed)' }} />

                  {reRecordPct !== null && (
                    <div
                      className="absolute top-0 h-full"
                      style={{
                        left: `${reRecordPct}%`,
                        width: `${hatchedWidth}%`,
                        backgroundColor: 'var(--status-disputed)',
                        backgroundImage:
                          'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(240,236,227,0.28) 3px, rgba(240,236,227,0.28) 6px)',
                      }}
                    />
                  )}

                  <div
                    className="absolute top-0 h-full"
                    style={{ left: `${yearToPercent(buybackFrac)}%`, width: `${ownedWidth}%`, backgroundColor: 'var(--status-reclaimed)' }}
                  />

                  {reRecordPct !== null && (
                    <div
                      className="absolute bottom-0 top-0 z-10 w-0.5"
                      style={{ left: `${reRecordPct}%`, backgroundColor: album.color, boxShadow: `0 0 6px ${album.color}` }}
                      aria-label={`${album.album} (Taylor's Version) released ${album.reclaimedDate}`}
                    />
                  )}

                  {isHovered && (
                    <div className="absolute inset-0 z-20 flex items-center px-2" style={{ pointerEvents: 'none' }}>
                      {album.reclaimedYear ? (
                        <span className="text-xs font-semibold" style={{ color: album.color }}>
                          TV released {album.reclaimedDate} · {album.vaultTracks} vault tracks
                        </span>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: 'var(--status-pending-ink)' }}>
                          Owned since {buybackDate} · Taylor&apos;s Version still to come
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-28 shrink-0 text-right">
                  {album.reclaimedYear !== null ? (
                    <span
                      className="era-chip whitespace-nowrap"
                      style={{ backgroundColor: 'var(--status-reclaimed)', color: 'var(--status-reclaimed-ink)', borderColor: 'var(--status-reclaimed-ink)', opacity: 0.9 }}
                    >
                      Re-recorded
                    </span>
                  ) : (
                    <span
                      className="era-chip whitespace-nowrap"
                      style={{ backgroundColor: 'var(--status-pending)', color: 'var(--status-pending-ink)', borderColor: 'var(--status-pending-ink)', opacity: 0.9 }}
                    >
                      Owned · TV soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-1 h-8" style={{ borderTop: '1px solid var(--era-line)', paddingTop: '0.5rem' }}>
          <div className="absolute" style={{ left: `${yearToPercent(2019)}%` }}>
            <span className="text-xs italic" style={{ color: 'var(--era-ink-soft)', whiteSpace: 'nowrap' }}>
              Big Machine sold to Ithaca Holdings — Jun 2019
            </span>
          </div>
          <div className="absolute text-right" style={{ right: 0, left: `${yearToPercent(buybackFrac)}%`, transform: 'translateX(-100%)' }}>
            <span className="text-xs font-semibold italic" style={{ color: 'var(--status-reclaimed-ink)', whiteSpace: 'nowrap' }}>
              Bought back all six masters — {buybackDate}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
