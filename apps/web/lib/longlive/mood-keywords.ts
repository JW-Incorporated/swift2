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
 *
 * COVERAGE IS A SAFETY PROPERTY, not a nice-to-have (see the note on
 * {@link keywordQuery}). When this lexicon misses, the route used to answer
 * "that's outside what I can help with" — telling a reader who typed "I'm sad"
 * that their feeling is out of scope. The route no longer does that, but the
 * lexicon still has to carry the ENTIRE ordinary emotional range, because that
 * range is the product: grumpy, annoyed, exhausted, numb, anxious, lonely and
 * bitter are what the catalogue is about. Err toward listing a word.
 */
const AXIS_KEYWORDS: Record<MoodAxis, readonly string[]> = {
  heartbreak: [
    'heartbroken', 'heartbreak', 'heartbreaking', 'broken', 'breakup', 'broke up', 'dumped',
    'devastated', 'crushed', 'grief', 'grieving', 'crying', 'cried', 'tears', 'hurt', 'hurting',
    'lost him', 'lost her', 'lost them', 'miss him', 'miss her', 'miss them', 'betrayed',
    // Ordinary sadness — the single most common thing a reader types, and the
    // thing this fallback most embarrassingly used to miss.
    'sad', 'sadness', 'unhappy', 'miserable', 'depressed', 'depressing', 'down bad',
    'feeling down', 'feeling low', 'feeling blue', 'gutted', 'wrecked', 'shattered',
    'destroyed', 'rejected', 'abandoned', 'ghosted', 'left me', 'broke my heart',
    'broken hearted', 'brokenhearted', 'heartsick', 'sobbing', 'weeping', 'teary',
    'numb', 'empty', 'hollow', 'regret', 'disappointed', 'let down', 'unloved',
    'cheated on', 'he left', 'she left', 'they left', 'it ended', 'its over',
  ],
  anger: [
    'angry', 'anger', 'furious', 'rage', 'raging', 'mad', 'pissed', 'livid', 'resentful',
    'bitter', 'seething', 'wronged', 'spiteful', 'vengeful', 'revenge', 'hate', 'hateful',
    // The low-grade end of anger. "Grumpy" and "pissing me off" belong HERE,
    // not in a refusal.
    'grumpy', 'grouchy', 'cranky', 'crabby', 'annoyed', 'annoying', 'irritated',
    'irritating', 'irritable', 'frustrated', 'frustrating', 'frustration', 'piss',
    'fuming', 'fed up', 'sick of', 'sick and tired', 'ticked off', 'salty', 'snapped',
    'grudge', 'resentment', 'outraged', 'indignant', 'disrespected', 'screwed over',
    'infuriating', 'maddening', 'irate', 'stewing', 'simmering', 'everything sucks',
    'sucks', 'unfair', 'not fair', 'had enough',
  ],
  nostalgia: [
    'nostalgic', 'nostalgia', 'memories', 'remember', 'remembering', 'reminiscing', 'the past',
    'used to', 'back then', 'younger', 'childhood', 'good old days', 'throwback', 'wistful',
    'homesick', 'high school', 'back in the day', 'when we were', 'simpler times',
    'growing up', 'sentimental', 'old photos', 'those days',
  ],
  joy: [
    'happy', 'happiness', 'joy', 'joyful', 'ecstatic', 'thrilled', 'giddy', 'elated', 'delighted',
    'excited', 'celebrating', 'celebrate', 'in love', 'butterflies', 'smiling', 'glowing', 'blissful',
    'good mood', 'great mood', 'buzzing', 'over the moon', 'grateful', 'proud',
    'euphoric', 'giggling', 'beaming', 'best day', 'obsessed', 'floating', 'cheerful',
  ],
  calm: [
    'calm', 'peaceful', 'peace', 'serene', 'relaxed', 'content', 'contented', 'cozy', 'cosy',
    'soft', 'gentle', 'quiet', 'settled', 'grounded', 'okay', 'fine', 'mellow',
    'chill', 'chilled', 'at ease', 'soothed', 'comfy', 'unhurried', 'slow morning',
    // NOTE: 'still' was removed — it fired `calm` on "I'm still furious" and
    // "I still love him". It survives as a LOW_ENERGY hint below, where a
    // false hit only nudges ordering instead of asserting the wrong mood.
  ],
  defiance: [
    'defiant', 'defiance', 'empowered', 'powerful', 'fierce', 'unstoppable', 'confident',
    'strong', 'done with', 'over it', 'moving on', 'reclaiming', 'proving', 'winning', 'unbothered',
    'petty', 'independent', 'free', 'liberated',
    'walking away', 'standing up', 'my turn', 'glow up', 'main character', 'unapologetic',
    'deserve better', 'moved on', 'no more', 'wont settle', 'blocked him', 'blocked her',
  ],
  longing: [
    'longing', 'yearning', 'pining', 'craving', 'wanting', 'wish', 'wishing', 'aching', 'ache',
    'missing', 'lonely', 'loneliness', 'alone', 'unrequited', 'crush', 'hoping', 'waiting',
    'left out', 'isolated', 'disconnected', 'left behind', 'invisible', 'unseen',
    'unwanted', 'forgotten', 'on my own', 'by myself', 'no one understands',
    'no one gets it', 'far away', 'long distance', 'nobody', 'homesick',
  ],
  catharsis: [
    'cathartic', 'catharsis', 'release', 'let it out', 'letting go', 'scream', 'screaming',
    'purge', 'processing', 'feel everything', 'all the feelings', 'overwhelmed', 'raw', 'venting',
    // Overwhelm and depletion. Anxiety words live here too: "anxious" is not one
    // of the eight axes, and "everything at once" is the closest honest reading
    // of it — it is emphatically NOT a crisis signal (see mood-safety.ts).
    'exhausted', 'drained', 'burnt out', 'burned out', 'worn out', 'running on empty',
    'too much', 'falling apart', 'breaking down', 'cant cope', 'at my limit',
    'a mess', 'ugly crying', 'need to cry', 'anxious', 'anxiety', 'nervous',
    'worried', 'stressed', 'on edge', 'panicking', 'overthinking', 'spiraling',
    'spiralling', 'cant switch off', 'everything at once',
  ],
};

