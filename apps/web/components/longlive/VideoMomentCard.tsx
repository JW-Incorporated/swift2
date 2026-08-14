'use client';

import { Clapperboard } from 'lucide-react';
import { VIDEO_KIND_LABEL } from '@/lib/longlive/videos';
import type { PlayableVideoNote } from '@/lib/longlive/videos';
import { formatMonthYear } from '@/lib/longlive/format';
import { MomentVideo } from './MomentVideo';
import type { Era } from '@/lib/longlive/types';

// Split out of EraSection.tsx (PLAN.md P3 step 15 — see MAP.md).

/**
 * Lightweight timeline entry for a video duplicated in from the era's videos
 * (issue #439 part 2 for music videos; every kind under the Videos filter).
 * Deliberately thinner than MomentCard's tiers — this is just the date, title,
 * and the same click-to-play facade (MomentVideo) used everywhere else a video
 * embeds.
 *
 * A record with no `releasedOn` (only reachable under the Videos filter) is
 * anchored at `sortDate` — the entry's `anchor.sortDate` from mergeEraFeed
 * (era-feed.ts), which resolveAnchor (anchor-date.ts) computes.
 *
 * Leaving it unanchored was the first instinct — never invent a date — and it
 * was wrong in a way review caught: an unanchored card leaves TimelineScrubber
 * interpolating across a region containing no anchors at all, so dragging maps
 * to badly wrong dates exactly where the filter is most used. The anchor is
 * not a fabricated claim about the video: `data-ll-date` positions the card,
 * `data-ll-exact` tells TimelineScrubber whether that position may ever be
 * shown/announced, and the card itself renders `displayDate` only, which is
 * null (and reads "Date unknown") for anything but an authored `releasedOn`
 * (adversarial review finding #1, 2026-08-13 — a synthetic anchor was
 * reaching the scrubber's visible pill and `aria-valuetext`).
 */
export function VideoMomentCard({
  video,
  eraId,
  sortDate,
  displayDate,
}: {
  video: PlayableVideoNote;
  eraId: Era['id'];
  sortDate: string;
  /** Positioning only via `sortDate` above — see anchor-date.ts's honesty
   * rule. Rendered (and exposed to the scrubber) only when non-null. */
  displayDate: string | null;
}) {
  const anchorProps = {
    'data-ll-item': `era-video-${video.slug}`,
    'data-ll-era': eraId,
    'data-ll-date': new Date(sortDate).getTime(),
    // Tells TimelineScrubber whether this position's date may be shown/
    // announced (finding #1 — a synthetic anchor was leaking into the
    // scrubber's pill and aria-valuetext even though the card itself
    // correctly renders "Date unknown").
    'data-ll-exact': displayDate != null ? '1' : '0',
  };
  const kindLabel = video.kind ? VIDEO_KIND_LABEL[video.kind] : 'Video';
  // Every video record reaching this component plays: `videosForEra` hides the
  // ones with no verified embed rather than rendering them (playable-first,
  // docs/decisions.md 2026-08-13). That is why there is no else branch here and
  // no `youtubeId` guard — the type says the id is present.
  //
  // Full width because this card always carries a 16/9 YouTube facade, which is
  // unreadable squeezed into a half-width track.
  //
  // NB: this comment lives OUTSIDE the tag on purpose. A `//` comment in JSX
  // attribute position parses under tsc but is a hard syntax error in Next's
  // SWC parser, so it passes typecheck and tests and then fails only in the
  // browser as a blank page (2026-07-21).
  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      {...anchorProps}
    >
      <div className="era-card block w-full rounded-2xl border p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {displayDate ? formatMonthYear(displayDate) : 'Date unknown'}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[color:var(--era-accent)]">
            <Clapperboard className="h-3.5 w-3.5" aria-hidden />
            {kindLabel}
          </span>
        </div>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
          {video.title}
        </h3>
        {video.summary && (
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {video.summary}
          </p>
        )}
        <MomentVideo
          video={{ youtubeId: video.youtubeId, title: video.title }}
          caption={null}
          playNoun={kindLabel.toLowerCase()}
          className="mt-4"
        />

      </div>
    </li>
  );
}
