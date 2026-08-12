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
 * Block 1 (abuse variant) — the response when the disclosure is that another
 * person is hurting, threatening, or controlling the reader (domestic/partner/
 * family violence), not self-directed ideation. A suicide line is the wrong
 * lead resource for "he hits me"; the National Domestic Violence Hotline is.
 *
 * The DV resource line is load-bearing and must survive edits intact:
 *   National Domestic Violence Hotline — call 1-800-799-7233, text START to 88788.
 *
 * We still keep the 988/741741 line below it (a person in an abusive situation
 * is also at elevated suicide risk, and the Crisis Text Line handles both), but
 * we LEAD with the DV hotline so the most relevant help is first. The ideation
 * tier keeps {@link CRISIS_MESSAGE} unchanged.
 */
export const DV_RESOURCE_LINE =
  'If someone is hurting, threatening, or controlling you: you are not overreacting, and it is not your fault. In the US you can reach the National Domestic Violence Hotline any time — call 1-800-799-7233, or text START to 88788. It’s free, confidential, and available 24/7.';

export const CRISIS_MESSAGE_ABUSE: readonly string[] = [
  CRISIS_MESSAGE[0],
  CRISIS_MESSAGE[1],
  DV_RESOURCE_LINE,
  CRISIS_MESSAGE[2],
  CRISIS_MESSAGE[3],
  CRISIS_MESSAGE[4],
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

  // #1980 — passive / obfuscated ideation the old list keyed around. These are
  // still explicit risk content by a screening instrument's reading (a wish to
  // be gone, a method, a plan, a goodbye), just phrased in the indirect way real
  // readers use. Kept in Tier A (no exemptions) because none of them has an
  // ordinary hyperbolic sense the way the die-family in Tier B does — but see
  // GUARDED_IDEATION below for the two that DO have a benign completion, and the
  // note on "kill me" at the end of the file for the one we deliberately skip.
  'if i was gone',
  'if i were gone',
  'if i wasnt here',
  'if i were not here',
  'nobody would notice if i was gone',
  'want to be gone',
  'wish i was gone',
  'dont want to be here anymore',
  'do not want to be here anymore',
  'no point in living',
  'no point in being here',
  'dont see the point anymore',
  'do not see the point anymore',
  'stop existing',
  'want to stop existing',
  'dont want to exist',
  'do not want to exist',
  'wish i didnt exist',
  'wish i did not exist',
  'wrote the note',
  'written the note',
  'wrote a note',
  'wrote a goodbye',
  'writing a goodbye',
  'goodbye letter',
  'goodbye note',
  // Overdose-by-method. Kept to the UNAMBIGUOUS quantifier forms: bare "took
  // the pills" is deliberately NOT here — it collides with ordinary medication
  // adherence ("I took the pills the doctor prescribed"), which the over-refusal
  // guard forbids us from firing on. The quantified forms have no benign reading.
  'took all the pills',
  'took a bunch of pills',
  'took a whole bottle of pills',
  'swallowed all the pills',
  'swallowed a bunch of pills',
  'took a bottle of pills',
] as const;

/**
 * #1980 — ideation phrasings that also carry an ordinary, non-risk completion,
 * so they fire unless the reader marks the benign sense within the next few
 * words. "I want to end it" is a disclosure; "I want to end it with him" is a
 * breakup. Same machinery as Tier B's hyperbole/negation windows, but the
 * clearer set is per-phrase because the benign completion is specific.
 *
 * Kept SMALL and specific on purpose — a guarded phrase is one we could not put
 * in Tier A without over-refusing, and every entry here is a phrase we would
 * rather fire on the ambiguous case than miss the real one, so the clearer list
 * only holds completions that are unmistakably about ending a relationship or a
 * task, never a life.
 */
const GUARDED_IDEATION: readonly { phrase: string; clearers: readonly string[] }[] = [
  { phrase: 'want to end it', clearers: ['with', 'between'] },
  { phrase: 'wanna end it', clearers: ['with', 'between'] },
  { phrase: 'ready to end it', clearers: ['with', 'between'] },
] as const;

