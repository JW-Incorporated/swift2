export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceQuestion {
  type: 'choice';
  id: string;
  instructions: string;
  options: readonly ChoiceOption[];
}

export interface ScoreQuestion {
  type: 'score';
  id: string;
  instructions: string;
  min: number;
  max: number;
}

export interface NoulQuestion {
  type: 'noul';
  id: string;
  instructions: string;
}

export type JevQuestion = ChoiceQuestion | ScoreQuestion | NoulQuestion;

function requireText(value: string, field: string): void {
  if (!value.trim()) throw new TypeError(`${field} must not be empty`);
}

export function choiceQuestion(
  id: string,
  instructions: string,
  options: readonly ChoiceOption[],
): ChoiceQuestion {
  requireText(id, 'Question id');
  requireText(instructions, 'Question instructions');
  if (options.length < 2) throw new TypeError('Choice questions need at least two options');
  const ids = new Set<string>();
  const labels = new Set<string>();
  for (const option of options) {
    requireText(option.id, 'Choice option id');
    requireText(option.label, 'Choice option label');
    if (ids.has(option.id) || labels.has(option.label)) {
      throw new TypeError('Choice option ids and labels must be unique');
    }
    ids.add(option.id);
    labels.add(option.label);
  }
  return { type: 'choice', id, instructions, options: options.map((option) => ({ ...option })) };
}

export function scoreQuestion(
  id: string,
  instructions: string,
  min: number,
  max: number,
): ScoreQuestion {
  requireText(id, 'Question id');
  requireText(instructions, 'Question instructions');
  if (!Number.isInteger(min) || !Number.isInteger(max) || min >= max || max - min + 1 > 10) {
    throw new TypeError('Score bounds must define 2 to 10 integer levels');
  }
  return { type: 'score', id, instructions, min, max };
}

export function noulQuestion(id: string, instructions: string): NoulQuestion {
  requireText(id, 'Question id');
  requireText(instructions, 'Question instructions');
  return { type: 'noul', id, instructions };
}
