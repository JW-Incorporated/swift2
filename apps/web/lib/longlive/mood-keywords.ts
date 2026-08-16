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
    // #1986 — the breakup script the lexicon was missing. "leaves you" (the
    // present-tense form of "left me"), and the 1am-spiral rumination/self-blame
    // that is the whole texture of the catalogue's saddest songs.
    'leaves you', 'leave you', 'leaving you', 'when someone leaves', 'someone leaves',
    'when they leave', 'walked out', 'walked away from me',
    'replaying', 'replay', 'keep replaying', 'cant stop replaying', 'going over it',
    'over and over', 'ruminating', 'my fault', 'it was my fault', 'all my fault',
    'everything i did wrong', 'what i did wrong', 'blaming myself', 'blame myself',
    'should have', 'shouldve', 'if only', 'wish i had done',
    // 'hungover' / 'hanging' (UK slang for hungover, NOT for drunk) are
    // deliberately NOT on this axis. They carry low energy and low valence,
    // which they get from LOW_ENERGY/LOW_VALENCE below, and `hasSignal` is
    // satisfied by either of those alone — so a bare "hungover" still returns
    // songs without claiming the reader's heart is broken. Putting them here
    // surfaced breakup songs for a plain hangover.
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
    // #1999 — fan vernacular: era names used as moods. The quiet, wistful eras.
    'folklore', 'folklore era', 'evermore era', 'cottagecore', 'melancholy', 'melancholic',
  ],
  joy: [
    'happy', 'happiness', 'joy', 'joyful', 'ecstatic', 'thrilled', 'giddy', 'elated', 'delighted',
    'excited', 'celebrating', 'celebrate', 'in love', 'butterflies', 'smiling', 'glowing', 'blissful',
    'good mood', 'great mood', 'buzzing', 'over the moon', 'grateful', 'proud',
    'euphoric', 'giggling', 'beaming', 'best day', 'obsessed', 'floating', 'cheerful',
    // #1999 — the "lover era" as a mood. #1988 — good news is the everyday
    // register the box kept dead-ending: a promotion, a job, a graduation, a win.
    'lover era', 'promotion', 'got promoted', 'got the job', 'new job', 'got the offer',
    'graduated', 'engaged', 'good news', 'accomplished', 'nailed it', 'aced', 'passed my',
    'i won', 'we won', 'proud of myself',
  ],
  calm: [
    'calm', 'peaceful', 'peace', 'serene', 'relaxed', 'content', 'contented', 'cozy', 'cosy',
    'soft', 'gentle', 'quiet', 'settled', 'grounded', 'okay', 'fine', 'mellow',
    'chill', 'chilled', 'at ease', 'soothed', 'comfy', 'unhurried', 'slow morning',
    // NOTE: 'still' is NOT here (and no longer a LOW_ENERGY hint either) — it
    // fired `calm` on "I'm still furious" / "I still love him" and, as an energy
    // hint, cancelled "hyped" in "can't sit still" (#1999). Removed on both counts.
    // #1988 — the casual/low-key register. "meh", "bored", "idk" used to
    // dead-end in UNCLEAR; mapped to calm they return low-key songs instead.
    'meh', 'blah', 'bleh', 'bored', 'whatever', 'indifferent', 'so so', 'same old',
    'nothing much', 'idk', 'i dont know', 'i guess', 'nothing new',
  ],
  defiance: [
    'defiant', 'defiance', 'empowered', 'powerful', 'fierce', 'unstoppable', 'confident',
    'strong', 'done with', 'over it', 'moving on', 'reclaiming', 'proving', 'winning', 'unbothered',
    'petty', 'independent', 'free', 'liberated',
    'walking away', 'standing up', 'my turn', 'glow up', 'main character', 'unapologetic',
    'deserve better', 'moved on', 'no more', 'wont settle', 'blocked him', 'blocked her',
    // #1999 — fan vernacular: the "reputation / villain era" as a mood, plus the
    // main-character-energy family. These map to defiance (petty, powerful, done).
    'villain era', 'villain', 'reputation era', 'rep era', 'main character energy',
    'that girl', 'boss up', 'clapback', 'clap back', 'in my bag',
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
    // Intoxication and blunt-state vocabulary (fix-mood-over-refusal). "im
    // drunk" is a valid message and used to land zero axis hits. Maps to
    // catharsis rather than joy — it is as often maudlin as celebratory, and
    // catharsis ("feeling everything at once") is the axis that spans both.
    // Feral/unhinged/wired read as the same chaotic-release register.
    'drunk', 'tipsy', 'buzzed', 'wasted', 'hammered', 'tequila',
    'feral', 'unhinged', 'wired',
  ],
};

