/**
 * Mood Chat — Stage 4: the keyword fallback matcher.
 *
 * The degraded path. Whenever the classifier can't run — no ANTHROPIC_API_KEY,
 * the daily cap is hit, or the model call fails twice — the route routes the
 * reader's words through HERE instead, deriving a {@link MoodQuery} from a
 * hand-built lexicon. It is pure, synchronous, free, and always available, so
 * the endpoint degrades to REAL songs (spec non-negotiable #5) rather than an
 * error. Same discipline as the worker's rule-based classifier: degraded
 * quality, never degraded availability.
 *
 * It maps words to the eight mood axes (and to loose energy/valence hints);
 * {@link matchMoods} does the actual ranking. It never invents a song — it only
 * produces a mood vector, and the matcher can only return catalogue entries.
 */

import { MOOD_AXES, type MoodAxis } from './types';
import type { MoodQuery } from './mood-match';

/**
 * Axis lexicon: each mood axis maps to the words/short phrases that assert it.
 * Kept literal and legible rather than clever — this is a fallback, and a
 * fallback that is easy to audit beats one that is easy to be wrong. Matched
 * as whole tokens against normalized text so "joyful" counts for `joy` but a
 * word merely CONTAINING an axis name doesn't fire spuriously.
 */
const AXIS_KEYWORDS: Record<MoodAxis, readonly string[]> = {
  heartbreak: [
    'heartbroken', 'heartbreak', 'heartbreaking', 'broken', 'breakup', 'broke up', 'dumped',
    'devastated', 'crushed', 'grief', 'grieving', 'crying', 'cried', 'tears', 'hurt', 'hurting',
    'lost him', 'lost her', 'lost them', 'miss him', 'miss her', 'miss them', 'betrayed',
  ],
  anger: [
    'angry', 'anger', 'furious', 'rage', 'raging', 'mad', 'pissed', 'livid', 'resentful',
    'bitter', 'seething', 'wronged', 'spiteful', 'vengeful', 'revenge', 'hate', 'hateful',
  ],
  nostalgia: [
    'nostalgic', 'nostalgia', 'memories', 'remember', 'remembering', 'reminiscing', 'the past',
    'used to', 'back then', 'younger', 'childhood', 'good old days', 'throwback', 'wistful',
  ],
  joy: [
    'happy', 'happiness', 'joy', 'joyful', 'ecstatic', 'thrilled', 'giddy', 'elated', 'delighted',
    'excited', 'celebrating', 'celebrate', 'in love', 'butterflies', 'smiling', 'glowing', 'blissful',
  ],
  calm: [
    'calm', 'peaceful', 'peace', 'serene', 'relaxed', 'content', 'contented', 'cozy', 'cosy',
    'soft', 'gentle', 'still', 'quiet', 'settled', 'grounded', 'okay', 'fine', 'mellow',
  ],
  defiance: [
    'defiant', 'defiance', 'empowered', 'powerful', 'fierce', 'unstoppable', 'confident',
    'strong', 'done with', 'over it', 'moving on', 'reclaiming', 'proving', 'winning', 'unbothered',
    'petty', 'independent', 'free', 'liberated',
  ],
  longing: [
    'longing', 'yearning', 'pining', 'craving', 'wanting', 'wish', 'wishing', 'aching', 'ache',
    'missing', 'lonely', 'loneliness', 'alone', 'unrequited', 'crush', 'hoping', 'waiting',
  ],
  catharsis: [
    'cathartic', 'catharsis', 'release', 'let it out', 'letting go', 'scream', 'screaming',
    'purge', 'processing', 'feel everything', 'all the feelings', 'overwhelmed', 'raw', 'venting',
  ],
};

/**
 * Coarse energy/valence hints. These only refine the ordering when present
 * (see {@link scoreSong}) — a fallback vector without them still returns good
 * songs, so the lists stay short and unambiguous.
 */
const HIGH_ENERGY = ['pumped', 'hyped', 'dancing', 'dance', 'party', 'loud', 'driving', 'blasting', 'amped', 'wild', 'unhinged', 'feral'];
const LOW_ENERGY = ['tired', 'sleepy', 'quiet', 'still', 'slow', 'calm', 'cozy', 'cosy', 'mellow', 'soft', '3am', 'late night'];
const HIGH_VALENCE = ['happy', 'joy', 'joyful', 'excited', 'in love', 'celebrating', 'good', 'great', 'amazing', 'winning', 'blissful'];
const LOW_VALENCE = ['sad', 'heartbroken', 'depressed', 'down', 'miserable', 'lonely', 'crying', 'grief', 'hopeless', 'empty'];

/** Fold to whole-token comparison form (lowercase, punctuation → spaces). */
function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

/** True when the normalized haystack contains `needle` as a whole token/phrase. */
function contains(haystack: string, needle: string): boolean {
  return haystack.includes(` ${needle.replace(/['’`]/g, '')} `);
}

/**
 * Derive a {@link MoodQuery} from raw text with zero cost and no model.
 *
 * Each axis's weight is the share of its keywords that hit, lightly saturating
 * (so one strong hit already asserts the axis without a single word being able
 * to max it). Axes with no hits are left UNSET — the matcher treats an unset
 * axis as "don't care", never "must be absent", so a sparse fallback vector
 * still ranks sensibly. Energy/valence are set only when a hint fires.
 *
 * Returns a query whose `moods` may be empty when nothing matched; the route
 * treats an empty vector as out-of-scope (Block 6) rather than matching noise.
 */
export function keywordQuery(text: string): MoodQuery {
  const hay = normalize(text);
  const moods: Partial<Record<MoodAxis, number>> = {};

  for (const axis of MOOD_AXES) {
    const words = AXIS_KEYWORDS[axis];
    const hits = words.filter((w) => contains(hay, w)).length;
    if (hits === 0) continue;
    // Saturating: 1 hit → 0.6, 2 → ~0.8, 3+ → ~0.9+. One clear signal is
    // enough to assert an axis; extra hits nudge it toward certainty.
    moods[axis] = Math.min(1, 0.6 + 0.2 * (hits - 1));
  }

  const query: MoodQuery = { moods };

  const high = HIGH_ENERGY.some((w) => contains(hay, w));
  const low = LOW_ENERGY.some((w) => contains(hay, w));
  if (high && !low) query.energy = 0.85;
  else if (low && !high) query.energy = 0.2;

  const happy = HIGH_VALENCE.some((w) => contains(hay, w));
  const sad = LOW_VALENCE.some((w) => contains(hay, w));
  if (happy && !sad) query.valence = 0.85;
  else if (sad && !happy) query.valence = 0.15;

  return query;
}

/** True when a derived query asserts no mood axis at all (nothing to match on). */
export function isEmptyQuery(query: MoodQuery): boolean {
  return Object.keys(query.moods).length === 0;
}
