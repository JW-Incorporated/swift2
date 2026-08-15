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
 * Share copy for the Threads landing gallery — as distinct from any one
 * open thread, which uses momentShareCopy's sibling `lens` target (#2105).
 */
export function threadsGalleryShareCopy(): ShareCopy {
  return {
    title: 'The Threads — Long Live',
    text: 'Eras move forward in time. Threads cut sideways, following one story through every chapter — on Long Live.',
  };
}

/**
 * Share copy for Mood as a destination — never a transcript. See
 * topbarShareTarget's JSDoc for why the target carries no user input.
 */
export function moodShareCopy(): ShareCopy {
  return {
    title: 'Mood — Long Live',
    text: "Tell it how you're feeling, get back the Taylor songs that fit — on Long Live.",
  };
}

/**
 * Share copy for Clownbot as a destination — never a transcript. See
 * topbarShareTarget's JSDoc for why the target carries no user input.
 */
export function clownbotShareCopy(): ShareCopy {
  return {
    title: 'Clownbot — Long Live',
    text: 'An unhinged, permanently-online superfan you can chat with, right on Long Live.',
  };
}

/**
 * Share copy for the Community directory — a curated list of fan
 * communities, grouped by platform (CommunitySection.tsx). Carries no user
 * input; the link just opens the directory (#2105).
 */
export function communityShareCopy(): ShareCopy {
  return {
    title: 'Fan communities — Long Live',
    text: 'Where Swifties gather, grouped by platform and curated by hand — on Long Live.',
  };
}

/**
 * Share copy for the Merch directory — shop-the-look products pulled from
 * real moments, plus the official store and fan-made finds; every link
 * leaves the site, nothing checks out here (MerchSection.tsx). Carries no
 * user input; the link just opens the directory (#2105).
 */
export function merchShareCopy(): ShareCopy {
  return {
    title: 'Merch — Long Live',
    text: 'Shop the look from real moments, plus the official store and fan-made finds — on Long Live.',
  };
}

/**
 * What the top bar's Share button shares in each navigation state.
 *
 * Mood and Clownbot (#2105): the target addresses the SURFACE, never the
 * conversation — the only thing that distinguishes one reader's view from
 * another's is what they typed, and that is exactly the thing this feature
 * promises never to persist or transmit. A shared link opens the surface
 * empty and ready; it carries no user input at all.
 *
 * Threads gallery (#2105): shares the gallery itself when no thread is open.
 * An open thread still shares that specific thread (the `lens` branch below).
 *
 * Community and Merch (#2105): each shares its directory as a destination,
 * same shape as Mood and Clownbot — neither takes user input at all, so
 * there is nothing to guard, just a surface to address.
 */
export function topbarShareTarget(
  mode: 'era' | 'threads' | 'mood' | 'clownbot' | 'community' | 'merch',
  eraId: EraId,
  lensId: LensId | null,
): ShareTarget | null {
  if (mode === 'mood') return { kind: 'mood' };
  if (mode === 'clownbot') return { kind: 'clownbot' };
  if (mode === 'community') return { kind: 'community' };
  if (mode === 'merch') return { kind: 'merch' };
  if (mode === 'era') return { kind: 'era', eraId };
  if (lensId != null) return { kind: 'lens', lensId };
  if (mode === 'threads') return { kind: 'threads' };
  return null;
}
