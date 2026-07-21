import { isEraArtFallback } from './types';
import type { ContentItem } from './types';

/**
 * How much *article* there is in a moment, 0..1 — the input the feed's card
 * sizing reads so a meaty piece looks meaty and a one-line sighting looks
 * like one (issue #1017).
 *
 * Why a composite, and not just body length: measured across the 698-item
 * corpus (2026-07-21) the body is p10 353 / p50 635 / p90 885 chars — a 2.5x
 * spread. Sizing on that alone cannot read as "some are huge, some are
 * sparse"; every card would land in the same visual band, which is the exact
 * uniformity complaint. Photo count is the widest real signal in the corpus
 * (p50 1, p90 2, max 13 — 13x), so it carries equal weight to the body, and
 * the remaining production signals (sources, cross-links, rumors, video,
 * hidden clue, pull quote) top it up.
 *
 * Deliberately NOT in here:
 *   - `significance`. That is an authored judgment of real-world importance,
 *     and it is an OVERRIDE on the tier, not an input to the score — see
 *     assignFeedTiers. Folding it in would let a computed signal dilute it.
 *   - anything positional. `substanceScore` is a pure function of the item:
 *     same item, same score, no matter where it sits in the feed.
 */

// ── Weights ─────────────────────────────────────────────────────────────────
// Exported individually so they are tunable and directly assertable in tests.
// They sum to 1, which is what makes the result a clean 0..1 (asserted in
// substance.test.ts, so a future edit that breaks the sum fails loudly rather
// than silently rescaling every threshold in feed-tiers.ts).

/** Body length, log-scaled. Co-lead signal: it is what "long article" means. */
export const WEIGHT_BODY = 0.3;
/** Photo count. Co-lead signal: the widest real spread in the corpus. */
export const WEIGHT_PHOTOS = 0.3;
/** Citations — a well-sourced moment is a researched moment. */
export const WEIGHT_SOURCES = 0.15;
/** Cross-links out to other content: this moment is a hub, not a leaf. */
export const WEIGHT_RELATED = 0.08;
/** An embedded official video — a whole extra media surface on the page. */
export const WEIGHT_VIDEO = 0.07;
/** A planted hidden clue — the site's signature payoff treatment. */
export const WEIGHT_HIDDEN_CLUE = 0.05;
/** Attributed rumors — a "What's rumored" section is real extra page. */
export const WEIGHT_RUMORS = 0.03;
/** A pull quote — a small typographic feature, so a small weight. */
export const WEIGHT_PULL_QUOTE = 0.02;

// ── Normalisation constants ─────────────────────────────────────────────────
// Each raw signal maps to 0..1 before weighting. Saturation points are set
// near the corpus p90-p99 rather than the max: a single 13-photo outlier must
// not compress the 1-vs-3-photo difference that 90% of the feed lives in.

/** Body chars at/below this contribute nothing — a stub is a stub. Corpus p10 is 353. */
export const BODY_FLOOR_CHARS = 250;
/** Body chars at/above this are full credit. Corpus p90 885, p99 1689, max 1995. */
export const BODY_SATURATION_CHARS = 1400;
/** Real photos for full credit. Corpus p50 1, p90 2, p99 7 — 5 is already a gallery. */
export const PHOTO_SATURATION = 5;
/** Sources for full credit. Corpus p50 2, p90 3, max 7. */
export const SOURCE_SATURATION = 4;
/** relatedIds for full credit. Corpus is mostly 0; p99 4, max 11. */
export const RELATED_SATURATION = 3;
/** Rumor notes for full credit. */
export const RUMOR_SATURATION = 2;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Log-scaled 0..1 between a floor and a saturation point. Log rather than
 * linear so the corpus's narrow 2.5x body spread still resolves at the low
 * end (350 -> 600 chars moves the needle) instead of everything real
 * clustering at the top of a range stretched to fit a rare 2000-char outlier.
 */
function logNorm(value: number, floor: number, saturation: number): number {
  if (value <= floor) return 0;
  return clamp01(Math.log(value / floor) / Math.log(saturation / floor));
}

/** Linear 0..1, saturating (not clipping to a hard max) at `saturation`. */
function countNorm(count: number, saturation: number): number {
  return clamp01(count / saturation);
}

/** Total characters of editorial body prose. */
export function bodyChars(item: ContentItem): number {
  return item.body.reduce((sum, p) => sum + p.length, 0);
}

/**
 * Real photos attached to the moment — every gallery entry that is not the
 * `/eras/<id>.png` stand-in. Counts 'reference'/'archival' entries too: they
 * are genuine images that make the page bigger, even though only a 'primary'
 * one can front a hero card (`hasRealPrimaryImage`).
 */
export function realPhotoCount(item: ContentItem): number {
  return item.images.filter((i) => !isEraArtFallback(i.url)).length;
}

/**
 * Composite 0..1 substance score for one moment. Pure: no sequence position,
 * no randomness, no clock. Same item always scores the same.
 */
export function substanceScore(item: ContentItem): number {
  const body = logNorm(bodyChars(item), BODY_FLOOR_CHARS, BODY_SATURATION_CHARS);
  const photos = countNorm(realPhotoCount(item), PHOTO_SATURATION);
  const sources = countNorm(item.sources?.length ?? 0, SOURCE_SATURATION);
  const related = countNorm(item.relatedIds?.length ?? 0, RELATED_SATURATION);
  const rumors = countNorm(item.rumors?.length ?? 0, RUMOR_SATURATION);
  const video = item.video ? 1 : 0;
  const hiddenClue = item.hiddenClue ? 1 : 0;
  const pullQuote = item.pullQuote ? 1 : 0;

  return clamp01(
    body * WEIGHT_BODY +
      photos * WEIGHT_PHOTOS +
      sources * WEIGHT_SOURCES +
      related * WEIGHT_RELATED +
      rumors * WEIGHT_RUMORS +
      video * WEIGHT_VIDEO +
      hiddenClue * WEIGHT_HIDDEN_CLUE +
      pullQuote * WEIGHT_PULL_QUOTE,
  );
}

/** The weights, for tests and for anyone tuning them. Sums to 1. */
export const SUBSTANCE_WEIGHTS = {
  body: WEIGHT_BODY,
  photos: WEIGHT_PHOTOS,
  sources: WEIGHT_SOURCES,
  related: WEIGHT_RELATED,
  video: WEIGHT_VIDEO,
  hiddenClue: WEIGHT_HIDDEN_CLUE,
  rumors: WEIGHT_RUMORS,
  pullQuote: WEIGHT_PULL_QUOTE,
} as const;
