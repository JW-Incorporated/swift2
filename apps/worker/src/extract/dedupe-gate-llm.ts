import {
  callWorkerClaude,
  hasClaudeSubscriptionToken,
  type WorkerClaudeCaller,
} from '../claude-call';
import type { ExtractedCurrentItem } from './types';
import type { ExtractUsageStore } from './usage-store';

const MODEL = 'claude-haiku-5-5';

export interface DedupeCandidate {
  id: string;
  headline: string;
  summary: string;
  detail: string;
}

export interface GateLLMResult {
  sameEvent: boolean;
  matchId: string | null;
  addsNewInfo: boolean;
  newFacts: string[];
}

export interface MergeLLMResult {
  summary: string;
  detail: string;
}

const GATE_SYSTEM_PROMPT = [
  'You check whether a NEW news item is about the SAME real-world event as one of several CANDIDATE items already live on a Taylor Swift fan site, or a genuinely distinct development.',
  '',
  'SAME EVENT means the same real-world happening reported by different outlets or at a slightly different angle.',
  'NOT the same event: a genuinely new development that follows from the same topic. When in doubt, prefer treating it as NOT the same event.',
  '',
  'If it IS the same event as exactly one candidate: set same_event=true, match_id to that candidate id, and decide adds_new_info.',
  'If it is not the same event as any candidate, set same_event=false and match_id=null.',
].join('\n');

const GATE_SCHEMA = {
  type: 'object',
  properties: {
    same_event: { type: 'boolean' },
    match_id: { type: ['string', 'null'] },
    adds_new_info: { type: 'boolean' },
    new_facts: { type: 'array', items: { type: 'string' } },
  },
  required: ['same_event', 'match_id', 'adds_new_info', 'new_facts'],
  additionalProperties: false,
};

function buildGateUserMessage(
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary' | 'detail'>,
  candidates: readonly DedupeCandidate[],
): string {
  const lines = [
    'NEW ITEM:',
    `headline: ${newItem.headline}`,
    `summary: ${newItem.summary}`,
    `detail: ${newItem.detail}`,
    '',
    'CANDIDATES (already live):',
  ];
  for (const candidate of candidates) {
    lines.push(
      `- id: ${candidate.id}`,
      `  headline: ${candidate.headline}`,
      `  summary: ${candidate.summary}`,
      `  detail: ${candidate.detail}`,
    );
  }
  return lines.join('\n');
}

function sanitizeGateResult(parsed: unknown, validIds: ReadonlySet<string>): GateLLMResult {
  const value = (parsed ?? {}) as Record<string, unknown>;
  const rawMatchId = typeof value.match_id === 'string' ? value.match_id : null;
  const matchId = rawMatchId && validIds.has(rawMatchId) ? rawMatchId : null;
  const sameEvent = Boolean(value.same_event) && matchId !== null;
  const addsNewInfo = sameEvent && Boolean(value.adds_new_info);
  const newFacts = addsNewInfo && Array.isArray(value.new_facts)
    ? value.new_facts
      .filter((fact): fact is string => typeof fact === 'string' && fact.trim().length > 0)
      .slice(0, 10)
    : [];
  return { sameEvent, matchId, addsNewInfo, newFacts };
}

export async function checkSameEvent(
  usage: ExtractUsageStore,
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary' | 'detail'>,
  candidates: readonly DedupeCandidate[],
  claude: WorkerClaudeCaller = callWorkerClaude,
): Promise<GateLLMResult | null> {
  if (candidates.length === 0) {
    return { sameEvent: false, matchId: null, addsNewInfo: false, newFacts: [] };
  }
  if (!hasClaudeSubscriptionToken()) return null;
  if (!await usage.reserve()) return null;

  const response = await claude({
    caller: 'news-worker-dedupe',
    priority: 'P1',
    model: MODEL,
    system: `${GATE_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`,
    user: buildGateUserMessage(newItem, candidates),
    schema: GATE_SCHEMA,
  });
  if (response.status === 'ok') {
    return sanitizeGateResult(response.data, new Set(candidates.map((candidate) => candidate.id)));
  }
  if (response.status === 'unavailable' || response.status === 'capped') {
    console.warn(`news-worker dedupe deferred: ${response.reason}`);
    return null;
  }
  throw new Error(`Claude dedupe gate returned invalid output: ${response.reason}`);
}

const MERGE_SYSTEM_PROMPT = [
  'Rewrite the summary and detail of an existing news item to fold in genuinely new facts from a duplicate report of the SAME event.',
  'Use ONLY the facts given below. Never add a fact, name, date, or number that is not present.',
  'summary: 2-3 sentences, 160-400 characters.',
  'detail: a real paragraph, 60-150 words.',
  'Keep the existing tone and hedging language.',
].join('\n');

const MERGE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    detail: { type: 'string' },
  },
  required: ['summary', 'detail'],
  additionalProperties: false,
};

export function mergeOutputWithinLimits(result: MergeLLMResult): boolean {
  if (result.summary.length < 160 || result.summary.length > 400) return false;
  const words = result.detail.trim().split(/\s+/).filter(Boolean).length;
  return words >= 60 && words <= 150;
}

export async function mergeNewFacts(
  usage: ExtractUsageStore,
  original: Pick<DedupeCandidate, 'summary' | 'detail'>,
  newFacts: readonly string[],
  claude: WorkerClaudeCaller = callWorkerClaude,
): Promise<MergeLLMResult | null> {
  if (!hasClaudeSubscriptionToken()) return null;
  if (!await usage.reserve()) return null;
  const response = await claude({
    caller: 'news-worker-dedupe',
    priority: 'P1',
    model: MODEL,
    system: `${MERGE_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`,
    user: [
      `ORIGINAL SUMMARY: ${original.summary}`,
      `ORIGINAL DETAIL: ${original.detail}`,
      '',
      'NEW FACTS TO FOLD IN:',
      ...newFacts.map((fact) => `- ${fact}`),
    ].join('\n'),
    schema: MERGE_SCHEMA,
  });
  if (response.status === 'ok') {
    const value = response.data as { summary?: unknown; detail?: unknown };
    const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
    const detail = typeof value.detail === 'string' ? value.detail.trim() : '';
    if (!summary || !detail) throw new Error('Claude dedupe merge returned empty copy');
    return { summary, detail };
  }
  if (response.status === 'unavailable' || response.status === 'capped') {
    console.warn(`news-worker dedupe merge skipped: ${response.reason}`);
    return null;
  }
  throw new Error(`Claude dedupe merge returned invalid output: ${response.reason}`);
}
