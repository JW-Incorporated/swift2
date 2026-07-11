'use client';

import { useMemo } from 'react';
import { Clapperboard } from 'lucide-react';
import { videosForEra } from '@/lib/longlive/videos';
import type { EraId, VideoNote, VideoNoteKind } from '@/lib/longlive/types';
import { MomentVideo } from './MomentVideo';

/**
 * Per-era official videos rail, rendered inside EraSection. Data is static,
 * synced at build time from the Vault video_work seed/table
 * (lib/longlive/videos.ts); no runtime fetch. Works with a verified official
 * YouTube upload embed via the MomentVideo click-to-play facade (poster
 * thumbnail only until the user opts in — cheap even in the infinite scroll);
 * works without one (e.g. theatrical tour films) render as metadata cards.
 */

const KIND_LABEL: Record<VideoNoteKind, string> = {
  music_video: 'Music video',
  lyric_video: 'Lyric video',
  short_film: 'Short film',
  tour_film: 'Tour film',
  documentary: 'Documentary',
  performance: 'Performance',
};

export function EraVideos({ eraId }: { eraId: EraId }) {
  const videos = useMemo(() => videosForEra(eraId), [eraId]);
  if (videos.length === 0) return null;

  return (
    <div className="border-t border-[color:var(--era-line)]">
      <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-[color:var(--era-accent)]" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
            Official videos · {videos.length}
          </h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <VideoCard key={v.slug} video={v} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: VideoNote }) {
  const meta = [
    video.kind ? KIND_LABEL[video.kind] : null,
    video.director ? `Dir. ${video.director}` : null,
    video.releasedOn ? video.releasedOn.slice(0, 4) : null,
  ].filter(Boolean);

  return (
    <article className="era-card flex flex-col rounded-2xl border p-4 sm:p-5">
      <div className="text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
        {meta.join(' · ')}
      </div>
      <h3 className="mt-1.5 font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
        {video.title}
      </h3>
      {video.summary && (
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {video.summary}
        </p>
      )}

      {video.symbolism && (
        <p className="mt-2.5 text-[13px] italic leading-relaxed text-[color:var(--era-ink-soft)]">
          {video.symbolism}
        </p>
      )}

      {video.easterEggs.length > 0 && (
        <ul className="mt-2.5 space-y-1 text-[13px] leading-relaxed text-[color:var(--era-ink-soft)]">
          {video.easterEggs.map((egg, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--era-accent)]" />
              <span>{egg}</span>
            </li>
          ))}
        </ul>
      )}

      {video.youtubeId && (
        <MomentVideo
          video={{ youtubeId: video.youtubeId, title: video.title }}
          caption={null}
          className="mt-4"
        />
      )}

      {/* Sources intentionally omitted here — this card renders directly in
          the un-gated main feed (no click-through detail page for videos
          yet), and citations belong on an expanded page, not the main
          scroll, per direct product feedback. */}
    </article>
  );
}
