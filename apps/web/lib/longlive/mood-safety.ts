/**
 * Mood Chat — Stage 4: the safety layer.
 *
 * A "tell me how you're feeling" box on a Taylor Swift site WILL receive real
 * distress, some of it from teenagers (docs/content-ops/mood-chat-safety-language.md
 * — "a predictable Tuesday"). This module is the duty-of-care core of the API
 * route, and it is deliberately DETERMINISTIC and free: the crisis path must
 * never depend on an API key, a spend cap, or a network round-trip. It runs
 * BEFORE any model call and BEFORE matching (spec Stage 4), so a reader in
 * crisis gets resources even when the classifier is degraded, capped, or down.
 *
 * All user-facing copy here is transcribed VERBATIM from the founder-approved
 * safety doc — do not paraphrase. Wyatt approved Blocks 1, 2, and 6 as drafted
 * (2026-07-20); the page must render these words, not invent softer ones.
 */

/**
 * Block 1 — the crisis response. When a crisis signal is detected we return
 * THIS and nothing else: no playlist, no songs. A song is the wrong answer to
 * "I want to die." Paragraphs are stored as plain text (the words are what is
 * approved; the page owns presentation) — the resource specifics (988, HOME to
 * 741741, findahelpline.com) are load-bearing and must survive edits intact.
 */
export const CRISIS_MESSAGE: readonly string[] = [
  "I'm really glad you told me.",
  "I'm a music recommender — I'm not equipped for what you're carrying right now, and you deserve better than a playlist for it.",
  'If you’re in the US, you can call or text 988 (Suicide & Crisis Lifeline) any time, or text HOME to 741741 for the Crisis Text Line. Outside the US: findahelpline.com lists free services by country.',
  "If you're in immediate danger, please call your local emergency number.",
  'The songs will still be here whenever you want them.',
] as const;

/**
 * Block 2 — the one added line above the songs for heavy-but-not-crisis moods
 * (genuine sadness, grief, heartbreak, loneliness — the normal heavy stuff
 * this feature exists for). Deliberately NOT a resources dump: that would
 * pathologize ordinary sadness. The distinction from Block 1 is real risk,
 * not a sad mood.
 */
export const HEAVY_INTRO =
  'Sitting with something heavy? These are the ones that tend to sit with you rather than try to fix it.';

/**
 * Block 6 — the refusal for out-of-scope requests (medical/legal/relationship
 * advice, or trying to use the bot as a general chatbot). Short, warm, no
 * lecture; keeps the bot in its lane, which is also the cheapest lane.
 */
export const REFUSAL_MESSAGE =
  "That's outside what I can help with — I only really know one thing, which is which Taylor song fits a feeling. Want to try me on that?";

/**
 * NOT Block 6. This is the "I read it, I just couldn't find a feeling in it"
 * reply, and it exists because the route used to send {@link REFUSAL_MESSAGE}
 * for this case — telling a reader who typed "I'm grumpy and everything is
 * pissing me off" that their feeling was outside what the bot can help with.
 *
 * The distinction is the whole point: Block 6 is a boundary ("I don't do legal
 * advice"), this is an invitation ("say more"). It never says no, and it never
 * implies the reader's feeling was the problem.
 *
 * NEW COPY — not in the founder-approved safety doc. Flagged for Joey/Wyatt in
 * the PR; reword freely, but keep it an invitation rather than a refusal.
 */
export const UNCLEAR_MESSAGE =
  "I couldn't quite catch a feeling in that one — tell me what it feels like, in whatever words you'd use, and I'll find the songs.";

