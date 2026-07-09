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
export function MomentVideo({ video }: { video: MomentVideoData }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="mt-8">
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
            aria-label={`Play music video: ${video.title}`}
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
      <figcaption className="mt-2 text-center text-xs text-[color:var(--era-ink-soft)]">
        Official music video · {video.title} · YouTube
      </figcaption>
    </figure>
  );
}
