/** Plain-language Clownbot vocabulary, served without retrieval or a model. */

export const CLOWNING_DEFINITION =
  'Clowning is fan-speak for playfully going all-in on a theory, knowing it may turn out wrong.';
export const DELULU_DEFINITION =
  'Delulu is short for delusional, used affectionately here for how far a theory reaches beyond the evidence.';
export const EASTER_EGG_DEFINITION =
  'An Easter egg is a deliberately hidden clue or reference that fans can notice and decode.';

export const CLOWN_JARGON_GUIDE = `${CLOWNING_DEFINITION} ${DELULU_DEFINITION} ${EASTER_EGG_DEFINITION}`;

export interface ClownExplanation {
  topic: 'clowning' | 'delulu' | 'easter-egg' | 'clownbot';
  text: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CLOWNING_QUESTIONS = new Set([
  'what is clowning',
  'whats clowning',
  'what does clowning mean',
  'define clowning',
  'clowning meaning',
]);
const DELULU_QUESTIONS = new Set([
  'what is delulu',
  'whats delulu',
  'what does delulu mean',
  'define delulu',
  'delulu meaning',
]);
const EGG_QUESTIONS = new Set([
  'what is an easter egg',
  'what is a taylor swift easter egg',
  'whats an easter egg',
  'what does easter egg mean',
  'define easter egg',
]);
const BOT_QUESTIONS = new Set([
  'what do you do',
  'who are you',
  'what is clownbot',
  'whats clownbot',
  'how do you work',
  'how do you check a fan theory',
]);

/** Returns null for normal lore questions so only explicit meta-questions short-circuit. */
export function explainClownQuestion(text: string): ClownExplanation | null {
  const question = normalize(text);
  if (CLOWNING_QUESTIONS.has(question)) return { topic: 'clowning', text: CLOWNING_DEFINITION };
  if (DELULU_QUESTIONS.has(question)) return { topic: 'delulu', text: DELULU_DEFINITION };
  if (EGG_QUESTIONS.has(question)) return { topic: 'easter-egg', text: EASTER_EGG_DEFINITION };
  if (BOT_QUESTIONS.has(question)) {
    return {
      topic: 'clownbot',
      text: `I check Taylor Swift fan theories against dated, sourced clues and show what supports or weakens them. ${CLOWN_JARGON_GUIDE}`,
    };
  }
  return null;
}
