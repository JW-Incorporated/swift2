/**
 * Clownbot — the bounded agent loop (PLAN.md Stage 10, proposal §7).
 *
 * Replaces the old single forced-tool-call compose stage
 * (`clown-client.ts`'s `askClown`, still intact and still directly tested —
 * this module is additive, not a rewrite of it) with a multi-turn loop: the
 * model may call any of the seven read tools (`clown-agent-tools.ts`) before
 * it must call `record_take`. Three HARD caps, enforced in control flow, not
 * left to the prompt:
 *   - `AGENT_MAX_TOOL_CALLS` tool calls, `record_take` included (Codex
 *     review BLOCKER 1). Enforced BOTH between rounds (the next call's
 *     `tool_choice` is forced to `record_take` once the cap is reached) AND
 *     WITHIN a round: a single response can legally contain many
 *     simultaneous `tool_use` blocks, so any block beyond the remaining
 *     budget is never dispatched and never added back into the
 *     conversation — the model is credited only for what actually ran.
 *   - `AGENT_MAX_WALL_MS` of cumulative wall time off a SINGLE deadline
 *     (Codex review BLOCKER 2) shared with the route's pre-loop scope
 *     search, via an `AbortSignal` threaded through every async call in
 *     this loop (model calls, tool/DB reads) so an in-flight call is
 *     actually aborted once the deadline passes, not just abandoned.
 *   - `AGENT_MAX_TOKENS` cumulative input+output tokens, read from the
 *     Anthropic API's own `usage` block on every response — real accounting,
 *     not an estimate. Checked WITH a headroom margin (Codex review
 *     BLOCKER 3): the loop forces `record_take` once spent-so-far plus one
 *     more call's worst-case output would already meet the cap, not only
 *     after a round has already blown past it.
 * Once any cap is hit, the NEXT call's `tool_choice` is forced to
 * `record_take` — the model gets one last chance to commit with whatever it
 * has gathered.
 *
 * Reuses `clown-client.ts`'s wire primitive (`callAnthropicMessages`) and
 * model/kill-switch/key gating (`clownModelKey`) — no new model client.
 */
import {
  CLOWN_MODEL,
  MAX_TOKENS,
  MAX_TRANSCRIPT_TURNS,
  REQUEST_TIMEOUT_MS,
  callAnthropicMessages,
  clownModelKey,
  sanitizeTake,
  type ClownTake,
  type ClownTurn,
} from './clown-client';
import { CLOWN_READ_TOOLS, CLOWN_SYSTEM_PROMPT, CLOWN_TAKE_TOOL } from './clown-client-prompt';
import type { ClownUsage } from './clown-usage';
import type { InvestigationStep } from './clown-answer';
import type { RetrievedItem } from './clown-fallback';
import {
  toolChatter,
  toolDateMath,
  toolPrecedents,
  toolRecent,
  toolSearch,
  toolSymbolActivity,
  toolTrack,
  type ToolCallResult,
} from './clown-agent-tools';

/** Thinking OFF — same rationale as `clown-client.ts`'s own `THINKING`
 * constant (not exported from there, so redeclared here rather than adding
 * a cross-module export for one literal). */
const THINKING = { type: 'disabled' } as const;

export const AGENT_MAX_TOOL_CALLS = 6;
export const AGENT_MAX_WALL_MS = 20_000;
export const AGENT_MAX_TOKENS = 2_500;

/**
 * A finite backstop independent of the three named caps above. Those caps
 * all assume a forced `tool_choice` reliably makes the model call the named
 * tool — true for the real Anthropic API, but this loop has no OTHER
 * termination guarantee if that assumption is ever wrong (a misbehaving
 * response, a future API change). This is cheap insurance, not a tuning
 * knob: it should never be the thing that actually ends a real run.
 */
const ABSOLUTE_MAX_ROUNDS = AGENT_MAX_TOOL_CALLS + 4;

export interface AgentRunResult {
  /** `null` on every degraded state (no key, kill switch, over cap, or every
   * attempt failed) — same null-means-degrade contract as `askClown`. */
  take: ClownTake | null;
  investigation: InvestigationStep[];
  /** Every citable doc surfaced across the whole run, keyed by id. The route
   * validates `take.citedIds` and builds `sources` against this, exactly as
   * it already validates against the plain retrieved-docs array today. */
  pool: Map<string, RetrievedItem>;
}