/**
 * Coarse energy/valence hints. These only refine the ordering when present
 * (see {@link scoreSong}) — a fallback vector without them still returns good
 * songs, so the lists stay short and unambiguous.
 */
const HIGH_ENERGY = ['pumped', 'hyped', 'dancing', 'dance', 'party', 'loud', 'driving', 'blasting', 'amped', 'wild', 'unhinged', 'feral', 'buzzing', 'restless'];
const LOW_ENERGY = ['tired', 'sleepy', 'quiet', 'still', 'slow', 'calm', 'cozy', 'cosy', 'mellow', 'soft', '3am', 'late night', 'exhausted', 'drained', 'worn out', 'numb', 'heavy', 'flat'];
const HIGH_VALENCE = ['happy', 'joy', 'joyful', 'excited', 'in love', 'celebrating', 'good', 'great', 'amazing', 'winning', 'blissful', 'grateful', 'proud'];
const LOW_VALENCE = ['sad', 'heartbroken', 'depressed', 'down', 'miserable', 'lonely', 'crying', 'grief', 'hopeless', 'empty', 'grumpy', 'annoyed', 'frustrated', 'angry', 'awful', 'terrible', 'horrible', 'rough', 'bad day', 'worst', 'sucks', 'exhausted', 'drained', 'anxious', 'stressed', 'upset', 'bummed', 'gloomy'];

