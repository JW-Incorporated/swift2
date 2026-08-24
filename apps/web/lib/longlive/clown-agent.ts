/**
 * Clownbot — the bounded agent loop (PLAN.md Stage 10, proposal §7).
 *
 * Replaces the old single forced-tool-call compose stage
 * (`clown-client.ts`'s `askClown`, still intact and still directly tested —
 * this module is additive, not a rewrite of it) with a multi-turn loop: the
 * model may call any of the seven read tools (`clown-agent-tools.ts`) before
 * it must call `record_take`. Three HARD caps, enforced in control flow, not
 * left to the prompt:
 *   - `AGENT_MAX_TOOL_CALLS` read-tool calls (record_take itself doesn't
 *     count — the loop cannot finish without it, so counting it against its
 *     own budget would be self-defeating).
 *   - `AGENT_MAX_WALL_MS` of cumulative loop time, checked BETWEEN rounds
 *     (this does not abort an in-flight request early — the same honest
 *     framing `mood-usage.ts` uses for its own per-instance limitation: a
 *     hard cap on when a NEW round may start, not a guaranteed abort mid-call).
 *   - `AGENT_MAX_TOKENS` cumulative input+output tokens, read from the
 *     Anthropic API's own `usage` block on every response — real accounting,
 *     not an estimate.
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

function formatSeedForPrompt(seed: ToolCallResult): string {
  if (seed.items.length === 0) return '(no results)';
  return seed.items
    .slice(0, 8)
    .map((item) => `[${item.id}] (${item.date}) ${item.headline} — ${item.detail.replace(/\s+/g, ' ').trim().slice(0, 240)}`)
    .join('\n');
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
async function executeReadTool(name: string, rawInput: unknown): Promise<ToolDispatch | null> {
  const p = (rawInput ?? {}) as Record<string, unknown>;
  switch (name) {
    case 'search': {
      const query = str(p.query, 200);
      if (!query) return null;
      return { input: { query }, result: await toolSearch(query) };
    }
    case 'precedents': {
      const symbol = str(p.symbol, 100);
      if (!symbol) return null;
      return { input: { symbol }, result: await toolPrecedents(symbol) };
    }
    case 'recent': {
      const days = num(p.days, 7, 1, 90);
      return { input: { days }, result: await toolRecent(days) };
    }
    case 'chatter': {
      const topic = str(p.topic, 100);
      if (!topic) return null;
      return { input: { topic }, result: await toolChatter(topic) };
    }
    case 'symbol_activity': {
      const symbol = str(p.symbol, 100);
      if (!symbol) return null;
      return { input: { symbol }, result: await toolSymbolActivity(symbol) };
    }
    case 'track': {
      const title = str(p.title, 200);
      if (!title) return null;
      return { input: { title }, result: await toolTrack(title) };
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
 */
export async function runClownAgent(
  usage: ClownUsage,
  transcript: readonly ClownTurn[],
  seed: ToolCallResult,
  seedInput: Record<string, unknown>,
  onStep?: (step: InvestigationStep) => void,
  clock: () => number = Date.now,
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
    const capsExhausted =
      toolCallCount >= AGENT_MAX_TOOL_CALLS ||
      tokenTotal >= AGENT_MAX_TOKENS ||
      clock() - startedAt >= AGENT_MAX_WALL_MS;
    const toolChoice = capsExhausted ? ({ type: 'tool', name: CLOWN_TAKE_TOOL.name } as const) : ({ type: 'auto' } as const);

    let response;
    try {
      response = await callAnthropicMessages(apiKey, {
        model: CLOWN_MODEL,
        max_tokens: MAX_TOKENS,
        thinking: THINKING,
        system: [{ type: 'text', text: CLOWN_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools,
        tool_choice: toolChoice,
        messages,
      });
    } catch {
      failedAttempts += 1;
      if (failedAttempts >= 2) return degraded(investigation, pool);
      continue;
    }
    tokenTotal += response.usage.inputTokens + response.usage.outputTokens;

    const toolUseBlocks = extractToolUseBlocks(response.raw);
    const takeBlock = toolUseBlocks.find((b) => b.name === CLOWN_TAKE_TOOL.name);
    if (takeBlock) {
      return { take: sanitizeTake(takeBlock.input), investigation, pool };
    }

    const readBlocks = toolUseBlocks.filter((b) => b.name !== CLOWN_TAKE_TOOL.name);
    if (readBlocks.length === 0) {
      // No tool_use at all (e.g. a stray text-only reply) — nothing to
      // dispatch and nothing to learn from; treat as a failed attempt
      // rather than spinning forever.
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
      const dispatch = await executeReadTool(block.name, block.input);
      if (!dispatch) {
        resultBlocks.push({ type: 'tool_result', tool_use_id: block.id, content: 'Unrecognised tool or missing required argument.' });
        const step: InvestigationStep = { tool: block.name, input: (block.input ?? {}) as Record<string, unknown>, summary: 'call failed — bad input' };
        investigation.push(step);
        onStep?.(step);
        continue;
      }
      addToPool(pool, dispatch.result.items);
      resultBlocks.push({ type: 'tool_result', tool_use_id: block.id, content: dispatch.result.summary });
      const step: InvestigationStep = { tool: block.name, input: dispatch.input, summary: dispatch.result.summary };
      investigation.push(step);
      onStep?.(step);
    }

    messages.push({ role: 'assistant', content: assistantBlocks });
    messages.push({ role: 'user', content: resultBlocks });
  }
}
