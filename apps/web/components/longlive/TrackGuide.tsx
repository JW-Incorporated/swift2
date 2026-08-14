'use client';

import { useEffect } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import Image from 'next/image';
import { ListMusic, ArrowUpRight } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { tracksForEra } from '@/lib/longlive/tracks';
import { videosForEra, isPlayable, VIDEO_KIND_LABEL, type PlayableVideoNote } from '@/lib/longlive/videos';
import { trackVideoFor } from '@/lib/longlive/track-video';
import { eraStyle } from '@/lib/longlive/theme';
import { OverlayNav } from './OverlayNav';
import { trackKey } from './TrackDetail';
import { TrackFivePill } from './TrackFivePill';
import { MomentVideo } from './MomentVideo';
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
  const { trackGuideEraId, openTrackKey, share } = useAppState();
  const { closeTrackGuide } = useAppActions();

  const era = trackGuideEraId ? getEra(trackGuideEraId) : undefined;
  const tracks = trackGuideEraId ? tracksForEra(trackGuideEraId) : [];
  const videos = trackGuideEraId ? videosForEra(trackGuideEraId) : [];
  const open = Boolean(era && tracks.length > 0);

  useScrollLock(open);

  // Close on Escape — unless the share sheet or a song's TrackDetail is
  // layered on top; the top-most overlay owns Escape until it closes itself
  // (otherwise one Escape while a song is open would tear down the whole
  // guide stack, since closeTrackGuide clears the open track too).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share && !openTrackKey) closeTrackGuide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeTrackGuide, share, openTrackKey]);

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
      <OverlayNav onClose={closeTrackGuide} shareTarget={{ kind: 'trackGuide', eraId: era.id }} />

      {/* Compact era-art header */}
      <div className="relative h-[28vh] min-h-44 w-full">
        <Image
          src={era.image || '/placeholder.svg'}
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 30%, transparent), var(--era-bg))',
          }}
        />
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
            <TrackRow key={`${t.trackNumber ?? 'x'}-${t.title}`} eraId={era.id} track={t} videos={videos} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function TrackRow({
  eraId,
  track,
  videos,
}: {
  eraId: EraId;
  track: TrackNote;
  videos: readonly PlayableVideoNote[];
}) {
  const { openTrack } = useAppActions();
  const hasDeepDive = Boolean((track.discussion && track.discussion.length > 0) || track.dossier);
  // Derived from track position, never authored per-track (#689) — so the badge
  // can't drift from the data. Only shows when track 5 actually has a note row.
  const isTrackFive = track.trackNumber === 5;
  // The video→song lookup (lib/longlive/track-video.ts): conservative title
  // matching against the era's playable videos, so a paired video is always
  // actually watchable. A row with no pairing renders exactly as before —
  // no dead control (#2051's lesson).
  const pairedVideo = trackVideoFor(track.title, videos, track.youtubeId);
  const playableVideo = pairedVideo && isPlayable(pairedVideo) ? pairedVideo : null;

  // The WHOLE CARD opens the song (#498: Joey — "you should be able to click
  // anywhere in the rectangle"). The card must stay an <li>, not a <button>:
  // its source links are themselves interactive, and nesting <a> inside
  // <button> is invalid HTML and breaks keyboard/SR use. So the title-row
  // <button> remains the semantic/keyboard control, and the card adds a
  // pointer-only onClick that defers to any real link/button under the tap.
  return (
    <li
      className={`era-card flex gap-4 rounded-2xl border p-4 sm:p-5${hasDeepDive ? ' cursor-pointer' : ''}`}
      onClick={(e) => {
        if (!hasDeepDive) return;
        // A tap on a source link (or the title button itself) is theirs.
        if ((e.target as HTMLElement).closest('a, button')) return;
        openTrack(trackKey(eraId, track));
      }}
    >
      <span
        className="w-7 shrink-0 pt-0.5 text-right font-[family-name:var(--era-font)] text-lg font-semibold tabular-nums text-[color:var(--era-accent)]"
        aria-hidden
      >
        {track.trackNumber ?? '·'}
      </span>
      <div className="min-w-0 flex-1">
        {hasDeepDive ? (
          <button
            onClick={() => openTrack(trackKey(eraId, track))}
            className="group flex w-full items-center justify-between gap-3 text-left"
            aria-label={`${track.title} — open song dossier`}
          >
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="font-[family-name:var(--era-font)] text-lg font-semibold leading-snug underline-offset-4 group-hover:underline">
                {track.title}
              </h2>
              {isTrackFive && <TrackFivePill />}
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 self-center text-[color:var(--era-ink-soft)]"
              aria-hidden
            />
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
              {track.title}
            </h2>
            {isTrackFive && <TrackFivePill />}
          </div>
        )}
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {track.note}
        </p>
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
        {playableVideo && (
          <MomentVideo
            video={{ youtubeId: playableVideo.youtubeId, title: playableVideo.title }}
            caption={null}
            playNoun={playableVideo.kind ? VIDEO_KIND_LABEL[playableVideo.kind].toLowerCase() : 'video'}
            className="mt-3"
          />
        )}
      </div>
    </li>
  );
}
