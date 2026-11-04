import {
  callWorkerClaude,
  hasClaudeSubscriptionToken,
  type WorkerClaudeCaller,
} from '../claude-call';
import {
  buildJudgeUserMessage,
  JUDGE_DIMENSIONS,
  JUDGE_MIN_SCORES,
  JUDGE_SCHEMA,
  JUDGE_SYSTEM_PROMPT,
  type JudgeDimension,
  type JudgeInput,
} from './judge-prompt';
import type { ExtractUsageStore } from './usage-store';

const MODEL = 'claude-opus-5-5';

export type JudgeResult =
  | {
    status: 'ok';
    pass: boolean;
    writingScore: number;
    scores: Record<JudgeDimension, number>;
    reasons: Record<JudgeDimension, string>;
  }
  | { status: 'deferred'; reason: string };

/** Pass rule: every dimension at or above its minimum. The writing score is the sum of the four (4-20). */
export function scoreVerdict(scores: Record<JudgeDimension, number>): { pass: boolean; writingScore: number } {
  const pass = JUDGE_DIMENSIONS.every((dimension) => scores[dimension] >= JUDGE_MIN_SCORES[dimension]);
  const writingScore = JUDGE_DIMENSIONS.reduce((sum, dimension) => sum + scores[dimension], 0);
  return { pass, writingScore };
}

function parseJudgeOutput(data: unknown): JudgeResult {
  const value = (data ?? {}) as Record<string, unknown>;
  const scores = {} as Record<JudgeDimension, number>;
  const reasons = {} as Record<JudgeDimension, string>;
  for (const dimension of JUDGE_DIMENSIONS) {
    const score = value[dimension];
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
      return { status: 'deferred', reason: 'invalid_scores' };
    }
    scores[dimension] = score;
    const reason = value[`${dimension}_reason`];
    reasons[dimension] = typeof reason === 'string' ? reason.trim() : '';
  }
  return { status: 'ok', ...scoreVerdict(scores), scores, reasons };
}

/** Scores one candidate post. A missing token or an exhausted/unavailable budget defers (never throws); the caller holds the item. */
export async function judgeWriting(
  usage: ExtractUsageStore,
  input: JudgeInput,
  claude: WorkerClaudeCaller = callWorkerClaude,
): Promise<JudgeResult> {
  if (!hasClaudeSubscriptionToken()) return { status: 'deferred', reason: 'no_token' };
  if (!await usage.reserve()) return { status: 'deferred', reason: 'budget_exhausted' };

  const response = await claude({
    caller: 'news-worker-judge',
    priority: 'P1',
    model: MODEL,
    system: `${JUDGE_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`,
    user: buildJudgeUserMessage(input),
    schema: JUDGE_SCHEMA,
  });
  if (response.status === 'ok') return parseJudgeOutput(response.data);
  if (response.status === 'unavailable' || response.status === 'capped') {
    console.warn(`news-worker judge deferred: ${response.reason}`);
    return { status: 'deferred', reason: response.reason };
  }
  throw new Error(`Claude writing judge returned invalid output: ${response.reason}`);
}
