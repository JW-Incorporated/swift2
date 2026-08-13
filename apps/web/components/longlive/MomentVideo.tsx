'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { MomentVideo as MomentVideoData } from '@/lib/longlive/types';

/**
 * The 16:9 frame every video on the site sits in — poster or player, one
 * geometry. Sharing it is what makes swapping the poster for the iframe a pure
 * content swap with no layout shift.
 */
function VideoFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl border"
      style={{ borderColor: 'var(--era-line)', background: 'var(--era-surface)' }}
    >
      {children}
    </div>
  );
}

/**
 * THE video affordance: a full-width 16:9 poster (the video's own YouTube
 * thumbnail) with a large centered accent play glyph.
 *
 * Exported because it is the site's ONE video treatment (#2078, Joey). Every
 * playable video in the era feed renders through this component, whether the
 * card is a video record (`VideoMomentCard`) or a story moment carrying footage
 * (`MomentCard`) — reusing the component, not copying the look, is what keeps
 * the two from drifting apart again. #2063 shipped the moment case as a
 * separate compact row (96px thumb + "Play video" + title) and Joey rejected it
 * on sight: two vocabularies for one thing means the reader still has to learn
 * which cards play.
 *
 * The a11y contract callers depend on:
 *  - it is a single `type="button"`, so it can be a DOM SIBLING of a card's own
 *    button (nesting interactive elements breaks screen readers);
 *  - it announces `Play {playNoun}: {title}`, so a reader knows what plays;
 *  - the whole 16:9 area is the target, comfortably past the 44px floor;
 *  - the overlay and the glyph are decorative and hidden from screen readers.
 *
 * Perf/privacy: this is a plain <img>, never an iframe. Nothing from YouTube's
 * player loads until the button is pressed (the #1935 click-to-load posture).
 */
export function VideoPoster({
  video,
  playNoun = 'video',
  onPlay,
}: {
  video: MomentVideoData;
  /** The noun the play button announces ("Play {playNoun}: {title}"). */
  playNoun?: string;
  onPlay: () => void;
}) {
  return (
    <VideoFrame>
      <button
        type="button"
        onClick={onPlay}
        className="group absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--era-accent)]"
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
        <span aria-hidden className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: 'var(--era-accent)' }}
        >
          <Play className="h-7 w-7 translate-x-0.5" style={{ color: 'var(--era-bg)' }} fill="currentColor" />
        </span>
      </button>
    </VideoFrame>
  );
}

/**
 * Official music video for a moment, embedded from YouTube. We never re-host
 * video; this mounts YouTube's privacy-enhanced player (youtube-nocookie.com).
 *
 * Perf: the iframe is heavy, so this is a click-to-play facade — until the user
 * opts in we show only `VideoPoster` (a plain <img>, no player JS).
 */
export function MomentVideo({
  video,
  caption = `Official music video · ${video.title} · YouTube`,
  playNoun = 'music video',
  className = 'mt-8',
  startPlaying = false,
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
  /**
   * Mount the player immediately instead of the poster facade.
   *
   * ONLY for a caller whose own control was the user's play tap — the era-feed
   * play poster (#2051/#2078), which would otherwise cost two taps to watch one
   * video (poster, then the facade's own play button). The click-to-load
   * privacy posture from #1935 is unchanged: an iframe still mounts only in
   * response to a user gesture, just one component up. Never pass this from a
   * render path the user did not just click.
   */
  startPlaying?: boolean;
}) {
  const [playing, setPlaying] = useState(startPlaying);

  return (
    <figure className={className}>
      {playing ? (
        <VideoFrame>
          <iframe
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
          />
        </VideoFrame>
      ) : (
        <VideoPoster video={video} playNoun={playNoun} onPlay={() => setPlaying(true)} />
      )}
      {caption !== null && (
        <figcaption className="mt-2 text-center text-xs text-[color:var(--era-ink-soft)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
