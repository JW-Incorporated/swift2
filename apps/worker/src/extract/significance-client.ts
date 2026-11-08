import {
  callWorkerClaude,
  hasClaudeSubscriptionToken,
  type WorkerClaudeCaller,
} from '../claude-call';
import {
  buildSignificanceUserMessage,
  SIGNIFICANCE_SCHEMA,
  SIGNIFICANCE_SYSTEM_PROMPT,
  SIGNIFICANCE_TIERS,
  type SignificanceInput,
  type SignificanceTier,
} from './significance-prompt';
import type { ExtractUsageStore } from './usage-store';

const MODEL = 'claude-opus-5-5';

export type SignificanceVerdict =
  | { status: 'ok'; tier: SignificanceTier; reason: string; model: string }
  | { status: 'deferred'; reason: string };

function parseSignificanceOutput(data: unknown): SignificanceVerdict {
  const value = (data ?? {}) as Record<string, unknown>;
  const tier = SIGNIFICANCE_TIERS.find((t) => t === value.tier);
  if (tier === undefined) return { status: 'deferred', reason: 'invalid_tier' };
  const reason = typeof value.reason === 'string' ? value.reason.trim() : '';
  return { status: 'ok', tier, reason, model: MODEL };
}

/** Tiers one candidate. A missing token, an exhausted budget or an unavailable judge defers (never throws); the caller holds the item and retries. */
export async function judgeSignificance(
  usage: ExtractUsageStore,
  input: SignificanceInput,
  claude: WorkerClaudeCaller = callWorkerClaude,
): Promise<SignificanceVerdict> {
  if (!hasClaudeSubscriptionToken()) return { status: 'deferred', reason: 'no_token' };
  if (!await usage.reserve()) return { status: 'deferred', reason: 'budget_exhausted' };

  const response = await claude({
    caller: 'news-worker-judge',
    priority: 'P1',
    model: MODEL,
    system: `${SIGNIFICANCE_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`,
    user: buildSignificanceUserMessage(input),
    schema: SIGNIFICANCE_SCHEMA,
  });
  if (response.status === 'ok') return parseSignificanceOutput(response.data);
  if (response.status === 'unavailable' || response.status === 'capped') {
    console.warn(`news-worker significance deferred: ${response.reason}`);
    return { status: 'deferred', reason: response.reason };
  }
  throw new Error(`Claude significance judge returned invalid output: ${response.reason}`);
}