/**
 * Coarse energy/valence hints. These only refine the ordering when present
 * (see {@link scoreSong}) — a fallback vector without them still returns good
 * songs, so the lists stay short and unambiguous.
 */
// Only the NEGATED sit-still forms are high energy — "can't sit still" is
// agitation, but "i just want to sit still" is a wish for calm, so the bare
// phrase stays out.
const HIGH_ENERGY = ['pumped', 'hyped', 'dancing', 'dance', 'party', 'loud', 'driving', 'blasting', 'amped', 'wild', 'unhinged', 'feral', 'buzzing', 'restless', 'cant sit still', 'cannot sit still', 'not sit still', 'couldnt sit still', 'jittery', 'bouncing off the walls', 'vibrating', 'drunk', 'tipsy', 'buzzed', 'wasted', 'hammered', 'tequila', 'wired'];
// 'still' removed (#1999) — it cancelled "hyped" in "can't sit still". The
// small-hours markers 1am/2am/4am join 3am; ennui words read as low energy too.
const LOW_ENERGY = ['tired', 'sleepy', 'quiet', 'slow', 'calm', 'cozy', 'cosy', 'mellow', 'soft', '1am', '2am', '3am', '4am', 'late night', 'exhausted', 'drained', 'worn out', 'numb', 'heavy', 'flat', 'meh', 'blah', 'bored', 'sluggish', 'listless', 'hungover', 'hanging'];
const HIGH_VALENCE = ['happy', 'joy', 'joyful', 'excited', 'in love', 'celebrating', 'good', 'great', 'amazing', 'winning', 'blissful', 'grateful', 'proud', 'promotion', 'promoted', 'got the job', 'good news', 'graduated', 'engaged', 'accomplished', 'nailed it'];
const LOW_VALENCE = ['sad', 'heartbroken', 'depressed', 'down', 'miserable', 'lonely', 'crying', 'grief', 'hopeless', 'empty', 'grumpy', 'annoyed', 'frustrated', 'angry', 'awful', 'terrible', 'horrible', 'rough', 'bad day', 'worst', 'sucks', 'exhausted', 'drained', 'anxious', 'stressed', 'upset', 'bummed', 'gloomy', 'hungover', 'hanging'];

/**
 * #1999 — the anticipation/excitement register. Deliberately NOT a ninth song
 * axis (that would mean re-scoring all 162 catalogue songs); at the query layer
 * it maps to `joy` — the nearest asserted axis for excitement — and, crucially,
 * forces HIGH energy and HIGH valence, which is what actually surfaces the
 * up-tempo, forward-leaning songs a hyped reader wants. Forcing high energy is
 * also the other half of the token-cancellation fix: an anticipation hit makes a
 * stray low-energy word ("still", "heavy") stop dragging the energy target down.
 */
const ANTICIPATION_KEYWORDS = [
  'hyped', 'hype', 'so hyped', 'cant wait', 'cannot wait', 'can not wait', 'counting down',
  'countdown', 'count down', 'so ready', 'ready for this', 'on the edge of my seat',
  'nervous excited', 'nervexcited', 'the drop', 'drop day', 'release day', 'new album',
  'new era', 'ts12', 'the vault', 'eras tour', 'tour tickets', 'presale', 'anticipation',
  'anticipating',
];

/**
 * Anticipation SUPPORT words — agitation phrasings that mean excitement inside a
 * hype message ("HYPED… cannot sit still") but panic or insomnia on their own
 * ("freaking out about my exam", "so restless tonight, can't sleep"). They count
 * toward anticipation ONLY when a core {@link ANTICIPATION_KEYWORDS} hit is
 * already present, so anxiety is never rebranded as celebration: solo, they
 * assert nothing here and fall through to the axis lexicon / energy hints.
 */
