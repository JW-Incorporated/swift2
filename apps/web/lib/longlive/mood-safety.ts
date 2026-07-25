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
 * The crisis lexicon: multi-word phrases that signal self-harm, suicidal
 * ideation, or acute crisis. Phrases (not bare words) on purpose — "die" alone
 * fires on "dying to see the Eras tour", but "want to die" in a feelings box is
 * worth catching. Duty of care says err toward showing resources: a false
 * positive costs one reader a moment of "why is it showing me this" (and the
 * copy invites them right back — "the songs will still be here"), while a false
 * negative is the failure this whole block exists to prevent.
 *
 * Matched against NORMALIZED text (see {@link normalizeForCrisis}) so spacing,
 * casing, and light punctuation don't let a phrase slip through.
 */
const CRISIS_PHRASES: readonly string[] = [
  'kill myself',
  'killing myself',
  'i want to die',
  'i wanna die',
  'want to die',
  'wanna die',
  'end my life',
  'ending my life',
  'take my own life',
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
  'suicidal',
  'suicide',
  'self harm',
  'hurt myself',
  'harm myself',
  'cut myself',
  'cutting myself',
  'overdose',
  'i cant go on',
  'i can not go on',
  'i give up on life',
] as const;

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
 * True when the reader's raw text carries a crisis signal. Runs first in the
 * route, on the raw text, BEFORE any model call — and its result is never
 * logged with the text attached (see the route). Conservative-by-catching, per
 * the lexicon note above.
 */
export function isCrisisText(text: string): boolean {
  const normalized = ` ${normalizeForCrisis(text)} `;
  return CRISIS_PHRASES.some((phrase) => normalized.includes(` ${phrase} `) || normalized.includes(phrase));
}
