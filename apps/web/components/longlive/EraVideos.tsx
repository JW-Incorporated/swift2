'use client';

import { useMemo } from 'react';
import { Clapperboard } from 'lucide-react';
import { videosForEra, VIDEO_KIND_LABEL } from '@/lib/longlive/videos';
import type { PlayableVideoNote } from '@/lib/longlive/videos';
import type { EraId } from '@/lib/longlive/types';
import { MomentVideo } from './MomentVideo';

/**
 * Per-era videos rail, rendered inside EraSection. Data is static, synced at
 * build time from the Vault video_work seed/table (lib/longlive/videos.ts); no
 * runtime fetch. Every card here embeds via the MomentVideo click-to-play
 * facade (poster thumbnail only until the user opts in — cheap even in the
 * infinite scroll).
 *
 * Every card PLAYS: `videosForEra` hides records with no verified embed rather
 * than rendering them as metadata-only cards (Joey, 2026-08-13 — see
 * docs/decisions.md "Playable-first timeline"). This component therefore has no
 * no-embed branch to write, which is the point: the rule is enforced in the
 * data read, not re-implemented per surface.
 *
 * Carries two families since 2026-08-12: works she made or headlined, and
 * appearances (interviews, award speeches, speeches, press events). Every
 * entry is still an official/first-party upload — a fan re-upload can be a
 * timeline source but never lands here.
 */

export function EraVideos({ eraId }: { eraId: EraId }) {
  const videos = useMemo(() => videosForEra(eraId), [eraId]);
  if (videos.length === 0) return null;

  return (
    <div id={`era-videos-${eraId}`} className="scroll-mt-28 border-t border-[color:var(--era-line)]">
      <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-[color:var(--era-accent)]" />
          {/* "Official videos" was accurate when the rail only held her own
              works; it now also holds appearances on other people's shows, and
              calling a Fallon interview one of her official videos misreads it.
              The official-upload GUARANTEE hasn't changed — only the wording. */}
          <h2 className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
            Videos &amp; appearances · {videos.length}
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

function VideoCard({ video }: { video: PlayableVideoNote }) {
  const meta = [
    video.kind ? VIDEO_KIND_LABEL[video.kind] : null,
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

      <MomentVideo
        video={{ youtubeId: video.youtubeId, title: video.title }}
        caption={null}
        playNoun={video.kind ? VIDEO_KIND_LABEL[video.kind].toLowerCase() : 'video'}
        className="mt-4"
      />

      {/* The citation LIST is intentionally omitted here — this card renders
          directly in the un-gated main scroll (a video record has no
          click-through detail page), and citations belong on an expanded page,
          per direct product feedback. */}
    </article>
  );
}