interface AgentContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string;
}

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | AgentContentBlock[];
}

function degraded(investigation: InvestigationStep[], pool: Map<string, RetrievedItem>): AgentRunResult {
  return { take: null, investigation, pool };
}

function addToPool(pool: Map<string, RetrievedItem>, items: readonly RetrievedItem[]): void {
  for (const item of items) pool.set(item.id, item);
}

/** Shared item formatter for both the seed context and every subsequent
 * `tool_result` (Codex review MAJOR 8) — without this, the loop's later
 * rounds sent back only a count-style summary, never the actual retrieved
 * data, so the model had nothing real to cite or reason from after the
 * seed search. */
function formatItemsForPrompt(items: readonly RetrievedItem[]): string {
  return items
    .slice(0, 8)
    .map((item) => `[${item.id}] (${item.date}) ${item.headline} — ${item.detail.replace(/\s+/g, ' ').trim().slice(0, 240)}`)
    .join('\n');
}

function formatSeedForPrompt(seed: ToolCallResult): string {
  if (seed.items.length === 0) return '(no results)';
  return formatItemsForPrompt(seed.items);
}

/** Every subsequent read-tool's `tool_result` content — the actual
 * retrieved data (id/date/headline/detail, truncated), not just the
 * one-line summary already shown in the investigation trail. Tools that
 * never add to the citable pool (`symbol_activity`, `date_math`) have no
 * items to append, so this degrades to the summary alone for those. */
function formatToolResultForPrompt(result: ToolCallResult): string {
  if (result.items.length === 0) return result.summary;
  return [result.summary, formatItemsForPrompt(result.items)].join('\n');
}

function buildSeedText(text: string, seed: ToolCallResult): string {
  return [
    'AN INITIAL SEARCH HAS ALREADY RUN FOR YOU (does not count against your investigation budget):',
    formatSeedForPrompt(seed),
    '',
    'You may call more tools before committing (precedents/recent/chatter/symbol_activity/track/date_math, or search again). Cite ONLY ids exactly as written, from something you have actually seen in a tool result — never invent one.',
    '',
    'READER SAID:',
    text,
  ].join('\n');
}

function buildInitialMessages(transcript: readonly ClownTurn[], seed: ToolCallResult): AgentMessage[] {
  const lastIndex = transcript.length - 1;
  return transcript.map((turn, i) => ({
    role: turn.role,
    content: i === lastIndex ? buildSeedText(turn.text, seed) : turn.text,
  }));
}

