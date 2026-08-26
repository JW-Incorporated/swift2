// Visibility / recency tiering. Decides how hard every layer looks at an item:
// latest-news + marquee items get max scrutiny (multi-source verification,
// independent corroboration, strict tone + image review); obscure catalog
// trivia gets the cheap deterministic path. This is what makes "especially the
// latest news / highest-visibility topics" a first-class dial, per the brief.
import { CONFIG } from '../config.mjs';

const V = CONFIG.visibility;

/** 0..~10 visibility score. Higher = more reach = stricter checking. */
export function visibilityScore(item) {
  let score = 0;

  // Explicit significance (item.significance, docs/decisions.md 2026-07-18) is
  // an authorial judgment about real-world career importance, not a keyword
  // guess — found in review (2026-07-20): the heuristics below could score a
  // 'defining'/'notable' item as 'normal' tier just because it landed in an
  // older era or missed the marquee-hook wordlist, which meant the very items
  // the top-100 project marked as most important could dodge the
  // photo-sparsity/depth scrutiny that's supposed to keep them the deepest
  // pages on the site. Always routes to 'high' tier — see highTierThreshold.
  if (item.raw?.significance === 'defining' || item.raw?.significance === 'notable') {
    score += V.highTierThreshold;
  }

  // Latest-news eras: casual wording here is the highest-risk failure mode.
  if (V.latestNewsEras.includes(item.era)) score += 4;

  // Category reach (moments only carry a category).
  if (item.category && V.categoryWeight[item.category]) score += V.categoryWeight[item.category];

  // Marquee hooks in the title (engagement, wedding, album, records, deaths…).
  const hay = `${item.title} ${item.texts?.snippet ?? ''}`.toLowerCase();
  if (V.marqueeHooks.some((h) => hay.includes(h))) score += 3;

  // Theories that assert a strong outcome are higher-stakes to get right.
  if (item.type === 'theory' && (item.outcome === 'confirmed' || item.confidence === 'official')) score += 1;

  return score;
}

export function tier(item) {
  return visibilityScore(item) >= V.highTierThreshold ? 'high' : 'normal';
}

/** Split a corpus into high/normal tiers (for routing agent scrutiny). */
export function byTier(items) {
  const high = [];
  const normal = [];
  for (const it of items) (tier(it) === 'high' ? high : normal).push(it);
  return { high, normal };
}
