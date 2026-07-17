'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import type { EraMedia as EraMediaData } from '@/lib/longlive/types';

/**
 * Legal, first-party streaming for an era. We never self-host audio; instead we
 * mount the official Spotify album embed (30s previews for anonymous listeners,
 * full playback when signed into Spotify).
 *
 * Perf: the iframe is expensive and eras render in an infinite scroll, so this
 * is a click-to-play facade — the embed only mounts after the user opts in.
 */
export function EraMedia({ media }: { media: EraMediaData }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="mx-auto mt-7 w-full max-w-md">
        <iframe
          title={`${media.albumTitle} — Spotify player`}
          src={`https://open.spotify.com/embed/album/${media.spotifyAlbumId}?utm_source=generator&theme=0`}
          width="100%"
          height={152}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="rounded-xl"
          style={{ border: 0 }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-7 w-full max-w-md">
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="era-card group flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left transition hover:brightness-110"
        // Accessible name must contain the visible label ("Play the era") to
        // satisfy WCAG 2.5.3 Label in Name (#702); keep the album + Spotify
        // context after it for screen-reader clarity.
        aria-label={`Play the era: ${media.albumTitle} on Spotify`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105"
          style={{ backgroundColor: 'var(--era-accent)' }}
        >
          <Play className="h-4 w-4 translate-x-px" style={{ color: 'var(--era-bg)' }} fill="currentColor" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
            Play the era
          </span>
          <span className="block truncate text-sm font-semibold text-[color:var(--era-ink)]">
            {media.albumTitle}
          </span>
        </span>
      </button>
    </div>
  );
}
