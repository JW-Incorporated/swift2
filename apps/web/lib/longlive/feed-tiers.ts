import { hasRealPrimaryImage } from './types';
import type { ContentItem } from './types';

/**
 * Card silhouette for one feed item. Design direction from a v0 deep-think
 * session (2026-07-10) on breaking feed monotony: the earlier "every 4th
 * card is bigger" scheme failed because a *periodic* size variant is itself
 * a pattern the eye learns and tunes out — same disease, slower clock.
 * Real texture needs (a) genuinely different card *kinds*, not size
 * variants of one kind, and (b) *aperiodic* pacing so breaks don't fall on
 * a predictable beat.
 *
 *   - hero  — rare, spaced out, full-bleed image + big title. Reserved for
 *             items with real signal of weight (a video, or a fuller body).
 *   - media — the workhorse: contained image + text, current default look.
 *   - chip  — routine/day-to-day items, compact dense row, small thumbnail.
 *   - text  — no real photo, or a deliberate "breather" after a run of
 *             image cards — a beat of pure typography to reset scan rhythm.
 */
export type CardTier = 'hero' | 'media' | 'chip' | 'text';

/** Stable, cheap string hash -> 0..(mod-1). Seeded on item id so pacing is
 * stable across renders/re-fetches (no reshuffle-flicker), never periodic. */
function seededJitter(id: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % mod;
}

/** Routine = short, no hidden clue, and about the day-to-day (tour stop,
 * relationship sighting) rather than the music/fashion itself. */
function isRoutine(item: ContentItem): boolean {
  if (item.hiddenClue) return false;
  if (item.summary.length > 130) return false;
  const onlyRoutineTags = item.tags.every((t) => t === 'Tour' || t === 'Relationship');
  return onlyRoutineTags && item.tags.length > 0;
}

/** Notable enough for the rare hero treatment: a real photo plus some other
 * signal of weight (an official video, or a body with real substance). */
function isHeroWorthy(item: ContentItem): boolean {
  return hasRealPrimaryImage(item) && (item.video != null || item.body.length > 1);
}

/**
 * Assigns each item in a chronological sequence a card tier. Two passes:
 * Pass 1 scores each item independently from its own content. Pass 2 walks
 * the sequence applying pacing corrections (space out heroes, break up runs
 * of image cards) so texture doesn't depend on any single item in isolation.
 * Pure function of the sequence + ids — same input always produces the same
 * tiers, so scrolling away and back never reshuffles what a user already saw.
 */
export function assignFeedTiers(items: ContentItem[]): Map<string, CardTier> {
  const tiers = new Map<string, CardTier>();
  let mediaRun = 0;
  let sinceHero = Infinity;

  for (const item of items) {
    const hasImage = hasRealPrimaryImage(item);
    let tier: CardTier;

    if (isHeroWorthy(item) && sinceHero >= 10) {
      tier = 'hero';
      sinceHero = 0;
    } else {
      sinceHero += 1;
      if (!hasImage) {
        tier = 'text';
      } else if (isRoutine(item)) {
        tier = 'chip';
      } else {
        tier = 'media';
      }
    }

    const isImageTier = tier === 'hero' || tier === 'media';
    // After a run of 3-5 (jittered by id, never a fixed period) image cards
    // in a row, force the next eligible one into a breather instead —
    // never a hero, and never one with a hidden clue (those stay visible).
    const breakAt = 3 + seededJitter(item.id, 3);
    if (isImageTier && tier !== 'hero' && !item.hiddenClue && mediaRun >= breakAt) {
      tier = isRoutine(item) ? 'chip' : 'text';
    }

    tiers.set(item.id, tier);
    mediaRun = tier === 'hero' || tier === 'media' ? mediaRun + 1 : 0;
  }

  return tiers;
}
