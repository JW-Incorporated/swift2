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
 *     review BLOCKER 1). Enforced BOTH between rounds (the READ budget is
 *     one slot short of the cap, so the call that would otherwise be the
 *     cap-th read is forced to `record_take` instead — total tool calls
 *     never exceed the cap, not cap + 1) AND WITHIN a round: a single
 *     response can legally contain many simultaneous `tool_use` blocks, so
 *     any block beyond the remaining budget is never dispatched and never
 *     added back into the conversation — the model is credited only for
 *     what actually ran.
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
 *     after a round has already blown past it. If spend is already AT or
 *     OVER the cap outright (not just tight), no further call is made at
 *     all — unlike a tool-call count, a token overshoot already happened and
 *     can't be bounded after the fact by forcing one more call.
 * Once any cap is hit, the NEXT call's `tool_choice` is forced to
 * `record_take` — the model gets one last chance to commit with whatever it
 * has gathered.
 *
 * Reuses `clown-client.ts`'s wire primitive (`callAnthropicMessages`) and
 * model/kill-switch/key gating (`clownModelKey`) — no new model client.
 *
 * PER-USER RESERVATION ORDERING (Codex review fix, HUMAN-ACTIONS.md #15 item
 * 2): `route.ts` used to reserve the caller's per-user daily budget
 * (`clown-memory.ts`) BEFORE this function's own key/kill-switch/global-cap
 * checks below, so a request that degraded on one of those never spent any
 * model budget but still consumed the user's daily allowance. The route now
 * only resolves the session up front (needed synchronously for the
 * `x-clown-session` response header) and hands the actual reservation in as
 * `reserveUserBudget`, called from here — after `clownModelKey()` and
 * `usage.reserve()` (global) both already passed, right before the first
 * model request is built — so it only ever fires once a model call is
 * genuinely about to happen.
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
import type { ToolCallResult } from './clown-agent-tools';
import {
  buildInitialMessages,
  executeReadTool,
  extractToolUseBlocks,
  formatToolResultForPrompt,
  type AgentContentBlock,
  type AgentMessage,
} from './clown-agent-prompt';

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
  /** `null` on every degraded state (no key, kill switch, over cap, over the
   * caller's per-user cap, or every attempt failed) — same null-means-degrade
   * contract as `askClown`. */
  take: ClownTake | null;
  investigation: InvestigationStep[];
  /** Every citable doc surfaced across the whole run, keyed by id. The route
   * validates `take.citedIds` and builds `sources` against this, exactly as
   * it already validates against the plain retrieved-docs array today. */
  pool: Map<string, RetrievedItem>;
  /** `true` only when `reserveUserBudget` was given AND reported the caller
   * over their per-user daily cap — lets the route give that one degraded
   * state its own distinct response copy ("come back tomorrow") instead of
   * the generic fallback every other degraded state gets. Absent (not just
   * `false`) for every other outcome. */
  overUserCap?: boolean;
}

function degraded(investigation: InvestigationStep[], pool: Map<string, RetrievedItem>): AgentRunResult {
  return { take: null, investigation, pool };
}

function addToPool(pool: Map<string, RetrievedItem>, items: readonly RetrievedItem[]): void {
  for (const item of items) pool.set(item.id, item);
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
 *
 * `priorSummary` (PLAN.md Stage 11 fix, HUMAN-ACTIONS.md #15 item 2:
 * "persisted memory is write-only") — the caller's rolling conversation
 * summary from `clown-memory.ts`'s `loadClownHistory`, when one exists. Fed
 * to the model as an extra, uncached `system` block (never mixed into
 * `messages`, so it never has to fake alternating user/assistant roles) —
 * see the `system` array below.
 *
 * `reserveUserBudget`, when given, is called ONCE, right here (see this
 * module's own header for why it lives at this exact point and not in
 * `route.ts` before this function is even called).
 */
export async function runClownAgent(
  usage: ClownUsage,
  transcript: readonly ClownTurn[],
  seed: ToolCallResult,
  seedInput: Record<string, unknown>,
  onStep?: (step: InvestigationStep) => void,
  clock: () => number = Date.now,
  signal?: AbortSignal,
  priorSummary?: string,
  reserveUserBudget?: () => Promise<boolean>,
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

  // PER-USER RESERVATION (see this module's header) — only reached once the
  // key/kill-switch check and the global cap above both already passed, so
  // a request that was always going to degrade on one of those never
  // touches the caller's per-user allowance.
  if (reserveUserBudget && !(await reserveUserBudget())) {
    return { take: null, investigation, pool, overUserCap: true };
  }

  const messages: AgentMessage[] = buildInitialMessages(capped, seed);
  const tools = [...CLOWN_READ_TOOLS, CLOWN_TAKE_TOOL];
  const system = priorSummary
    ? [
        { type: 'text' as const, text: CLOWN_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } },
        { type: 'text' as const, text: `EARLIER IN THIS CONVERSATION (summarized, from a previous message or session):\n${priorSummary}` },
      ]
    : [{ type: 'text' as const, text: CLOWN_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } }];
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

    // Combined six-call/token gate (DEBUG.md third-pass hypothesis), computed
    // BEFORE this call is requested rather than accounted for after it
    // returns: once the token budget is already spent outright (not merely
    // tight), there is no way to bound an unplanned overshoot the way a
    // tool-call count can be — so that case gets NO further model call at
    // all, full stop, rather than one more forced attempt.
    if (tokenTotal >= AGENT_MAX_TOKENS) return degraded(investigation, pool);

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

    // Six-call cap: `record_take` is itself one of the `AGENT_MAX_TOOL_CALLS`
    // tool calls, never an extra one on top of it — so the READ budget this
    // check gates is one slot short of the cap. The call that would
    // otherwise be the cap-th READ call is forced to `record_take` instead,
    // keeping the total (reads + take) at exactly the cap, never cap + 1.
    const sixCallBudgetReached = toolCallCount >= AGENT_MAX_TOOL_CALLS - 1;
    // Token headroom margin (Codex review BLOCKER 3): force `record_take`
    // once spent-so-far plus one more call's worst-case output would already
    // meet the token cap, not only once a round has already blown past it
    // — `tokenTotal` alone being under the cap does not mean another full
    // round safely fits under it.
    const tokenHeadroomExhausted = tokenTotal + MAX_TOKENS >= AGENT_MAX_TOKENS;
    const capsExhausted = sixCallBudgetReached || tokenHeadroomExhausted || remainingWallMs <= 0;
    const toolChoice = capsExhausted ? ({ type: 'tool', name: CLOWN_TAKE_TOOL.name } as const) : ({ type: 'auto' } as const);

    let response;
    try {
      response = await callAnthropicMessages(
        apiKey,
        {
          model: CLOWN_MODEL,
          max_tokens: MAX_TOKENS,
          thinking: THINKING,
          system,
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