const ANTICIPATION_SUPPORT = [
  'cant sit still', 'cannot sit still', 'not sit still', 'couldnt sit still',
  'losing my mind', 'freaking out', 'restless', 'jittery', 'buzzing',
  'butterflies', 'giddy',
];

/**
 * #1985 — loneliness, disambiguated from romantic longing. Both share the
 * `longing` axis, which is why "I just want to feel less alone" returned august /
 * Cruel Summer / Dress (songs about wanting a PERSON). A loneliness hit asserts
 * longing but steers to LOW energy and LOW valence — the quiet, company-keeping
 * songs that sit with you — instead of the up-tempo desire songs.
 */
const LONELINESS_KEYWORDS = [
  'less alone', 'feel less alone', 'want to feel less alone', 'so alone', 'all alone',
  'feeling alone', 'feel alone', 'lonely', 'loneliness', 'isolated', 'by myself',
  'on my own', 'no one around', 'nobody around', 'left out', 'left behind', 'invisible',
  'unseen', 'forgotten', 'no one understands', 'no one gets it', 'want company', 'need company',
  'wish i had someone', 'disconnected',
];

/**
 * #1984 — explicit bereavement signal. The ONLY thing that unlocks the grief
 * canon ({@link BEREAVEMENT_SLUGS} in mood-match.ts) for a query. Held to
 * language that actually names a death, a grief, or a terminal illness — NOT the
 * breakup sense of "lost him"/"lost her" (which stays ordinary heartbreak), so
 * a song about a dead child never surfaces for "I lost my boyfriend".
 */
const BEREAVEMENT_KEYWORDS = [
  'died', 'has died', 'she died', 'he died', 'they died', 'death', 'passed away',
  'passed on', 'passed last', 'no longer with us', 'funeral', 'grief', 'grieving',
  'grieve', 'grieved', 'mourning', 'mourn', 'bereaved', 'bereavement', 'eulogy',
  'buried', 'gravestone', 'graveside', 'cancer', 'hospice', 'terminally ill',
  'terminal illness', 'miscarriage', 'stillbirth', 'stillborn',
  'lost my mom', 'lost my mum', 'lost my mother', 'lost my dad', 'lost my father',
  'lost my grandma', 'lost my grandmother', 'lost my grandpa', 'lost my grandfather',
  'lost my son', 'lost my daughter', 'lost my child', 'lost my baby', 'lost my brother',
  'lost my sister', 'lost my husband', 'lost my wife', 'lost my best friend', 'lost my friend',
  'lost my dog', 'lost my cat', 'lost my pet', 'lost someone', 'lost a loved one', 'death of',
];

/**
 * Figurative death frames, stripped from the text BEFORE the bereavement
 * keywords are matched. English leans on death for emphasis constantly —
 * "sick to death of my ex", "scared to death about my exam", "love him to
 * death", "this album will be the death of me", "i died laughing" — and every
 * one of those contains a bare bereavement keyword ('death', 'died'). Without
 * this strip they set the bereavement flag, force the heavy/quiet steering, and
 * hand Ronan to someone who is annoyed at their ex — the exact #1984 failure
 * this gate exists to close, re-opened through hyperbole. Same trade the crisis
 * lexicon's HYPERBOLE_MARKERS make (mood-safety.ts), applied to grief.
 *
 * Each frame is unmistakably figurative: "…to death" is an intensifier, never a
 * report of a death; a first-person "i died" cannot be literal (the writer is
 * typing); "nearly/almost died" reports a survival, not a bereavement. Genuine
 * losses keep their signal through the many frames we do NOT strip ("passed
 * away", "funeral", "grieving", "lost my…", "death of my father" — 'death of'
 * survives because only the self-directed 'death of me' is stripped).
 */
const FIGURATIVE_DEATH_FRAMES = [
  'to death', // sick/scared/bored/worried/love you … to death
  'death of me', // "this album will be the death of me"
  'i died', 'we died', 'literally died', 'nearly died', 'almost died',
  'died laughing', 'died of laughter', 'died of embarrassment', 'died of cringe',
  'died of shame', 'died of happiness', 'died of joy', 'died of excitement',
  'died of boredom', 'died of cuteness',
];

/** Remove every figurative death frame from an already-normalized haystack. */
function stripFigurativeDeath(hay: string): string {
  let out = hay;
  for (const frame of FIGURATIVE_DEATH_FRAMES) {
    out = out.split(` ${frame} `).join(' ');
  }
  return out;
}

