import { substanceScore } from './substance';
import { hasRealPrimaryImage } from './types';
import type { ContentItem } from './types';

/**
 * Card silhouette for one feed item.
 *
 * History, because the two design directions here pull against each other and
 * the second one won:
 *
 * (2026-07-10) The tiers were introduced to break feed monotony: the earlier
 * "every 4th card is bigger" scheme failed because a *periodic* size variant
 * is itself a pattern the eye learns and tunes out. Real texture needs
 * genuinely different card *kinds*, and *aperiodic* pacing so breaks don't
 * fall on a predictable beat.
 *
 * (2026-07-21, issue #1017) That system treated variation as noise to be
 * paced, and paced it flat: measured over 698 items it produced ~56% media /
 * ~31% text / ~12% hero / ~1% chip, with the founder's read being "pretty
 * much all articles present as the same." Card size now tracks
 * `substanceScore` — how much article there actually is — so a meaty piece
 * looks meaty. The 2026-07-10 intent survives where it still applies: hero
 * spacing is kept, and it is kept APERIODIC (id-seeded jitter, see
 * `heroGapFor`) rather than a fixed 1-in-N beat. What was deleted is the
 * "breather", which could demote a genuinely substantial image card down to
 * `text` purely because of its position in a run — that is the specific bug
 * #1017 was filed against: pacing suppressing real signal. Aperiodic texture
 * is now supplied by the content itself, since `chip` went from ~1% of cards
 * to a real quarter of the feed.
 *
 *   - hero  — rare, spaced out, full-bleed image + big title. An explicit
 *             `significance: 'defining'`, or a real photo plus a top-decile
 *             substance score.
 *   - media — the workhorse: contained image + text.
 *   - chip  — genuinely slight items with a photo: compact dense row, small
 *             thumbnail.
 *   - text  — no real photo: a beat of pure typography.
 */
export type CardTier = 'hero' | 'media' | 'chip' | 'text';

/**
 * Substance at/above which a photo-bearing item earns the hero treatment.
 * Calibrated by sweeping the real 698-item corpus (2026-07-21): this lands
 * total heroes (score ∪ `defining`, after spacing) at 10.0%, mid-band of the
 * 8-12% #1017 asks for. Exported so it is assertable and tunable.
 */
export const HERO_SCORE_THRESHOLD = 0.4;

/**
 * Substance at/above which a photo-bearing item earns the workhorse `media`
 * card rather than the compact `chip`. Roughly the corpus median for
 * photo-bearing items — the point where an item stops being a sighting and
 * starts being an article.
 */
export const MEDIA_SCORE_THRESHOLD = 0.3;

/**
 * Minimum items between two *score-derived* heroes. Not a quota on how many
 * heroes may exist — purely a rhythm guard so two big cards never collide.
 * `significance: 'defining'` ignores it entirely (see below).
 */
export const HERO_MIN_GAP = 4;

/**
 * Extra id-seeded slack on top of `HERO_MIN_GAP` (so the real gap is 4..6).
 * This is the surviving piece of the 2026-07-10 aperiodicity requirement: a
 * fixed gap makes hero placement a predictable beat, which is the pattern the
 * eye tunes out.
 */
export const HERO_GAP_JITTER = 3;

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

/** The aperiodic minimum spacing this item would require after a hero. */
function heroGapFor(item: ContentItem): number {
  return HERO_MIN_GAP + seededJitter(item.id, HERO_GAP_JITTER);
}

/**
 * The tier an item earns from its own content alone — no sequence position,
 * no pacing. Exported for tests and for anyone debugging why a card is the
 * size it is.
 *
 * `significance` (2026-07-18, docs/decisions.md) is an OVERRIDE, never
 * overridden: it is an explicit authoring judgment about real-world
 * importance, so a computed score can neither raise nor lower it.
 *   - `'defining'` -> unconditionally `hero`.
 *   - `'notable'`  -> a `media` FLOOR: it can still score its way up to
 *     `hero`, but never falls below `media`, photo or no photo.
 *
 * For everything else (599 of 698 items — the actual uniformity problem) the
 * tier is a pure function of `substanceScore`, gated on whether there is a
 * real photo to build an image card out of: the era-art stand-in is not a
 * photo, so a no-photo item renders as `text` however substantial it is.
 */
