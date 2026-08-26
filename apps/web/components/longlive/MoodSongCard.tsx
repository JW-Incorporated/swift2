'use client';

/**
 * One matched song in Mood Chat. The YouTube embed is a CLICK-TO-PLAY FACADE —
 * poster image only until the reader opts in — mirroring MomentVideo. The spec
 * calls this out explicitly because a results list mounts several of these at
 * once, and eagerly embedding five players would spawn five iframes on a phone.
 *
 * `youtubeId` is optional in the catalogue (it is the track's own
 * oEmbed-verified id and is absent when the track has none). When it is
 * missing we render the card with no embed rather than guessing an id.
 */
import { useState } from 'react';
import { Play } from 'lucide-react';
import type { MoodMatch } from '@/lib/longlive/mood-match';

export function MoodSongCard({ pick, eraName }: { pick: MoodMatch; eraName: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)]">
      <div className="p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--era-accent)]">
          {eraName}
        </div>
        <h3 className="mt-1 font-[family-name:var(--era-font)] text-xl font-semibold text-[color:var(--era-ink)]">
          {pick.title}
        </h3>
        {/* oneLiner is ORIGINAL prose written for the catalogue — never quoted
            verse. The no-lyrics redline applies to this surface too. */}
        {pick.oneLiner && (
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{pick.oneLiner}</p>
        )}
      </div>

      {pick.youtubeId && (
        <div
          className="relative aspect-video w-full overflow-hidden border-t"
          style={{ borderColor: 'var(--era-line)' }}
        >
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${pick.youtubeId}?autoplay=1&rel=0`}
              title={pick.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${pick.title} on YouTube`}
              className="group absolute inset-0 h-full w-full"
            >
              {/* Plain <img>: no player JS until the reader asks for it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${pick.youtubeId}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
              <span className="absolute left-1/2 top-1/2 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--era-bg)]">
                <Play className="h-6 w-6 translate-x-[1px]" fill="currentColor" />
              </span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}