function str(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

interface ToolDispatch {
  input: Record<string, unknown>;
  result: ToolCallResult;
}

/** Never trusts the model's tool input shape — same discipline as
 * `sanitizeTake`. Returns `null` for an unrecognised tool or a missing
 * required argument; the caller reports that honestly in the tool_result
 * rather than silently skipping the call (still counts against budget —
 * a model that keeps calling badly-shaped tools must not evade the cap). */
async function executeReadTool(name: string, rawInput: unknown, signal?: AbortSignal): Promise<ToolDispatch | null> {
  const p = (rawInput ?? {}) as Record<string, unknown>;
  switch (name) {
    case 'search': {
      const query = str(p.query, 200);
      if (!query) return null;
      return { input: { query }, result: await toolSearch(query, signal) };
    }
    case 'precedents': {
      const symbol = str(p.symbol, 100);
      if (!symbol) return null;
      return { input: { symbol }, result: await toolPrecedents(symbol, signal) };
    }
    case 'recent': {
      const days = num(p.days, 7, 1, 90);
      return { input: { days }, result: await toolRecent(days, signal) };
    }
    case 'chatter': {
      const topic = str(p.topic, 100);
      if (!topic) return null;
      return { input: { topic }, result: await toolChatter(topic, signal) };
    }
    case 'symbol_activity': {
      const symbol = str(p.symbol, 100);
      if (!symbol) return null;
      return { input: { symbol }, result: await toolSymbolActivity(symbol, signal) };
    }
    case 'track': {
      const title = str(p.title, 200);
      if (!title) return null;
      return { input: { title }, result: await toolTrack(title, signal) };
    }
    case 'date_math': {
      const phrase = str(p.phrase, 50);
      if (!phrase) return null;
      return { input: { phrase }, result: await toolDateMath(phrase) };
    }
    default:
      return null;
  }
}

interface RawToolUseBlock {
  id: string;
  name: string;
  input: unknown;
}

function extractToolUseBlocks(raw: unknown): RawToolUseBlock[] {
  const content = (raw as { content?: unknown })?.content;
  if (!Array.isArray(content)) return [];
  return content
    .filter(
      (b): b is { type: 'tool_use'; id: string; name: string; input: unknown } =>
        Boolean(b) && typeof b === 'object' && (b as { type?: string }).type === 'tool_use',
    )
    .map((b) => ({ id: b.id, name: b.name, input: b.input }));
}

/**
 * Run the bounded loop. `seed` is the route's own pre-loop scope-check
 * search (PLAN.md Stage 10 req 3) — reused as free context rather than
 * spending one of the model's own tool calls repeating it. `onStep`, when
 * given, fires the moment each investigation step is known (including the
 * seed) — the route uses this to stream the trail to the reader live,
 * rather than buffering the whole run and flushing it at the end.
 *
 * `signal` (Codex review BLOCKER 2) is the route's single request-wide
 * deadline — the SAME `AbortSignal` used for its pre-loop scope search —
 * threaded through every model call and every tool dispatch this loop
 * makes, so nothing it awaits can outlive the 20s wall budget regardless of
 * where the hang happens.
 */
export async function runClownAgent(
  usage: ClownUsage,
  transcript: readonly ClownTurn[],
  seed: ToolCallResult,
  seedInput: Record<string, unknown>,
  onStep?: (step: InvestigationStep) => void,
  clock: () => number = Date.now,
  signal?: AbortSignal,
): Promise<AgentRunResult> {
  const pool = new Map<string, RetrievedItem>();
  addToPool(pool, seed.items);
  const seedStep: InvestigationStep = { tool: 'search', input: seedInput, summary: seed.summary };
  const investigation: InvestigationStep[] = [seedStep];
  onStep?.(seedStep);

  const apiKey = clownModelKey();
  if (!apiKey) return degraded(investigation, pool);

  const capped = transcript.slice(-MAX_TRANSCRIPT_TURNS);
  if (capped.length === 0 || capped[capped.length - 1].role !== 'user') return degraded(investigation, pool);

  if (!usage.reserve()) return degraded(investigation, pool);

  const messages: AgentMessage[] = buildInitialMessages(capped, seed);
  const tools = [...CLOWN_READ_TOOLS, CLOWN_TAKE_TOOL];
  const startedAt = clock();
  let toolCallCount = 0;
  let tokenTotal = 0;
  let failedAttempts = 0;
  let round = 0;

  while (true) {
    round += 1;
    if (round > ABSOLUTE_MAX_ROUNDS) return degraded(investigation, pool);
    // The shared deadline can fire mid-call (via `callAnthropicMessages`'s
    // abort listener) or between rounds — checking it here catches both: a
    // round that was already in flight when the deadline passed lands back
    // here with nothing more to do.
    if (signal?.aborted) return degraded(investigation, pool);

    // Clamped at 0, never negative — once wall time is already spent this
    // still lets the model attempt ONE forced `record_take` call (the "one
    // last chance to commit" the module is built around) rather than
    // silently degrading with nothing tried; `Math.min` below then gives
    // that call an effectively-immediate timeout, so it fails fast into the
    // existing retry/degrade path instead of getting a full fresh timeout
    // window. The real hard ceiling on total wall time is the route's own
    // `signal`, which aborts any in-flight call (this one included) the
    // moment its deadline timer fires, independent of this arithmetic.
    const remainingWallMs = Math.max(0, AGENT_MAX_WALL_MS - (clock() - startedAt));

    // Headroom margin (Codex review BLOCKER 3): force `record_take` once
    // spent-so-far plus one more call's worst-case output would already
    // meet the token cap, not only once a round has already blown past it
    // — `tokenTotal` alone being under the cap does not mean another full
    // round safely fits under it.
    const tokenBudgetExhausted = tokenTotal + MAX_TOKENS >= AGENT_MAX_TOKENS;
    const capsExhausted = toolCallCount >= AGENT_MAX_TOOL_CALLS || tokenBudgetExhausted || remainingWallMs <= 0;
    const toolChoice = capsExhausted ? ({ type: 'tool', name: CLOWN_TAKE_TOOL.name } as const) : ({ type: 'auto' } as const);

    let response;
    try {
      response = await callAnthropicMessages(
        apiKey,
        {
          model: CLOWN_MODEL,
          max_tokens: MAX_TOKENS,
          thinking: THINKING,
          system: [{ type: 'text', text: CLOWN_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          tools,
          tool_choice: toolChoice,
          messages,
        },
        Math.min(REQUEST_TIMEOUT_MS, remainingWallMs),
        signal,
      );
    } catch {
      failedAttempts += 1;
      if (failedAttempts >= 2) return degraded(investigation, pool);
      continue;
    }
    tokenTotal += response.usage.inputTokens + response.usage.outputTokens;

    const toolUseBlocks = extractToolUseBlocks(response.raw);
    const takeBlock = toolUseBlocks.find((b) => b.name === CLOWN_TAKE_TOOL.name);
    if (takeBlock) {
      // Counted too (Codex review BLOCKER 1) — the loop cannot finish
      // without calling it, but the advertised cap covers every tool call
      // made, this one included, not just the read tools before it.
      toolCallCount += 1;
      return { take: sanitizeTake(takeBlock.input), investigation, pool };
    }

    const readBlocksAll = toolUseBlocks.filter((b) => b.name !== CLOWN_TAKE_TOOL.name);
    if (readBlocksAll.length === 0) {
      // No tool_use at all (e.g. a stray text-only reply) — nothing to
      // dispatch and nothing to learn from; treat as a failed attempt
      // rather than spinning forever.
      failedAttempts += 1;
      if (failedAttempts >= 2) return degraded(investigation, pool);
      continue;
    }

    // HARD CAP within the round too (Codex review BLOCKER 1): a single
    // response can legally contain many simultaneous tool_use blocks, so
    // the between-round check above is not enough on its own — anything
    // beyond the remaining budget is dropped from the reconstructed
    // conversation entirely, never dispatched and never counted twice.
    const budgetRemaining = Math.max(0, AGENT_MAX_TOOL_CALLS - toolCallCount);
    const readBlocks = readBlocksAll.slice(0, budgetRemaining);
    if (readBlocks.length === 0) {
      // Every read block in this response was already over budget (should
      // only be reachable if the budget was exhausted exactly as this
      // response landed) — same "nothing to learn from" treatment.
      failedAttempts += 1;
      if (failedAttempts >= 2) return degraded(investigation, pool);
      continue;
    }

    const assistantBlocks: AgentContentBlock[] = readBlocks.map((b) => ({
      type: 'tool_use',
      id: b.id,
      name: b.name,
      input: b.input,
    }));
    const resultBlocks: AgentContentBlock[] = [];

    for (const block of readBlocks) {
      toolCallCount += 1;
      const dispatch = await executeReadTool(block.name, block.input, signal);
      if (!dispatch) {
        resultBlocks.push({ type: 'tool_result', tool_use_id: block.id, content: 'Unrecognised tool or missing required argument.' });
        const step: InvestigationStep = { tool: block.name, input: (block.input ?? {}) as Record<string, unknown>, summary: 'call failed — bad input' };
        investigation.push(step);
        onStep?.(step);
        continue;
      }
      addToPool(pool, dispatch.result.items);
      // The actual retrieved data, not just the summary (Codex review
      // MAJOR 8) — without this the model has nothing real to cite from
      // after the seed search.
      resultBlocks.push({ type: 'tool_result', tool_use_id: block.id, content: formatToolResultForPrompt(dispatch.result) });
      const step: InvestigationStep = { tool: block.name, input: dispatch.input, summary: dispatch.result.summary };
      investigation.push(step);
      onStep?.(step);
    }

    messages.push({ role: 'assistant', content: assistantBlocks });
    messages.push({ role: 'user', content: resultBlocks });
  }
}
