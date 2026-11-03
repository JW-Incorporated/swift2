export const JUDGE_DIMENSIONS = ['voice', 'context', 'grounding', 'non_repetition'] as const;
export type JudgeDimension = (typeof JUDGE_DIMENSIONS)[number];

export const JUDGE_PASS_SCORE = 4;

export const JUDGE_SYSTEM_PROMPT = [
  'You are a strict editor scoring one news post for a Taylor Swift fan site. Score each dimension 1 to 5 (5 best) and give a one-line reason for each.',
  '',
  'voice: a fan editor talking to fans in third person, naming her "Taylor". Not wire copy, not AI-sounding, no throat-clearing, no hype stacking.',
  'context: the post says why it matters to a fan, with a real tie to her history or the current moment, using only what the facts support.',
  'grounding: every claim in the headline, lead and body is supported by the FACTS list. Any claim, name, date or number not in the facts scores 1 or 2.',
  'non_repetition: the lead and body add different information; neither restates the headline or each other; no sentence says the same thing twice.',
  '',
  'Use only the FACTS to judge grounding. Do not use outside knowledge to excuse a claim the facts do not state.',
].join('\n');

const scoreProperty = { type: 'integer', minimum: 1, maximum: 5 };
const reasonProperty = { type: 'string' };

export const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    voice: scoreProperty,
    context: scoreProperty,
    grounding: scoreProperty,
    non_repetition: scoreProperty,
    voice_reason: reasonProperty,
    context_reason: reasonProperty,
    grounding_reason: reasonProperty,
    non_repetition_reason: reasonProperty,
  },
  required: [
    'voice', 'context', 'grounding', 'non_repetition',
    'voice_reason', 'context_reason', 'grounding_reason', 'non_repetition_reason',
  ],
  additionalProperties: false,
};

export interface JudgeInput {
  headline: string;
  lead: string;
  body: string;
  facts: readonly string[];
}

export function buildJudgeUserMessage(input: JudgeInput): string {
  return [
    `HEADLINE: ${input.headline}`,
    `LEAD: ${input.lead}`,
    `BODY: ${input.body}`,
    '',
    'FACTS:',
    ...input.facts.map((fact, i) => `${i + 1}. ${fact}`),
  ].join('\n');
}