/**
 * True when the reader's words carry an explicit bereavement/death signal. Used
 * by the route AND by {@link keywordQuery} to set {@link MoodQuery.bereavement},
 * the flag that gates the grief canon. Runs only AFTER the crisis check (see the
 * route) — it can never re-open a crisis bypass. It is intentionally allowed to
 * UNLOCK grief songs, never to force them: an ordinary bereavement query still
 * ranks the whole catalogue, the grief songs just stop being excluded.
 * Figurative death idioms ({@link FIGURATIVE_DEATH_FRAMES}) are stripped first,
 * so "sick to death of my ex" / "i died laughing" never unlock the grief canon.
 */
export function hasBereavementSignal(text: string): boolean {
  const hay = stripFigurativeDeath(normalize(text));
  return BEREAVEMENT_KEYWORDS.some((w) => contains(hay, w));
}

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
  // Figurative death frames are stripped here too (not just in the bereavement
  // check): "sick TO DEATH of my ex" should match 'sick of' (anger) once the
  // intensifier is out of the way, instead of matching nothing.
  const hay = stripFigurativeDeath(normalize(text));
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

  // #1999 — anticipation/excitement. Maps to joy (the nearest asserted axis) and
  // below forces high energy/valence. Saturates like the axis loop. Support
  // words (agitation that reads as excitement only in a hype context) count
  // ONLY when a core anticipation word already hit — "freaking out about my
  // exam" must never be rebranded as celebration.
  const anticipationCore = ANTICIPATION_KEYWORDS.filter((w) => contains(hay, w)).length;
  const anticipation =
    anticipationCore > 0
      ? anticipationCore + ANTICIPATION_SUPPORT.filter((w) => contains(hay, w)).length
      : 0;
  if (anticipation > 0) {
    moods.joy = Math.max(moods.joy ?? 0, Math.min(1, 0.6 + 0.2 * (anticipation - 1)));
  }

  // #1985 — loneliness asserts longing but, below, steers to quiet/low valence so
  // it never reads as romantic desire.
  const lonely = LONELINESS_KEYWORDS.some((w) => contains(hay, w));
  if (lonely) moods.longing = Math.max(moods.longing ?? 0, 0.6);

  // #1984 — an explicit bereavement signal ("my grandma just died") asserts
  // heartbreak so there is something for the matcher to rank on (a bare "died"
  // hits no axis and would otherwise dead-end in UNCLEAR), and — via the flag set
  // at the end — UNLOCKS the grief canon so a genuine bereavement DOES reach the
  // songs written for exactly this. Steered heavy/quiet below.
  const bereaved = hasBereavementSignal(text);
  if (bereaved) moods.heartbreak = Math.max(moods.heartbreak ?? 0, 0.7);

  const query: MoodQuery = { moods };

  const highWord = HIGH_ENERGY.some((w) => contains(hay, w));
  const lowWord = LOW_ENERGY.some((w) => contains(hay, w));
  // Anticipation forces HIGH energy and SUPPRESSES any low-energy word — this is
  // the "hyped … can't sit still" cancellation fix (#1999): a stopword-ish low
  // token can no longer negate an explicit anticipation signal. Loneliness forces
  // LOW. Otherwise the original mutually-exclusive high/low rule applies.
  if (anticipation > 0) query.energy = 0.85;
  else if (lonely || bereaved) query.energy = 0.2;
  else if (highWord && !lowWord) query.energy = 0.85;
  else if (lowWord && !highWord) query.energy = 0.2;

  const happyWord = HIGH_VALENCE.some((w) => contains(hay, w));
  const sadWord = LOW_VALENCE.some((w) => contains(hay, w));
  if (lonely || bereaved) query.valence = 0.15;
  else if (anticipation > 0 && !sadWord) query.valence = 0.8;
  else if (happyWord && !sadWord) query.valence = 0.85;
  else if (sadWord && !happyWord) query.valence = 0.15;

  // #1984 — unlock the grief canon ONLY on an explicit bereavement signal. Never
  // forces a grief song; it lets the matcher stop excluding them (see mood-match).
  if (bereaved) query.bereavement = true;

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