/**
 * Abuse / immediate-danger tier (#1979). A reader disclosing that another
 * person is hurting, threatening, or controlling them is in crisis, and the old
 * lexicon had NO abuse language at all — "he hurts me" fell through to the
 * heartbreak playlist because "hurt" is a heartbreak keyword. This tier fires
 * the crisis path AND flags {@link CrisisAssessment.abuse}, so the route leads
 * with the DV hotline ({@link CRISIS_MESSAGE_ABUSE}) rather than a suicide line.
 *
 * Unconditional entries are unambiguous on their own — "being abused",
 * "threatens to kill me" have no benign reading in a feelings box.
 */
const ABUSE_PHRASES: readonly string[] = [
  'being abused',
  'getting abused',
  'abuses me',
  'is abusing me',
  'abused me',
  'threatens to kill me',
  'threatening to kill me',
  'threatened to kill me',
  'threatens to hurt me',
  'threatening to hurt me',
  'threatens me',
  'beats me up',
  'is beating me',
  'is hitting me',
  'attacks me',
  'chokes me',
  'strangles me',
] as const;

/**
 * Harm verbs that DO collide with ordinary Swiftie speech ("this song hits
 * me", "beats me why he left", "it hurts me that he forgot") and so fire only
 * when a human subject sits just before them. Two shapes:
 *
 *  - `physical` also clears on an idiom follower ("hits me up" = messages me,
 *    "beats me at" = a game, "hits me back"), because a human subject alone
 *    isn't enough to tell "he hits me" from "he hits me up".
 *  - `directed` needs only the subject — "he hurts me", "my partner is violent"
 *    have no comparable benign completion once a person is the subject.
 */
const ABUSE_GATED_PHYSICAL: readonly string[] = ['hits me', 'beats me'];
const ABUSE_GATED_DIRECTED: readonly string[] = [
  'hurts me',
  'hurting me',
  'is hurting me',
  'keeps hurting me',
  'will hurt me',
  'gonna hurt me',
  'going to hurt me',
  'is violent',
  'gets violent',
  'is being violent',
  'is abusive',
];

/** Human-subject tokens that make a bare harm verb a disclosure of violence. */
const ABUSE_SUBJECTS: readonly string[] = [
  'he',
  'she',
  'they',
  // Contractions normalize with the apostrophe stripped ("he's" → "hes"), so
  // list those forms too or "im scared hes going to hurt me" slips through.
  'hes',
  'shes',
  'theyre',
  'him',
  'her',
  'husband',
  'wife',
  'partner',
  'boyfriend',
  'girlfriend',
  'bf',
  'gf',
  'mom',
  'mum',
  'mother',
  'dad',
  'father',
  'parents',
  'stepdad',
  'stepfather',
  'stepmom',
  'ex',
  'uncle',
  'aunt',
  'brother',
  'sister',
  'boss',
  'roommate',
];

/** Followers that clear a physical-harm match as an idiom, checked immediately after. */
const ABUSE_PHYSICAL_CLEARERS: readonly string[] = ['up', 'at', 'back'];

