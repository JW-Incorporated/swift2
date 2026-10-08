// One Haiku call per new cluster (proposal §4.5, PLAN.md Stage 3). Vendor is
// Anthropic per docs/decisions.md 2026-08-23 "Knowledge engine kickoff"
// (matches Clownbot's existing vendor, apps/web/lib/longlive/clown-client.ts
// — additive, not a replacement of classify/openai-client.ts's OpenAI call).
//
// Transport/error-handling contract mirrors classify/openai-client.ts
// exactly per PLAN.md's ground-truth correction: raw `fetch()`, no
// `@anthropic-ai/sdk` dependency (apps/worker has none and shouldn't gain
// one), returns null (never throws) for the expected "no key" / "cap hit"
// states so the caller treats a missing key the same way classify does —
// as the designed degraded-but-functional path — and throws on a genuine
// API failure so the caller logs it and defers the cluster to next run,
// rather than silently losing it. Cache the system prompt (`cache_control`)
// since it is identical on every call, same as clown-client.ts already does.

import { CURRENT_ITEM_CATEGORIES, CURRENT_ITEM_STATUSES, LOCATION_LEVELS } from '@swift2/shared';
import type { CurrentItemCategory, CurrentItemStatus, LocationLevel } from '@swift2/shared';
import { EXTRACT_SYSTEM_PROMPT, RECORD_KNOWLEDGE_TOOL } from './prompt';
import type {
  ExtractCommentThread,
  ExtractedCurrentItem,
  ExtractedFanSignal,
  ExtractedTheory,
  RecordKnowledgeKind,
  RecordKnowledgeResult,
  SkipReason,
} from './types';
import type { ExtractUsageStore } from './usage-store';
import { callAnthropicMessages, extractToolUseInput } from '@swift2/shared/llm/anthropic-messages';

const MODEL = 'claude-haiku-4-5'; // cost-cheap tier per proposal §4.5; re-check at any real usage review
const MAX_TOKENS = 1_024;
/** Cluster titles+snippets are capped to this many characters (proposal §4.5). */
const MAX_CLUSTER_CHARS = 6_000;
/** Reddit comment context has its own bound so it cannot crowd out the cluster. */
const MAX_COMMENT_THREAD_CHARS = 6_000;

const RECORD_KNOWLEDGE_KINDS = new Set<RecordKnowledgeKind>(['current_item', 'fan_signal', 'both', 'skip']);
const SKIP_REASONS = new Set<SkipReason>(['not_taylor', 'no_truth_value', 'redline', 'duplicate', 'stale']);

export interface ExtractInput {
  /** The cluster's own raw items — titles/snippets, one per outlet. */
  items: readonly { title: string; snippet: string }[];
  /** Optional, transient Reddit discussion context grouped by post. */
  commentThreads?: readonly ExtractCommentThread[];
  /** symbol_lexicon keys, so the model can match rather than invent one. May be empty this early. */
  symbolLexiconKeys: readonly string[];
  eraId: string;
  /** ISO date (YYYY-MM-DD). */
  today: string;
}

/** Builds the ≤6k-char cluster text the prompt shows — titles+snippets, one line per outlet. */
function clusterText(items: readonly { title: string; snippet: string }[]): string {
  const joined = items.map((i) => `- ${i.title}${i.snippet ? ` — ${i.snippet}` : ''}`).join('\n');
  return joined.length > MAX_CLUSTER_CHARS ? joined.slice(0, MAX_CLUSTER_CHARS) : joined;
}

