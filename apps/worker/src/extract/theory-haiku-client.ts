// One Haiku call per crawled post bundle (Community Engine plan §3.3, Phase
// 2 card P2-2). Sibling of ./haiku-client.ts — same transport/error-handling
// contract: raw callAnthropicMessages() (no @anthropic-ai/sdk dependency),
// returns null (never throws) for the expected "no key" / "cap hit" states,
// throws on a genuine API failure so the caller defers the bundle to next
// run rather than silently losing it. Cache the system prompt since it is
// identical on every call (same as haiku-client.ts / clown-client.ts).
//
// Reuses ./usage-store.ts's ExtractUsageStore for its own cap — scoped
// separately ('theory-miner' vs 'extract') so the two Haiku-consuming
// stages never share a counter, same "one scope per caller" rule
// usage-store.ts's own header establishes for classify vs extract.

import { FAN_THEORY_PREDICTS, FAN_THEORY_STANCES } from '@swift2/shared/community';
import type { FanTheoryPredicts, FanTheoryStance } from '@swift2/shared/community';
import { RECORD_FAN_THEORIES_TOOL, THEORY_MINER_SYSTEM_PROMPT } from './theory-prompt';
import { THEORY_MINER_SKIP_REASONS } from './theory-types';
import type {
  ExtractedFanTheory,
  RecordFanTheoriesResult,
  TheoryMinerComment,
  TheoryMinerInput,
  TheoryMinerSkipReason,
} from './theory-types';
import type { ExtractUsageStore } from './usage-store';
import { callAnthropicMessages, extractToolUseInput } from '@swift2/shared/llm/anthropic-messages';

const MODEL = 'claude-haiku-4-5'; // cost-cheap tier, same choice as haiku-client.ts's live extract; re-check at any real usage review
const MAX_TOKENS = 1_024;
/** Post title + comment bodies are capped to this many characters (mirrors haiku-client.ts's MAX_COMMENT_THREAD_CHARS). */
const MAX_BUNDLE_CHARS = 6_000;

const SKIP_REASONS = new Set<TheoryMinerSkipReason>(THEORY_MINER_SKIP_REASONS);
const PREDICTS = new Set<FanTheoryPredicts>(FAN_THEORY_PREDICTS);
const STANCES = new Set<FanTheoryStance>(FAN_THEORY_STANCES);

/** Builds the ≤6k-char bundle text the prompt shows — post title, then one
 * line per comment. Comment authors (already hashed by crawl.mjs) are
 * deliberately never included in the text the model reads — the model
 * needs bodies to identify an aggregate pattern, never a per-author view. */
function bundleText(input: TheoryMinerInput): string {
  const lines = [
    `POST: ${input.postTitle}`,
    ...input.comments
      .map((c) => c.body?.replace(/\s+/g, ' ').trim())
      .filter((body): body is string => Boolean(body))
      .map((body) => `- ${body}`),
  ];
  const joined = lines.join('\n');
  return joined.length > MAX_BUNDLE_CHARS ? joined.slice(0, MAX_BUNDLE_CHARS) : joined;
}

function buildUserMessage(input: TheoryMinerInput): string {
  return [
    `TODAY: ${input.today}`,
    `SUBREDDIT: r/${input.subreddit}`,
    `SYMBOL LEXICON (match these keys where they apply; do not invent a new one): ${
      input.symbolLexiconKeys.length > 0 ? input.symbolLexiconKeys.join(', ') : '(none seeded yet)'
    }`,
    '',
    'POST + COMMENT THREAD (individual fan comments; use only for aggregate discussion signal):',
    bundleText(input),
  ].join('\n');
}

function extractToolInput(body: unknown): unknown | null {
  return extractToolUseInput(body, { toolName: RECORD_FAN_THEORIES_TOOL.name, fallback: {} });
}

