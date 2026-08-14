/**
 * Pure share-copy builders for the ShareSheet. Kept out of the component so
 * the exact text we hand to navigator.share / the clipboard is unit-testable.
 */

import { truncate } from './format';
import type { ShareTarget } from './store';
import { isSubConfirmed } from './types';
import type { ContentItem, Era, EraId, LensId, TrackNote } from './types';

export interface ShareCopy {
  /** Share-target title (many targets show it as the headline). */
  title: string;
  /** Body text — self-contained, since some targets drop the title. */
  text: string;
}

/** How much of the summary survives into the share body. */
const SHARE_SUMMARY_MAX = 180;

/**
 * Rich share copy for one moment: its title, era, date, and (truncated)
 * summary. The text repeats the title because plenty of share targets
 * (and the clipboard fallback) only carry `text` + url.
 *
 * A sub-confirmed moment (rumor tier, 2026-07-19) carries its qualifier in
 * the outbound text itself — share copy leaves the app, so it's the one
 * surface where no downstream banner can ever correct the framing.
 */
export function momentShareCopy(
  item: Pick<ContentItem, 'title' | 'summary' | 'dateLabel' | 'confidence'>,
  era: Pick<Era, 'name'>,
): ShareCopy {
  const qualifier =
    item.confidence && isSubConfirmed(item.confidence) ? ' [reported — not confirmed]' : '';
  return {
    title: `${item.title} — ${era.name} · Long Live`,
    text: `${item.title} (${era.name}, ${item.dateLabel})${qualifier} — ${truncate(item.summary, SHARE_SUMMARY_MAX)}`,
  };
}

/**
 * Share copy for one song's dossier (#707). The song's note is short and
 * self-contained, so it rides in the body whole where a moment summary would
 * be truncated. Mirrors momentShareCopy's shape so the ShareSheet treats all
 * rich targets identically.
 */
export function trackShareCopy(
  track: Pick<TrackNote, 'title' | 'note'>,
  era: Pick<Era, 'name'>,
): ShareCopy {
  return {
    title: `${track.title} — ${era.name} · Long Live`,
    text: `${track.title} (${era.name}) — ${truncate(track.note, SHARE_SUMMARY_MAX)}`,
  };
}

/** Share copy for an album's track guide overlay (#707). */
export function trackGuideShareCopy(era: Pick<Era, 'album' | 'yearLabel'>): ShareCopy {
  return {
    title: `${era.album} — track guide · Long Live`,
    text: `Every song on ${era.album} (${era.yearLabel}), each with a sourced note — on Long Live.`,
  };
}

/** Share copy for an era's theories & Easter eggs guide overlay (#707). */
export function theoryGuideShareCopy(era: Pick<Era, 'shortName'>): ShareCopy {
  return {
    title: `${era.shortName} decoded — theories & Easter eggs · Long Live`,
    text: `${era.shortName} theories and Easter eggs, every one sourced and graded so you know what's confirmed — on Long Live.`,
  };
}

/** Share copy for the bare site front door — the era stream (#707). */
export function siteShareCopy(): ShareCopy {
  return {
    title: 'Long Live — the Taylor Swift time machine',
    text: 'Long Live — real-time updates on her whole life, or step back into any era.',
  };
}

/**
 * What the top bar's Share button shares in each navigation state. Returns
 * null in threads mode with no thread open — the plain gallery AND the
 * crossing overlay (openCrossing clears lensId) — because no share copy is
 * defined for either state (#492; whether they get their own ShareTarget
 * kind is Joey's call). The button must still RENDER there, just disabled:
 * if the actions group ever changes width between states, the mode toggle
 * shifts (#453).
 */
export function topbarShareTarget(
  mode: 'era' | 'threads' | 'mood' | 'clownbot',
  eraId: EraId,
  lensId: LensId | null,
): ShareTarget | null {
  // Mood chat has no shareable target by design: the only thing that
  // distinguishes one reader's view from another's is what they typed, and
  // that is exactly the thing this feature promises never to persist or
  // transmit. Share stays rendered-but-disabled, same as the thread gallery.
  if (mode === 'mood') return null;
  // Clownbot: same reasoning as Mood. The only thing distinguishing one
  // reader's view is what they typed, and that is exactly what this surface
  // promises never to persist or transmit.
  if (mode === 'clownbot') return null;
  if (mode === 'era') return { kind: 'era', eraId };
  if (lensId != null) return { kind: 'lens', lensId };
  return null;
}
