'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppState } from '@/lib/longlive/store';
import { MomentVideo, VideoPoster } from './MomentVideo';
import { feedVideoFor } from '@/lib/longlive/video-affordance';
import type { ContentItem } from '@swift2/experience';
import { TIER_BOX, TIER_BOX_STYLE, TIER_FOOTER, TIER_SPAN } from '@/lib/longlive/card-chrome';
import type { CardTier } from '@/lib/longlive/feed-tiers';
import { MomentCardButton } from './MomentCardButton';
import { cn } from '@/lib/utils';

// Split out of EraSection.tsx (PLAN.md P3 step 15 — see MAP.md). The card
// body itself (MomentCardButton, MomentMeta, TagRow) lives in
// MomentCardButton.tsx; this file owns only the relationship between that
// button and the play affordance beside it (#2057).

/**
 * One moment in the era feed: the card itself, plus its play affordance when
 * the moment carries footage (#2051).
 *
 * The two live as SIBLINGS on purpose. `MomentCardButton` is a single big
 * <button> that opens the story — that is the whole point of the #1017
 * editorial tiers — and the play affordance cannot go inside it without nesting
 * one interactive element in another. So: tap the poster and the video plays
 * right here in the feed; tap anywhere else on the card and the story opens,
 * exactly as before.
 *
 * The affordance IS `VideoPoster` — the same component the video-record cards
 * render (#2080). One video treatment in the feed: full-width 16:9, the video's
 * own thumbnail, one big centered accent glyph, whatever kind of card it hangs
 * on. #2063's compact 96px "Play video" row is gone; Joey rejected it on his
 * phone precisely because a second vocabulary for "this plays" leaves the reader
 * still having to learn which cards do.
 *
 * `hideImage` is the other half of that uniformity, and it is not cosmetic: 8 of
 * the 16 moments carrying footage have the video's OWN thumbnail as their photo
 * (Photo Enrichment reached for it because the moment IS the video). Rendering
 * both would print the same frame twice inside one card — for two of them the
 * card photo is the byte-identical url the poster requests. So when the photo is a frame of
 * the video being played, the poster takes the image slot instead of joining it,
 * and the card lands on exactly the video-record shape Joey pointed at: text
 * above, big poster below. A photo from anywhere else is a different picture and
 * is kept.
 *
 * It also covers the opposite failure, which is worse: a card that DEFERS its
 * embed (`ownsVideo` false) showing a frame of the video it will not play. On
 * tloas that put a hero-sized still of the Elizabeth Taylor music video on
 * "'Elizabeth Taylor' goes to radio" with no play control anywhere on it — a big
 * video-looking picture that does nothing when tapped. Suppressed, the card is
 * the story it always was (radio airplay), and its tier falls back to a
 * no-photo one because that is now what it is. Both halves are decided by
 * `feedCardImageHidden` and handed down as this one boolean.
 *
 * They are siblings INSIDE THE CARD'S BOX, which is the #2057 fix: the box is
 * drawn by the wrapper below (TIER_BOX), not by the button, so an affordance
 * rendered beside the button still lands within the border instead of floating
 * in the gap under the card. See card-chrome.ts.
 *
 * Playback is one tap, not two: the poster IS the user's play gesture, so the
 * embed mounts already playing (`startPlaying`). The #1935 click-to-load
 * posture is intact — no iframe exists in the feed until this state flips, and
 * only a real click flips it. The poster is then replaced by the player rather
 * than sitting beside it, so the card never shows two play controls.
 *
 * `ownsVideo` is the #2057 duplicate-embed rule: when two moments in one era
 * embed the same YouTube id, only the first in feed order renders the player
 * (see inlineVideoMomentIds). A later duplicate keeps every word of its own
 * story — it just doesn't play the same video a second time.
 */
export function MomentCard({
  item,
  tier,
  ownsVideo,
  hideImage,
  onOpen,
}: {
  item: ContentItem;
  tier: CardTier;
  ownsVideo: boolean;
  hideImage: boolean;
  onOpen: () => void;
}) {
  const video = ownsVideo ? feedVideoFor(item) : null;
  const [playing, setPlaying] = useState(false);
  const { openItemId } = useAppState();

  // Stop feed playback when a moment detail opens over it.
  //
  // MomentDetail is a `fixed inset-0 z-50` sheet rendered ALONGSIDE a still-
  // mounted EraStream, so without this the iframe keeps playing underneath it:
  // audible, invisible, and unreachable until the reader closes the sheet and
  // scrolls back to find it. Tapping the card is the very next gesture after
  // tapping its play badge, so this is the common path, not a corner case. For
  // the same moment it also avoids two players of one video running at once.
  useEffect(() => {
    if (openItemId) setPlaying(false);
  }, [openItemId]);

  // `min-w-0` is required on every grid item: a grid child defaults to
  // `min-width: auto`, which lets a long unbroken title push the track wider
  // than its share of the container and scroll the whole page sideways.
  // #1017 makes "the page body must never scroll horizontally" a hard
  // requirement, and this is the line that holds it.
  return (
    <li
      className={cn('relative min-w-0 scroll-mt-28', TIER_SPAN[tier])}
      data-ll-item={item.id}
      data-ll-era={item.eraId}
      data-ll-date={new Date(item.date).getTime()}
    >
      {/* The card's visual box. It is this wrapper, not the button, so that the
          play affordance below can be a SIBLING of the button and still render
          inside the border (#2057 — see card-chrome.ts). */}
      <div className={TIER_BOX[tier]} style={TIER_BOX_STYLE[tier]}>
        <MomentCardButton
          item={item}
          tier={tier}
          hideImage={hideImage}
          onOpen={onOpen}
        />
        {video && (
          <div className={TIER_FOOTER[tier]}>
            {playing ? (
              <>
                <MomentVideo video={video} caption={null} className="" startPlaying />
                {/* The way back out. Without it the only exits from a playing
                    card are opening the detail or leaving the era. */}
                <button
                  type="button"
                  onClick={() => setPlaying(false)}
                  aria-label={`Hide video: ${video.title}`}
                  className="era-btn-ghost mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Hide video
                </button>
              </>
            ) : (
              <VideoPoster video={video} onPlay={() => setPlaying(true)} />
            )}
          </div>
        )}
      </div>
    </li>
  );
}
