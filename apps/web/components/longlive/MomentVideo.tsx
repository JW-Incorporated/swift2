'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { MomentVideo as MomentVideoData } from '@/lib/longlive/types';

/**
 * Official music video for a moment, embedded from YouTube. We never re-host
 * video; this mounts YouTube's privacy-enhanced player (youtube-nocookie.com).
 *
 * Perf: the iframe is heavy, so this is a click-to-play facade — until the user
 * opts in we show only YouTube's poster thumbnail (a plain <img>, no player JS).
 */
export function MomentVideo({
  video,
  caption = `Official music video · ${video.title} · YouTube`,
  playNoun = 'music video',
  className = 'mt-8',
}: {
  video: MomentVideoData;
  /** Figcaption text; pass null to render the embed with no caption (the
   * surrounding card already names the work, e.g. EraVideos). */
  caption?: string | null;
  /**
   * The noun the play button announces ("Play {playNoun}: {title}").
   *
   * Defaults to 'music video' because that was this facade's only job until
   * 2026-08-12. It now also carries the appearance family (interviews, award
   * speeches, press events), and a screen-reader user meeting an interview
   * would otherwise hear "Play music video: The Graham Norton Show" — the same
   * misnomer the Videos rail heading was reworded to avoid, surviving in the
   * one label a sighted user never sees. Callers rendering a video record pass
   * its kind label; moment/track embeds keep the default.
   */
  playNoun?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={className}>
      <div
        className="relative aspect-video w-full overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--era-line)', background: 'var(--era-surface)' }}
      >
        {playing ? (
          <iframe
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play ${playNoun}: ${video.title}`}
          >
            <Image
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover transition group-hover:scale-[1.03]"
              unoptimized
            />
            <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: 'var(--era-accent)' }}
            >
              <Play className="h-7 w-7 translate-x-0.5" style={{ color: 'var(--era-bg)' }} fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      {caption !== null && (
        <figcaption className="mt-2 text-center text-xs text-[color:var(--era-ink-soft)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