/**
 * Hyperbole/idiom seeds (#1981). A figurative "die"/"kill" idiom carries a real
 * feeling but no literal mood word, so it lands ZERO axis hits and used to
 * dead-end in UNCLEAR ("this is killing me", "dying to see her live"). The
 * crisis suppressor in mood-safety.ts correctly clears these from the crisis
 * path — this is the other half of that decision: give the cleared idiom a
 * sensible default vector so the reader gets songs, not a blank.
 *
 * SAFETY: this runs only inside {@link keywordQuery}, which the route reaches
 * strictly AFTER {@link isCrisisText} has already returned false. It can never
 * re-open a crisis bypass — by the time we seed here, the crisis decision is
 * made and done. And we seed ONLY when nothing else matched, so an idiom never
 * overrides a genuine mood word elsewhere in the message.
 *
 * Two senses, mapped to the nearest of the eight axes:
 *  - excited/anticipation ("dying to see", "to die for", "die laughing") → joy,
 *    high energy, high valence.
 *  - impatient/self-conscious ("this is killing me", "die of embarrassment") →
 *    catharsis (where anxiety lives), mild energy, low-ish valence.
 */
const EXCITED_IDIOMS = ['dying to see', 'dying to', 'to die for', 'die laughing', 'dying laughing', 'die of laughter', 'die of happiness', 'die of joy', 'die of excitement'];
const ANXIOUS_IDIOMS = ['killing me', 'is killing me', 'die of embarrassment', 'die of cringe', 'die of shame', 'dying of embarrassment', 'die of boredom'];

/**
 * Inflections a listed keyword is allowed to appear in. A hand-built lexicon
 * cannot list every form of every word, and the gap is not harmless: "pissed"
 * was listed but "pissing me off" was not, which is precisely how the founder's
 * own test sentence came back as out-of-scope. Applied to the LAST word of a
 * phrase only, so multi-word entries keep their exact shape.
 *
 * Deliberately a short, boring list. Anything longer starts matching words that
 * merely share a prefix, which is the failure mode this file's whole-token
 * matching exists to avoid.
 */
const INFLECTIONS = ['', 's', 'es', 'd', 'ed', 'ing', 'in'] as const;

/** Fold to whole-token comparison form (lowercase, punctuation → spaces). */
function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

/**
 * True when the normalized haystack contains `needle` as a whole token/phrase,
 * in any of its {@link INFLECTIONS}. Still whole-token: "management" never
 * matches "anger", but "pissing" does match "piss".
 */
function contains(haystack: string, needle: string): boolean {
  const phrase = needle.replace(/['’`]/g, '');
  return INFLECTIONS.some((suffix) => haystack.includes(` ${phrase}${suffix} `));
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
 * Returns a query whose `moods` may be empty when nothing matched. The route
 * must NOT read that as out-of-scope — "the fallback lexicon didn't recognise
 * these words" and "this reader is asking me for legal advice" are different
 * facts, and conflating them is what made the bot refuse ordinary feelings.
 * See {@link hasSignal} and the route's Block 6 branch.
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

  // #1981 — a figurative die/kill idiom lands no axis hit and would dead-end in
  // UNCLEAR. Seed a default vector so it returns songs. Only when nothing else
  // matched (an idiom never overrides a real mood word), and only ever reached
  // AFTER the crisis check has cleared (see the note on IDIOM seeds).
  if (Object.keys(moods).length === 0) {
    if (EXCITED_IDIOMS.some((w) => contains(hay, w))) {
      moods.joy = 0.6;
    } else if (ANXIOUS_IDIOMS.some((w) => contains(hay, w))) {
      moods.catharsis = 0.6;
    }
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

/**
 * True when a query carries ANY usable signal — an asserted axis, or just an
 * energy/valence target. Broader than {@link isEmptyQuery} on purpose.
 *
 * `matchMoods` ranks fine on energy/valence alone (`scoreSong` folds them in
 * whether or not an axis was asserted), so "I'm sad" — which lands a valence
 * hint even if no axis word hits — has plenty to match on. Reading it as
 * "nothing to go on" is how that message ended up getting a refusal.
 *
 * {@link isEmptyQuery} keeps its narrower meaning for the chip path, where an
 * axis-less vector really is a malformed request.
 */
export function hasSignal(query: MoodQuery): boolean {
  return !isEmptyQuery(query) || query.energy !== undefined || query.valence !== undefined;
}