export function baseTierFor(item: ContentItem): CardTier {
  if (item.significance === 'defining') return 'hero';

  const score = substanceScore(item);
  const hasImage = hasRealPrimaryImage(item);

  if (hasImage && score >= HERO_SCORE_THRESHOLD) return 'hero';
  if (item.significance === 'notable') return 'media';
  if (!hasImage) return 'text';
  return score >= MEDIA_SCORE_THRESHOLD ? 'media' : 'chip';
}

/**
 * Assigns each item in a chronological sequence a card tier. Two passes:
 * pass 1 scores each item independently from its own content (`baseTierFor`),
 * pass 2 walks the sequence applying the single surviving pacing rule —
 * spacing out heroes.
 *
 * Pure function of the sequence + ids: same input always produces the same
 * tiers, so scrolling away and back never reshuffles what a user already saw.
 * The only nondeterminism-shaped thing in here is `seededJitter`, which is a
 * hash of the item id, not a random number.
 *
 * INVARIANTS (see feed-tiers.test.ts, which asserts each one):
 *   1. `significance: 'defining'` is ALWAYS `hero` — never spaced out. Two
 *      defining events landing close together both rendering hero is
 *      accurate, not a pacing bug.
 *   2. `significance: 'notable'` never falls below `media`.
 *   3. Pacing can only ever move a card DOWN ONE STEP, from `hero` to
 *      `media`. It can no longer push a substantial item to `text` — that
 *      demotion was the #1017 bug and it is gone.
 */
/**
 * Tiers a card that plays a video inline can wear (#2080).
 *
 * Every playable video in the feed now renders the SAME way — a full-width 16:9
 * poster with a large centered play glyph, the treatment the video-record cards
 * already used (Joey, 2026-08-13, rejecting #2063's compact row). Two of the
 * four tiers cannot carry that poster honestly:
 *
 *   - `chip` is a ~56px dense row whose whole identity is "a slight item". A
 *     16:9 poster under it is roughly 4x the height of the card it hangs from,
 *     so the silhouette that makes chips read as slight is destroyed — and the
 *     claim was wrong anyway: a moment with watchable footage is not a sighting.
 *   - `text` is the no-photo breather, "a beat of pure typography". A card with
 *     a big poster on it is not that, and the breather's left-rule-only box
 *     around a full-bleed poster reads as an unfinished card rather than a
 *     deliberate one.
 *
 * So a card that plays a video is at least `media` — the workhorse box, which is
 * exactly the box the video-record cards use. `hero` and `media` are untouched:
 * this is a floor, never a cap, and never a demotion.
 */
export const INLINE_VIDEO_MIN_TIER: CardTier = 'media';

/**
 * Applies the {@link INLINE_VIDEO_MIN_TIER} floor to the cards that actually
 * render an inline player.
 *
 * Keyed on OWNERSHIP, not on `item.video`: when two moments in the rendered list
 * embed the same YouTube id only the first plays it (`inlineVideoMomentIds` in
 * era-feed.ts), and the deferring card renders no poster at all — promoting it
 * would inflate a card for a video it never shows.
 *
 * Returns a new Map; the input is left alone so `assignFeedTiers`'s own output
 * stays inspectable (and its invariants independently assertable).
 */
export function withInlineVideoTiers(
  tiers: ReadonlyMap<string, CardTier>,
  videoOwnerIds: ReadonlySet<string>,
): Map<string, CardTier> {
  const out = new Map(tiers);
  for (const id of videoOwnerIds) {
    const tier = out.get(id);
    if (tier === 'chip' || tier === 'text') out.set(id, INLINE_VIDEO_MIN_TIER);
  }
  return out;
}

export function assignFeedTiers(items: ContentItem[]): Map<string, CardTier> {
  const tiers = new Map<string, CardTier>();
  let sinceHero = Infinity;

  for (const item of items) {
    let tier = baseTierFor(item);

    if (tier === 'hero') {
      if (item.significance === 'defining' || sinceHero >= heroGapFor(item)) {
        sinceHero = 0;
      } else {
        // Too close behind another hero. Step down exactly one tier — this
        // item has a real photo and cleared the hero bar, so `media` is the
        // honest floor. It is never demoted further, and never on any basis
        // other than adjacency to another hero.
        tier = 'media';
        sinceHero += 1;
      }
    } else {
      sinceHero += 1;
    }

    tiers.set(item.id, tier);
  }

  return tiers;
}