function commentThreadText(threads: readonly ExtractCommentThread[]): string {
  const joined = threads
    .map((thread) => {
      const comments = thread.comments
        .map((body) => body.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .map((body) => `- ${body}`)
        .join('\n');
      return comments ? `POST: ${thread.postTitle}\n${comments}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
  return joined.length > MAX_COMMENT_THREAD_CHARS ? joined.slice(0, MAX_COMMENT_THREAD_CHARS) : joined;
}

function buildUserMessage(input: ExtractInput): string {
  const message = [
    `TODAY: ${input.today}`,
    `CURRENT ERA: ${input.eraId}`,
    `SYMBOL LEXICON (match these keys where they apply; do not invent a new one): ${
      input.symbolLexiconKeys.length > 0 ? input.symbolLexiconKeys.join(', ') : '(none seeded yet)'
    }`,
    '',
    'CLUSTER (titles/snippets from every outlet covering this story):',
    clusterText(input.items),
  ];
  const comments = commentThreadText(input.commentThreads ?? []);
  if (comments) {
    message.push(
      '',
      'REDDIT COMMENT THREAD CONTEXT (individual fan comments; use only for aggregate discussion signal):',
      comments,
    );
  }
  return message.join('\n');
}

function extractToolInput(body: unknown): unknown | null {
  return extractToolUseInput(body, { fallback: {} });
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

function sanitizeCurrentItem(value: unknown): ExtractedCurrentItem | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const p = value as Record<string, unknown>;
  const observedOn = str(p.observed_on, 10);
  const headline = str(p.headline, 140);
  const summary = str(p.summary, 400);
  const detail = str(p.detail, 1000);
  if (!observedOn || !headline || !summary || !detail) return undefined;

  const category = CURRENT_ITEM_CATEGORIES.includes(p.category as CurrentItemCategory)
    ? (p.category as CurrentItemCategory)
    : 'sighting';
  const statusHint = CURRENT_ITEM_STATUSES.includes(p.status_hint as CurrentItemStatus)
    ? (p.status_hint as CurrentItemStatus)
    : 'rumor';
  const locationLevel = LOCATION_LEVELS.includes(p.location_level as LocationLevel)
    ? (p.location_level as LocationLevel)
    : undefined;

  return {
    observedOn,
    category,
    tags: strArray(p.tags),
    headline,
    summary,
    detail,
    symbols: strArray(p.symbols),
    entities: strArray(p.entities),
    ...(locationLevel ? { locationLevel } : {}),
    statusHint,
  };
}

function sanitizeTheories(value: unknown): ExtractedTheory[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === 'object')
    .map((t) => ({ name: str(t.name, 80), claim: str(t.claim, 300) }))
    .filter((t) => t.name.length > 0 && t.claim.length > 0)
    .slice(0, 10);
}

function sanitizeFanSignal(value: unknown): ExtractedFanSignal | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const p = value as Record<string, unknown>;
  const topic = str(p.topic, 120);
  const summary = str(p.summary, 800);
  if (!topic || !summary) return undefined;
  const stanceMix =
    p.stance_mix && typeof p.stance_mix === 'object' && !Array.isArray(p.stance_mix)
      ? (p.stance_mix as Record<string, unknown>)
      : {};
  return {
    topic,
    summary,
    stanceMix,
    symbols: strArray(p.symbols),
    theories: sanitizeTheories(p.theories),
  };
}

/** Never trust the model's output shape blindly — clamp/validate before it reaches the DB. */
export function sanitizeResult(parsed: unknown): RecordKnowledgeResult {
  const p = (parsed ?? {}) as Record<string, unknown>;
  const kind = RECORD_KNOWLEDGE_KINDS.has(p.kind as RecordKnowledgeKind) ? (p.kind as RecordKnowledgeKind) : 'skip';
  const skipReason = SKIP_REASONS.has(p.skip_reason as SkipReason) ? (p.skip_reason as SkipReason) : undefined;
  const currentItem =
    kind === 'current_item' || kind === 'both' ? sanitizeCurrentItem(p.current_item) : undefined;
  const fanSignal = kind === 'fan_signal' || kind === 'both' ? sanitizeFanSignal(p.fan_signal) : undefined;

  // A "current_item"/"both" kind the model failed to actually populate is
  // not trustworthy enough to write — degrade to skip rather than write a
  // half-empty row (same "never trust the shape" discipline as clown-client's
  // sanitizeTake, applied to a case that function doesn't have: here the
  // required nested object can simply be missing).
  if (kind === 'current_item' && !currentItem) {
    return { kind: 'skip', skipReason: 'no_truth_value', redlineFlags: strArray(p.redline_flags, 40) };
  }
  if (kind === 'fan_signal' && !fanSignal) {
    return { kind: 'skip', skipReason: 'no_truth_value', redlineFlags: strArray(p.redline_flags, 40) };
  }
  if (kind === 'both' && !currentItem && !fanSignal) {
    return { kind: 'skip', skipReason: 'no_truth_value', redlineFlags: strArray(p.redline_flags, 40) };
  }

  return {
    kind,
    ...(skipReason ? { skipReason } : {}),
    ...(currentItem ? { currentItem } : {}),
    ...(fanSignal ? { fanSignal } : {}),
    redlineFlags: strArray(p.redline_flags, 40),
  };
}

async function attempt(apiKey: string, userMessage: string): Promise<RecordKnowledgeResult> {
  const { raw } = await callAnthropicMessages(
    apiKey,
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: EXTRACT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [RECORD_KNOWLEDGE_TOOL],
      tool_choice: { type: 'tool', name: RECORD_KNOWLEDGE_TOOL.name },
      messages: [{ role: 'user', content: userMessage }],
    },
    { errorLabel: 'Anthropic extract', includeBodyTextInError: true },
  );
  const toolInput = extractToolInput(raw);
  if (toolInput === null) throw new Error('Anthropic extract: no tool_use block');
  return sanitizeResult(toolInput);
}

/**
 * Attempts an extract call for one cluster. Returns null (never throws) for
 * the "no key" / "cap hit" cases — those are expected, not exceptional,
 * states (same contract as classify/openai-client.ts's classifyWithLLM).
 * Throws on a genuine API failure so the caller logs it and leaves the
 * cluster's news_story.extracted_at unset, to be retried next cycle.
 */
export async function extractWithLLM(
  usage: ExtractUsageStore,
  input: ExtractInput,
): Promise<RecordKnowledgeResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const reserved = await usage.reserve();
  if (!reserved) return null;

  return attempt(apiKey, buildUserMessage(input));
}
