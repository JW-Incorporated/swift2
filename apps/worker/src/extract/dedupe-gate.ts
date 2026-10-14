// Content fix 7 — LLM same-event dedupe gate, applied BEFORE a new
// current_item is inserted (spec: docs/content-ops — Owner report 2026-10-13,
// "three posts about the same Trump-video event, two about Nashville
// Songwriters Hall of Fame"). The existing clusterer
// (packages/shared/src/news/cross-outlet-similarity.ts, run-cycle.ts's
// `clusterBatch`) is lexical-only and clusters BEFORE extraction — different
// outlets wording the same event differently routinely slip past it and each
// becomes its own news_story, hence its own current_item. This module is the
// second, semantic line of defense: right before a current_item is written,
// it asks one Haiku call "is this the same real-world event as something
// already live?", and if so, folds any genuinely new facts into the ORIGINAL
// item instead of publishing a second one.
//
// Candidates are pre-filtered CHEAPLY with plain lexical overlap (reusing the
// existing stopword-aware tokenizer from news/similarity.ts, same family as
// CrossOutletSimilarityProvider) — never send the whole feed to the LLM, only
// the top 5 by title+summary overlap.
//
// Fail-closed contract: a missing API key, an exhausted budget, or a genuine
// API error all resolve to `{ action: 'hold' }` — the caller must NOT publish
// a possibly-duplicate item this cycle; it is retried next cycle. Never falls
// open into publishing a possible duplicate.

import type { SupabaseClient } from '@supabase/supabase-js';
import { tokenize, STOPWORDS } from '@swift2/shared/news';
import { callAnthropicMessages, extractToolUseInput } from '@swift2/shared/llm/anthropic-messages';
import type { ExtractedCurrentItem } from './types';
import type { ExtractUsageStore } from './usage-store';
import type { ClusterSource } from './write-knowledge';

/** How far back a candidate current_item may be and still be considered for
 * the same-event gate (spec §A: "live, non-expired, non-promoted
 * current_items from the last 7 days"). */
export const CANDIDATE_WINDOW_DAYS = 7;

/** Never send more than this many candidates to the LLM in one call — the
 * cheap lexical pre-filter below shortlists down to this many first. */
export const MAX_CANDIDATES_TO_LLM = 5;

const MODEL = 'claude-haiku-4-5'; // same cost tier as haiku-client.ts's extract call
const GATE_MAX_TOKENS = 512;
const MERGE_MAX_TOKENS = 512;

export interface DedupeCandidate {
  id: string;
  headline: string;
  summary: string;
  detail: string;
}

/** Plain row shape loaded from `current_item` for the gate's candidate pool. */
export interface DedupeCandidateRow extends DedupeCandidate {
  sources: readonly ClusterSource[];
  imageUrl: string | null;
  heat: number;
}

/** Loads the live, non-expired, non-promoted, non-already-merged
 * current_items in the window for one era — the raw candidate pool BEFORE
 * the cheap shortlist below narrows it to <= MAX_CANDIDATES_TO_LLM. */
