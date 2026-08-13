'use client';

import { ExternalLink } from 'lucide-react';
import type { WatchAffordance } from '@/lib/longlive/video-affordance';
import { cn } from '@/lib/utils';

/**
 * What a video record renders INSTEAD of the click-to-play embed when there is
 * no official upload to embed (#2050).
 *
 * Before this, both surfaces that render a `VideoNote` gated their only
 * interactive element on `youtubeId`, so a record without one was a dead
 * rectangle: no play button, no link, and — because a video record has no
 * detail route — nothing to open either. Joey met one on mobile ("isn't
 * clickable at all, does nothing"); 19 records are in that state, 3 of them in
 * the unfiltered era feed.
 *
 * Two halves, and both are load-bearing:
 *
 *  - It SAYS it can't be watched here. #2051 acceptance criterion 8 is that
 *    every card under the Videos filter either plays or clearly says why it
 *    can't, and 8 of the 19 (the tour films, the documentaries, the theatrical
 *    release party) have no official upload anywhere — no content pass will
 *    ever fix those, so silence would be a permanent lie of omission.
 *  - It hands the reader somewhere to go. The record's first citation is the
 *    defining reference for the work, so the card links out to it rather than
 *    ending the interaction.
 *
 * Renders nothing when the record embeds — the caller shows the player.
 */
export function NoEmbedFallback({
  affordance,
  title,
  className,
}: {
  affordance: WatchAffordance;
  /** The work's title — for the link's screen-reader label, which must say what
   * it points at rather than "read about it at en.wikipedia.org" alone. */
  title: string;
  className?: string;
}) {
  if (affordance.kind === 'embed') return null;

  return (
    <div className={cn('mt-4', className)}>
      <p className="text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
        Not available to watch here
      </p>
      {affordance.kind === 'link' && (
        <a
          href={affordance.url}
          target="_blank"
          rel="noopener noreferrer"
          /* WCAG 2.5.3 Label in Name: the visible string must be contained in
             the accessible name, or voice control ("click read about it at
             en.wikipedia.org") finds no match. So the label EXTENDS the visible
             text rather than rephrasing it. */
          aria-label={`Read about it at ${affordance.host} — ${title}, opens in a new tab`}
          /* min-h-11 is the 44px touch target from #2051 AC4; the link is a
             sibling of the card, never nested inside another interactive
             element, so screen readers announce exactly one control here. */
          className="era-btn-ghost mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
        >
          <ExternalLink className="h-4 w-4 text-[color:var(--era-accent)]" aria-hidden />
          Read about it at {affordance.host}
        </a>
      )}
    </div>
  );
}
