'use client';

import { useEffect } from 'react';
import { X, ListMusic } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { tracksForEra } from '@/lib/longlive/tracks';
import { eraStyle } from '@/lib/longlive/theme';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import type { TrackNote } from '@/lib/longlive/types';

/** Same composite key TrackRow/TrackGuide use — TrackNote has no stable id. */
export function trackKey(eraId: string, track: TrackNote): string {
  return `${eraId}::${track.trackNumber ?? 'x'}::${track.title}`;
}

/**
 * A single song's deep-dive page: real researched discussion of what it
 * means and why she wrote it, grounded with a few short quoted lines (never
 * full lyrics — see docs/decisions.md 2026-07-09). Stacks on top of
 * TrackGuide, same immersive-overlay pattern as MomentDetail.
 */
export function TrackDetail() {
  const { openTrackKey, trackGuideEraId, share } = useAppState();
  const { closeTrack } = useAppActions();

  const era = trackGuideEraId ? getEra(trackGuideEraId) : undefined;
  const track =
    era && openTrackKey
      ? tracksForEra(era.id).find((t) => trackKey(era.id, t) === openTrackKey)
      : undefined;

  useEffect(() => {
    if (!track) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [track]);

  useEffect(() => {
    if (!track) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share) closeTrack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [track, closeTrack, share]);

  useBackDismiss(Boolean(track), closeTrack);

  if (!era || !track) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
      role="dialog"
      aria-modal="true"
      aria-label={`${track.title} — song detail`}
    >
      <div className="relative mx-auto max-w-2xl px-5 pb-24 pt-14">
        <button
          onClick={closeTrack}
          className="era-icon-btn absolute right-4 top-4 rounded-full p-2 backdrop-blur-md"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          <ListMusic className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
          {era.album}
          {track.trackNumber ? ` · Track ${track.trackNumber}` : ''}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {track.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{track.note}</p>

        {track.discussion && track.discussion.length > 0 ? (
          <div className="mt-6 space-y-4">
            {track.discussion.map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-[color:var(--era-ink)]">
                {para}
              </p>
            ))}
            {track.quotedLines && track.quotedLines.length > 0 && (
              <div className="era-card space-y-2 rounded-2xl border p-5">
                {track.quotedLines.map((line, i) => (
                  <p
                    key={i}
                    className="font-[family-name:var(--era-font)] text-lg italic leading-snug text-[color:var(--era-ink)]"
                  >
                    {'“'}
                    {line}
                    {'”'}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
            The full story behind this song hasn&apos;t been written yet — check back soon.
          </p>
        )}

        {(track.discussionSources ?? track.sources) && (
          <p className="mt-8 text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
            {(track.discussionSources ?? track.sources)!.length > 1 ? 'Sources:' : 'Source:'}{' '}
            {(track.discussionSources ?? track.sources)!.map((s, i) => (
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
    </div>
  );
}