/**
 * WHERE THE LINE SITS, and why (see the PR for citations).
 *
 * Every clinical screening instrument this feature could be measured against
 * gates on EXPLICIT ideation or self-harm content, never on negative affect:
 * the C-SSRS / Columbia Protocol opens on "wish to be dead" and "thoughts of
 * killing yourself"; the NIMH ASQ toolkit asks directly about wishing to be
 * dead and about hurting oneself; and PHQ-9 items 1–8 measure ordinary
 * depressive symptoms — sadness, hopelessness, exhaustion, worthlessness —
 * with NO crisis pathway, which only item 9 (thoughts of being better off dead
 * or of hurting yourself) triggers.
 *
 * That is the standard we hold this lexicon to. Sad, angry, grumpy, exhausted,
 * numb, lonely, bitter and heartbroken are the ordinary emotional range —
 * literally the range the catalogue is about — and they MUST reach songs. This
 * list may only contain language a screening instrument would recognise as a
 * risk signal on its own.
 *
 * Note the asymmetry is real but it is NOT infinite. A false negative here is
 * the failure this block exists to prevent. But a false positive is not free
 * either: over-referral is a documented harm — it teaches readers the box
 * over-reacts, and the reader who is genuinely at risk next week is the one who
 * learned not to type honestly into it.
 *
 * Matched against NORMALIZED text (see {@link normalizeForCrisis}) so spacing,
 * casing, and light punctuation don't let a phrase slip through.
 */

/**
 * Tier A — language that is a risk signal on its own, in any frame. These are
 * explicit statements of intent, ideation, or self-harm. No exemptions apply:
 * if a reader writes "kill myself" we show resources, full stop.
 */
const CRISIS_PHRASES: readonly string[] = [
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'take my own life',
  'taking my own life',
  'end it all',
  'dont want to be alive',
  'do not want to be alive',
  'dont want to live',
  'do not want to live',
  'no reason to live',
  'nothing to live for',
  'not worth living',
  'better off dead',
  'better off without me',
  'wish i was dead',
  'wish i were dead',
  'want to be dead',
  'dont want to wake up',
  'do not want to wake up',
  'suicidal',
  'suicide',
  'self harm',
  'selfharm',
  'hurt myself',
  'harm myself',
  'harming myself',
  'cut myself',
  'cutting myself',
  'i cant go on',
  'i can not go on',
  'i give up on life',
] as const;

/**
 * Tier B — genuine risk language that also has a heavy everyday hyperbolic
 * usage. "I want to die" is a real disclosure AND the single most common way an
 * English speaker under 30 expresses embarrassment or delight. We still fire on
 * it by default; we suppress ONLY when the sentence marks itself as figurative
 * within the next few words (see {@link HYPERBOLE_MARKERS}).
 *
 * "overdose" moved here from the always-fire list: "I've overdosed on this
 * album" is ordinary fan speech, and the old bare substring match caught it.
 */
const HEDGED_CRISIS_PHRASES: readonly string[] = [
  'i want to die',
  'i wanna die',
  'want to die',
  'wanna die',
  'overdose',
  'overdosed',
  'overdosing',
] as const;

/**
 * Figurative frames that clear a Tier B match. Each is checked in the SHORT
 * WINDOW right after the phrase, so "I want to die of embarrassment" clears
 * while "I want to die. Nothing is embarrassing about it" does not.
 *
 * Kept to unmistakable hyperbole. When in doubt, leave a marker off the list —
 * the cost of omitting one is a reader seeing a resources card they didn't
 * need, which the approved copy explicitly recovers from ("the songs will still
 * be here whenever you want them").
 */
const HYPERBOLE_MARKERS: readonly string[] = [
  'of embarrassment',
  'of cringe',
  'of laughter',
  'laughing',
  'of shame',
  'of happiness',
  'of joy',
  'of jealousy',
  'of cuteness',
  'of excitement',
  'of anticipation',
  'of boredom',
  'so good',
  'so cute',
  'so pretty',
  'so beautiful',
  'so happy',
  'on this album',
  'on this song',
  'on the album',
  'on folklore',
  'on the bridge',
  'on this record',
] as const;

/** How many words after a Tier B hit we look for a figurative marker. */
const HYPERBOLE_WINDOW_WORDS = 5;

/**
 * Negations that clear a Tier B match, checked IMMEDIATELY before the phrase.
 *
 * "I don't want to die" is a reassurance, and the old substring match fired on
 * it — the phrase "want to die" sits inside it verbatim. The published guidance
 * is explicit that the gate is *first-person, non-negated* propositional
 * content (C-SSRS Q1–Q2 ask what you HAVE wished, not what you haven't).
 *
 * Applied ONLY to the die-family in Tier B, never to Tier A. This is
 * deliberate and the asymmetry is the whole point: "I don't want to live" and
 * "I don't want to be alive" are negations too, and they are genuine risk
 * disclosures — they live in Tier A precisely so no negation rule can reach
 * them. Do not "simplify" this by hoisting the check.
 */