/** How many words before a gated harm verb we look for a human subject. */
const ABUSE_SUBJECT_WINDOW_WORDS = 6;

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
 * True when a human subject ({@link ABUSE_SUBJECTS}) sits within
 * {@link ABUSE_SUBJECT_WINDOW_WORDS} words before `start`. This is what tells
 * "he hits me" (a person is the subject) from "this song hits me" (it isn't),
 * so a gated harm verb never fires on ordinary fan speech.
 */
function precededBySubject(haystack: string, start: number): boolean {
  const before = haystack.slice(0, start + 1).trim().split(' ');
  const window = ` ${before.slice(-ABUSE_SUBJECT_WINDOW_WORDS).join(' ')} `;
  return ABUSE_SUBJECTS.some((s) => window.includes(` ${s} `));
}

/**
 * True when the word immediately after `end` is one of `clearers` — the generic
 * "does the next word mark this as the benign sense?" check used by both the
 * physical-harm idiom guard ("hits me up") and {@link GUARDED_IDEATION}
 * ("end it with him"). Only the very next token counts: the benign completion
 * of these phrases is always adjacent.
 */
function followedByWord(haystack: string, end: number, clearers: readonly string[]): boolean {
  const next = haystack.slice(end).trim().split(' ')[0] ?? '';
  return clearers.includes(next);
}

/**
 * True when the text discloses another person hurting, threatening, or
 * controlling the reader — the abuse / immediate-danger tier (#1979).
 * Unconditional phrases fire on their own; gated harm verbs fire only with a
 * human subject in front (and, for the physical ones, no idiom follower).
 */
function isAbuseText(normalized: string): boolean {
  if (ABUSE_PHRASES.some((phrase) => phraseHits(normalized, phrase).length > 0)) return true;

  const physical = ABUSE_GATED_PHYSICAL.some((phrase) =>
    phraseHits(normalized, phrase).some(
      (hit) =>
        precededBySubject(normalized, hit.start) &&
        !followedByWord(normalized, hit.end, ABUSE_PHYSICAL_CLEARERS),
    ),
  );
  if (physical) return true;

  return ABUSE_GATED_DIRECTED.some((phrase) =>
    phraseHits(normalized, phrase).some((hit) => precededBySubject(normalized, hit.start)),
  );
}

/**
 * The deterministic crisis verdict for a piece of raw text, split into whether
 * it is a crisis at all and whether the crisis is an abuse/immediate-danger
 * disclosure (which changes which resources we lead with). Runs first in the
 * route, on the raw text, BEFORE any model call — and its result is never
 * logged with the text attached (see the route).
 *
 * Order matters: abuse is checked first so an abuse disclosure that also trips a
 * generic phrase still routes to the DV resources.
 */
export interface CrisisAssessment {
  /** True when we must show resources and no songs. */
  crisis: boolean;
  /** True when the crisis is another person hurting the reader (→ DV resources). */
  abuse: boolean;
}

export function assessCrisis(text: string): CrisisAssessment {
  const normalized = ` ${normalizeForCrisis(text)} `;

  // Abuse / immediate-danger tier — checked first so it wins the resource choice.
  if (isAbuseText(normalized)) return { crisis: true, abuse: true };

  // Tier A — no exemptions. Negation and hyperbole guards deliberately do NOT
  // apply here.
  if (CRISIS_PHRASES.some((phrase) => phraseHits(normalized, phrase).length > 0)) {
    return { crisis: true, abuse: false };
  }

  // Guarded ideation (#1980) — fires unless the benign completion follows.
  const guarded = GUARDED_IDEATION.some(({ phrase, clearers }) =>
    phraseHits(normalized, phrase).some((hit) => !followedByWord(normalized, hit.end, clearers)),
  );
  if (guarded) return { crisis: true, abuse: false };

  // Tier B — fires unless EVERY occurrence is cleared as figurative or negated.
  // One unhedged "I want to die" in a message is enough; a reader does not have
  // to phrase a disclosure carefully to be heard.
  const hedged = HEDGED_CRISIS_PHRASES.some((phrase) =>
    phraseHits(normalized, phrase).some(
      (hit) => !followedByHyperbole(normalized, hit.end) && !precededByNegation(normalized, hit.start),
    ),
  );
  return { crisis: hedged, abuse: false };
}

/**
 * True when the reader's raw text carries a crisis signal. Held to the standard
 * in the lexicon note above: explicit ideation, self-harm, or abuse content,
 * never ordinary negative emotion. Thin wrapper over {@link assessCrisis} for
 * the many callers that only need the boolean.
 */
export function isCrisisText(text: string): boolean {
  return assessCrisis(text).crisis;
}

/**
 * "kill me" in a self-context (#1980) was on the red-team list and is
 * DELIBERATELY NOT added here. Bare "kill me" is the single most common English
 * hyperbole for mild frustration — "kill me now, my alarm didn't go off",
 * "ugh, kill me" — and it sits in the ordinary-feelings regression battery as a
 * must-NOT-fire. Real self-directed intent reaches us as "kill myself" (Tier A)
 * or the die-family (Tier B); the only phrase that adds "kill me" without
 * torching the over-refusal guarantee is the directed "threatens to kill me",
 * which IS in {@link ABUSE_PHRASES}. Left out on purpose — see the PR.
 */
