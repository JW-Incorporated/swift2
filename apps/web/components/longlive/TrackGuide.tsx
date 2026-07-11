'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, ListMusic, ArrowUpRight } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { trackKey, tracksForEra } from '@/lib/longlive/tracks';
import { eraStyle } from '@/lib/longlive/theme';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import type { EraId, TrackNote } from '@/lib/longlive/types';

/**
 * The album track guide — an immersive per-era overlay (same pattern as
 * MomentDetail) listing every song with a sourced note. Data is static,
 * synced at build time from the Vault track_note seed/table
 * (lib/longlive/tracks.ts); no runtime fetch. Only songs with a real sourced
 * note exist in the data, so gaps in an album's numbering are expected.
 */
export function TrackGuide() {
  const { trackGuideEraId, share } = useAppState();
  const { closeTrackGuide } = useAppActions();

  const era = trackGuideEraId ? getEra(trackGuideEraId) : undefined;
  const tracks = trackGuideEraId ? tracksForEra(trackGuideEraId) : [];
  const open = Boolean(era && tracks.length > 0);

  // Lock body scroll while open (mirrors MomentDetail).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape — unless the share sheet is layered on top; that overlay
  // owns Escape until it closes itself.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share) closeTrackGuide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeTrackGuide, share]);

  // Let the mobile back-swipe gesture close this guide instead of leaving the app.
  useBackDismiss(open, closeTrackGuide);

  if (!era || tracks.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
      role="dialog"
      aria-modal="true"
      aria-label={`${era.album} track guide`}
    >
      {/* Compact era-art header */}
      <div className="relative h-[28vh] min-h-44 w-full">
        <Image src={era.image || '/placeholder.svg'} alt="" fill priority className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 30%, transparent), var(--era-bg))',
          }}
        />
        <button
          onClick={closeTrackGuide}
          className="era-icon-btn absolute right-4 top-4 rounded-full p-2 backdrop-blur-md"
          aria-label="Close track guide"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-10 mx-auto -mt-12 max-w-2xl px-5 pb-24">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          <ListMusic className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
          Track guide · {era.yearLabel}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {era.album}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}, each with a sourced note — the
          meaning, the background, or the Easter egg.
        </p>

        <ol className="mt-8 space-y-3">
          {tracks.map((t) => (
            <TrackRow key={`${t.trackNumber ?? 'x'}-${t.title}`} eraId={era.id} track={t} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function TrackRow({ eraId, track }: { eraId: EraId; track: TrackNote }) {
  const { openTrack } = useAppActions();
  const hasDeepDive = Boolean(track.discussion && track.discussion.length > 0);

  const body = (
    <>
      <span
        className="w-7 shrink-0 pt-0.5 text-right font-[family-name:var(--era-font)] text-lg font-semibold tabular-nums text-[color:var(--era-accent)]"
        aria-hidden
      >
        {track.trackNumber ?? '·'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
            {track.title}
          </h2>
          {hasDeepDive && (
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)]" aria-hidden />
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{track.note}</p>
        {track.sources && track.sources.length > 0 && (
          <p className="mt-2 text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
            {track.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
            {track.sources.map((s, i) => (
              <span key={`${s.url}-${i}`}>
                {i > 0 && ', '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                >
                  {s.name}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </>
  );

  if (!hasDeepDive) {
    return <li className="era-card flex gap-4 rounded-2xl border p-4 sm:p-5">{body}</li>;
  }

  return (
    <li>
      <button
        onClick={() => openTrack(trackKey(eraId, track))}
        className="era-card group flex w-full gap-4 rounded-2xl border p-4 text-left transition sm:p-5"
      >
        {body}
      </button>
    </li>
  );
}