const NEGATIONS: readonly string[] = ['dont', 'do not', 'never', 'didnt', 'did not', 'wouldnt', 'would not'] as const;

/** How many words before a Tier B hit we look for a negation. */
const NEGATION_WINDOW_WORDS = 3;

/**
 * Fold text to a comparison form: lowercase, strip apostrophes (so "don't"
 * matches "dont"), collapse any run of non-alphanumerics to a single space,
 * and trim. Keeps phrase matching robust to punctuation/spacing without a
 * regex per phrase.
 */
export function normalizeForCrisis(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Inflections a crisis phrase may carry ("suicide" → "suicides", "overdose" →
 * "overdosed"). Replaces the old bare-substring fallback, which made the
 * word-boundary check beside it dead code.
 */
const CRISIS_INFLECTIONS = ['', 's', 'd', 'ed', 'ing'] as const;

/** Where one whole-token occurrence of a phrase sits in the normalized text. */
interface Hit {
  /** Offset of the space immediately BEFORE the phrase. */
  start: number;
  /** Offset of the space immediately AFTER the phrase. */
  end: number;
}

/**
 * Every whole-token occurrence of `phrase` (in any allowed inflection), so a
 * caller can inspect the text on either side of it.
 */
function phraseHits(haystack: string, phrase: string): Hit[] {
  const hits: Hit[] = [];
  for (const suffix of CRISIS_INFLECTIONS) {
    const needle = ` ${phrase}${suffix} `;
    for (let from = 0; ; ) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      // `needle`'s own leading/trailing spaces ARE the surrounding separators,
      // so `at` and `at + len - 1` both point at a space.
      hits.push({ start: at, end: at + needle.length - 1 });
      from = at + 1;
    }
  }
  return hits;
}

/**
 * True when the text right after `end` marks the match as figurative. Looks at
 * a fixed word window rather than the whole message so a hyperbole marker three
 * sentences later cannot clear a genuine disclosure.
 */
function followedByHyperbole(haystack: string, end: number): boolean {
  const window = haystack.slice(end).trim().split(' ').slice(0, HYPERBOLE_WINDOW_WORDS).join(' ');
  // Matched anywhere in the window, not just at its start: readers write "I
  // want to die, this album is so good", where the marker sits a couple of
  // words in. The SHORT window is what keeps this honest — a marker further
  // away than a few words is not modifying this phrase.
  return HYPERBOLE_MARKERS.some((marker) => window.includes(marker));
}

/**
 * True when a negation sits within a few words before `start` — "I don't want
 * to die". Bounded so a "don't" in an earlier clause ("I don't like Mondays,
 * I want to die") cannot clear a real disclosure.
 */
function precededByNegation(haystack: string, start: number): boolean {
  const before = haystack.slice(0, start + 1).trim().split(' ');
  const window = ` ${before.slice(-NEGATION_WINDOW_WORDS).join(' ')} `;
  return NEGATIONS.some((n) => window.includes(` ${n} `));
}

/**
 * True when the reader's raw text carries a crisis signal. Runs first in the
 * route, on the raw text, BEFORE any model call — and its result is never
 * logged with the text attached (see the route). Held to the standard in the
 * lexicon note above: explicit ideation or self-harm content, never ordinary
 * negative emotion.
 */
export function isCrisisText(text: string): boolean {
  const normalized = ` ${normalizeForCrisis(text)} `;

  // Tier A — no exemptions. Negation and hyperbole guards deliberately do NOT
  // apply here.
  if (CRISIS_PHRASES.some((phrase) => phraseHits(normalized, phrase).length > 0)) return true;

  // Tier B — fires unless EVERY occurrence is cleared as figurative or negated.
  // One unhedged "I want to die" in a message is enough; a reader does not have
  // to phrase a disclosure carefully to be heard.
  return HEDGED_CRISIS_PHRASES.some((phrase) =>
    phraseHits(normalized, phrase).some(
      (hit) => !followedByHyperbole(normalized, hit.end) && !precededByNegation(normalized, hit.start),
    ),
  );
}