export async function loadDedupeCandidates(
  db: SupabaseClient,
  eraId: string,
  windowDays: number = CANDIDATE_WINDOW_DAYS,
): Promise<DedupeCandidateRow[]> {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from('current_item')
    .select('id, headline, summary, detail, sources, image_url, heat')
    .eq('era_id', eraId)
    .is('promoted_to', null)
    .is('merged_into', null)
    .gte('observed_on', cutoff)
    .gt('expires_at', nowIso)
    .limit(200);
  if (error) throw new Error(`loadDedupeCandidates failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    headline: r.headline as string,
    summary: r.summary as string,
    detail: (r.detail as string) ?? '',
    sources: ((r.sources as unknown[]) ?? []).map((s) => s as ClusterSource),
    imageUrl: (r.image_url as string | null) ?? null,
    heat: (r.heat as number) ?? 0,
  }));
}

/** Cheap, zero-vendor overlap score — token-set Jaccard over headline +
 * summary, reusing the same stopword-aware tokenizer the lexical clusterer
 * uses. Only a pre-filter: the real "same event" judgment is the LLM call
 * below. This never needs to be precise, only to avoid sending an obviously
 * unrelated candidate pool to the model. */
function overlapScore(a: string, b: string): number {
  const ta = new Set(tokenize(a).filter((t) => !STOPWORDS.has(t)));
  const tb = new Set(tokenize(b).filter((t) => !STOPWORDS.has(t)));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

/** Top `limit` candidates by title+summary overlap with the new item — the
 * shortlist actually sent to the LLM (spec: "Never send the whole feed"). */
export function shortlistCandidates(
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary'>,
  candidates: readonly DedupeCandidateRow[],
  limit: number = MAX_CANDIDATES_TO_LLM,
): DedupeCandidateRow[] {
  const newText = `${newItem.headline} ${newItem.summary}`;
  return [...candidates]
    .map((c) => ({ c, score: overlapScore(newText, `${c.headline} ${c.summary}`) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

const GATE_SYSTEM_PROMPT = [
  'You check whether a NEW news item is about the SAME real-world event as one of several CANDIDATE items already live on a Taylor Swift fan site, or a genuinely distinct development.',
  '',
  'SAME EVENT means the same real-world happening reported by different outlets or at a slightly different angle — e.g. "Taylor Swift song pulled from a Trump campaign video" and "Trump campaign removes Taylor Swift song after objection" ARE the same event.',
  'NOT the same event: a genuinely new development that follows from the same topic, e.g. "song removed from video" then later "Taylor Swift files lawsuit over the video" — the lawsuit is new, reportable news in its own right, even though it is about the same underlying situation. When in doubt between "same event" and "follow-up with new development", prefer treating it as NOT the same event — this gate only exists to stop literal duplicates, not to suppress real follow-up reporting.',
  '',
  'If it IS the same event as exactly one candidate: set same_event=true, match_id to that candidate\'s id, and decide adds_new_info — true only if the NEW item contains a concrete fact (a name, number, date, quote, or outcome) that is NOT already present in that candidate\'s summary/detail. If it adds new info, list each new fact in new_facts as a short, independent sentence grounded only in the NEW item\'s own text — never invent or embellish.',
  'If it is not the same event as any candidate, set same_event=false and match_id=null.',
  'Report through the check_same_event tool only, no prose outside it.',
].join('\n');

const GATE_TOOL = {
  name: 'check_same_event',
  description: 'Report whether the new item is the same real-world event as one of the candidates.',
  input_schema: {
    type: 'object',
    properties: {
      same_event: { type: 'boolean' },
      match_id: {
        type: ['string', 'null'],
        description: 'The exact id of the matching candidate, or null when same_event is false.',
      },
      adds_new_info: {
        type: 'boolean',
        description: 'True only when the new item has a concrete fact the matched candidate lacks.',
      },
      new_facts: {
        type: 'array',
        items: { type: 'string' },
        description: 'Short, independent sentences of new, grounded facts. Empty when adds_new_info is false.',
      },
    },
    required: ['same_event', 'match_id', 'adds_new_info', 'new_facts'],
    additionalProperties: false,
  },
} as const;

export interface GateLLMResult {
  sameEvent: boolean;
  matchId: string | null;
  addsNewInfo: boolean;
  newFacts: string[];
}

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
  for (const c of candidates) {
    lines.push(`- id: ${c.id}`, `  headline: ${c.headline}`, `  summary: ${c.summary}`, `  detail: ${c.detail}`);
  }
  return lines.join('\n');
}

function sanitizeGateResult(parsed: unknown, validIds: ReadonlySet<string>): GateLLMResult {
  const p = (parsed ?? {}) as Record<string, unknown>;
  const rawMatchId = typeof p.match_id === 'string' ? p.match_id : null;
  const matchId = rawMatchId && validIds.has(rawMatchId) ? rawMatchId : null;
  const sameEvent = Boolean(p.same_event) && matchId !== null;
  const addsNewInfo = sameEvent && Boolean(p.adds_new_info);
  const newFacts = addsNewInfo && Array.isArray(p.new_facts)
    ? p.new_facts.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).slice(0, 10)
    : [];
  return { sameEvent, matchId, addsNewInfo, newFacts };
}

/** One gated Haiku call: same null-on-degraded-state / throw-on-real-failure
 * contract as haiku-client.ts's extractWithLLM, reusing the SAME
 * ExtractUsageStore budget (spec: "reuse the existing Haiku client and
 * usage-store budget accounting"). Returns null when there is no key or the
 * budget is spent — the caller must treat that as HOLD, never as "no
 * duplicate found". */
export async function checkSameEvent(
  usage: ExtractUsageStore,
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary' | 'detail'>,
  candidates: readonly DedupeCandidate[],
): Promise<GateLLMResult | null> {
  if (candidates.length === 0) return { sameEvent: false, matchId: null, addsNewInfo: false, newFacts: [] };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const reserved = await usage.reserve();
  if (!reserved) return null;

  const { raw } = await callAnthropicMessages(
    apiKey,
    {
      model: MODEL,
      max_tokens: GATE_MAX_TOKENS,
      system: [{ type: 'text', text: GATE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [GATE_TOOL],
      tool_choice: { type: 'tool', name: GATE_TOOL.name },
      messages: [{ role: 'user', content: buildGateUserMessage(newItem, candidates) }],
    },
    { errorLabel: 'Anthropic dedupe-gate', includeBodyTextInError: true },
  );
  const toolInput = extractToolUseInput(raw, { toolName: GATE_TOOL.name });
  if (toolInput === null) throw new Error('Anthropic dedupe-gate: no tool_use block');
  return sanitizeGateResult(toolInput, new Set(candidates.map((c) => c.id)));
}

const MERGE_SYSTEM_PROMPT = [
  'You rewrite the summary and detail of an existing news item on a Taylor Swift fan site to fold in genuinely new facts from a duplicate report of the SAME event, without inventing anything.',
  '- Use ONLY the facts given below (the original summary/detail, plus the new facts list) — never add a fact, name, date, or number that is not present in that text.',
  '- `summary`: 2-3 sentences, 160-400 characters.',
  '- `detail`: a real paragraph, 60-150 words.',
  '- Keep the existing tone and any existing hedging language (rumor/reported/confirmed) — never state something more confidently than the original did.',
  'Report through the rewrite_item tool only, no prose outside it.',
].join('\n');

const MERGE_TOOL = {
  name: 'rewrite_item',
  description: 'Rewrite summary/detail to include the new facts, grounded only in the given text.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: '2-3 sentences, 160-400 characters.' },
      detail: { type: 'string', description: '60-150 words.' },
    },
    required: ['summary', 'detail'],
    additionalProperties: false,
  },
} as const;

export interface MergeLLMResult {
  summary: string;
  detail: string;
}

const MIN_SUMMARY_CHARS = 160;
const MAX_SUMMARY_CHARS = 400;
const MIN_DETAIL_WORDS = 60;
const MAX_DETAIL_WORDS = 150;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** True when `text` meets the length floors/ceilings the merge output must
 * respect (spec: "Keep the length limits"). Used to reject an out-of-range
 * merge rewrite rather than ever publish one that violates the copy floor. */
export function mergeOutputWithinLimits(result: MergeLLMResult): boolean {
  const { summary, detail } = result;
  if (summary.length < MIN_SUMMARY_CHARS || summary.length > MAX_SUMMARY_CHARS) return false;
  const words = wordCount(detail);
  if (words < MIN_DETAIL_WORDS || words > MAX_DETAIL_WORDS) return false;
  return true;
}

/** Calls the merge rewrite. Same null-on-degraded / throw-on-failure contract
 * as checkSameEvent, sharing the same usage budget. */
export async function mergeNewFacts(
  usage: ExtractUsageStore,
  original: Pick<DedupeCandidate, 'summary' | 'detail'>,
  newFacts: readonly string[],
): Promise<MergeLLMResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const reserved = await usage.reserve();
  if (!reserved) return null;

  const userMessage = [
    `ORIGINAL SUMMARY: ${original.summary}`,
    `ORIGINAL DETAIL: ${original.detail}`,
    '',
    'NEW FACTS TO FOLD IN:',
    ...newFacts.map((f) => `- ${f}`),
  ].join('\n');

  const { raw } = await callAnthropicMessages(
    apiKey,
    {
      model: MODEL,
      max_tokens: MERGE_MAX_TOKENS,
      system: [{ type: 'text', text: MERGE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [MERGE_TOOL],
      tool_choice: { type: 'tool', name: MERGE_TOOL.name },
      messages: [{ role: 'user', content: userMessage }],
    },
    { errorLabel: 'Anthropic dedupe-merge', includeBodyTextInError: true },
  );
  const toolInput = extractToolUseInput(raw, { toolName: MERGE_TOOL.name }) as
    | { summary?: unknown; detail?: unknown }
    | null;
  if (toolInput === null) throw new Error('Anthropic dedupe-merge: no tool_use block');
  const summary = typeof toolInput.summary === 'string' ? toolInput.summary.trim() : '';
  const detail = typeof toolInput.detail === 'string' ? toolInput.detail.trim() : '';
  if (!summary || !detail) throw new Error('Anthropic dedupe-merge: empty summary/detail');
  return { summary, detail };
}

/** One of four terminal outcomes for a candidate current_item, exactly the
 * vocabulary the spec asks to be auditable: kept-new (publish) / merged /
 * discarded / held. */
export type DedupeDecision =
  | { action: 'publish' }
  | { action: 'merge'; candidateId: string; mergedSummary?: string; mergedDetail?: string }
  | { action: 'discard'; candidateId: string }
  | { action: 'hold'; reason: string };

/**
 * The full same-event gate for one extracted current_item: shortlists
 * candidates, runs the LLM same-event check, and (for a confirmed same-event
 * match with new info) the merge rewrite. Fails CLOSED to `hold` on any LLM
 * unavailability or error — never publishes a possible duplicate.
 */
export async function evaluateSameEventGate(
  usage: ExtractUsageStore,
  candidates: readonly DedupeCandidateRow[],
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary' | 'detail'>,
): Promise<DedupeDecision> {
  if (candidates.length === 0) return { action: 'publish' };

  const shortlist = shortlistCandidates(newItem, candidates);
  if (shortlist.length === 0) return { action: 'publish' };

  let gateResult: GateLLMResult | null;
  try {
    gateResult = await checkSameEvent(usage, newItem, shortlist);
  } catch (err) {
    // A genuine API failure must fail closed, not fail open into a duplicate.
    return { action: 'hold', reason: `dedupe-gate call failed: ${(err as Error).message}` };
  }
  if (gateResult === null) {
    return { action: 'hold', reason: 'dedupe-gate unavailable (no key or budget exhausted)' };
  }
  if (!gateResult.sameEvent || !gateResult.matchId) return { action: 'publish' };

  if (!gateResult.addsNewInfo || gateResult.newFacts.length === 0) {
    return { action: 'discard', candidateId: gateResult.matchId };
  }

  const original = candidates.find((c) => c.id === gateResult.matchId);
  if (!original) return { action: 'discard', candidateId: gateResult.matchId };

  let mergeResult: MergeLLMResult | null;
  try {
    mergeResult = await mergeNewFacts(usage, original, gateResult.newFacts);
  } catch (err) {
    // The duplicate is confirmed (same_event=true) even if the merge
    // rewrite itself failed — still discard it (never publish a duplicate),
    // just without updating the original's copy this cycle.
    console.error(`dedupe-merge failed for candidate ${gateResult.matchId}: ${(err as Error).message}`);
    return { action: 'discard', candidateId: gateResult.matchId };
  }
  if (mergeResult === null || !mergeOutputWithinLimits(mergeResult)) {
    return { action: 'discard', candidateId: gateResult.matchId };
  }

  return {
    action: 'merge',
    candidateId: gateResult.matchId,
    mergedSummary: mergeResult.summary,
    mergedDetail: mergeResult.detail,
  };
}