function str(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function strArray(value: unknown, itemMax = 80, arrayMax = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => str(v, itemMax))
    .filter((v) => v.length > 0)
    .slice(0, arrayMax);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Never trust the model's output shape blindly — clamp/validate one theory
 * before it reaches the caller. Returns undefined for a theory the model
 * failed to populate with the required fields — dropped, not stored
 * half-empty (same "never trust the shape" discipline as haiku-client.ts's
 * sanitizeCurrentItem). */
function sanitizeTheory(value: unknown): ExtractedFanTheory | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const p = value as Record<string, unknown>;
  const name = str(p.name, 80);
  const claim = str(p.claim, 200);
  const theoryKey = str(p.theory_key, 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const stance = STANCES.has(p.stance as FanTheoryStance)
    ? (p.stance as FanTheoryStance)
    : undefined;
  if (!name || !claim || !theoryKey || !stance) return undefined;

  const predicts = PREDICTS.has(p.predicts as FanTheoryPredicts)
    ? (p.predicts as FanTheoryPredicts)
    : undefined;
  const predictedDate = predicts && isIsoDate(p.predicted_date) ? p.predicted_date : undefined;
  const mechanism = str(p.mechanism, 60) || undefined;
  const trackSlug = str(p.track_slug, 80) || undefined;
  const evidenceSummary = str(p.evidence_summary, 400) || undefined;

  return {
    name,
    claim,
    theoryKey,
    ...(mechanism ? { mechanism } : {}),
    symbols: strArray(p.symbols),
    ...(trackSlug ? { trackSlug } : {}),
    ...(predicts ? { predicts } : {}),
    ...(predictedDate ? { predictedDate } : {}),
    ...(evidenceSummary ? { evidenceSummary } : {}),
    stance,
  };
}

/** Never trust the model's output shape blindly — clamp/validate before it
 * reaches the caller (mirrors haiku-client.ts's sanitizeResult). */
export function sanitizeTheoryMinerResult(parsed: unknown): RecordFanTheoriesResult {
  const p = (parsed ?? {}) as Record<string, unknown>;
  const theories = Array.isArray(p.theories)
    ? p.theories.map(sanitizeTheory).filter((t): t is ExtractedFanTheory => t !== undefined)
    : [];
  const skipReason = SKIP_REASONS.has(p.skip_reason as TheoryMinerSkipReason)
    ? (p.skip_reason as TheoryMinerSkipReason)
    : undefined;
  return {
    theories,
    ...(theories.length === 0 && skipReason ? { skipReason } : {}),
    redlineFlags: strArray(p.redline_flags, 40),
  };
}

async function attempt(apiKey: string, userMessage: string): Promise<RecordFanTheoriesResult> {
  const { raw } = await callAnthropicMessages(
    apiKey,
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: 'text', text: THEORY_MINER_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      tools: [RECORD_FAN_THEORIES_TOOL],
      tool_choice: { type: 'tool', name: RECORD_FAN_THEORIES_TOOL.name },
      messages: [{ role: 'user', content: userMessage }],
    },
    { errorLabel: 'Anthropic theory-miner extract', includeBodyTextInError: true },
  );
  const toolInput = extractToolInput(raw);
  if (toolInput === null) throw new Error('Anthropic theory-miner extract: no tool_use block');
  return sanitizeTheoryMinerResult(toolInput);
}

/** Comment shape adapter: the crawl artifact's TheoryMinerComment (author
 * already hashed or null) maps straight through — no separate hashing step
 * here, matching crawl.mjs's own header ("Author hashing happens here, not
 * deferred to the Theory Miner"). Exported so callers building a
 * TheoryMinerInput from the raw crawl JSON have a documented seam. */
export function commentsFromCrawlBundle(
  raw: readonly { author?: string | null; body?: string | null }[],
): TheoryMinerComment[] {
  return raw.map((c) => ({ author: c.author ?? null, body: c.body ?? null }));
}

/**
 * Attempts a theory-mining call for one post bundle. Returns null (never
 * throws) for the "no key" / "cap hit" cases — expected, not exceptional,
 * states (same contract as haiku-client.ts's extractWithLLM). Throws on a
 * genuine API failure so the caller can defer the bundle to next run.
 */
export async function extractFanTheories(
  usage: ExtractUsageStore,
  input: TheoryMinerInput,
): Promise<RecordFanTheoriesResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const reserved = await usage.reserve();
  if (!reserved) return null;

  return attempt(apiKey, buildUserMessage(input));
}
