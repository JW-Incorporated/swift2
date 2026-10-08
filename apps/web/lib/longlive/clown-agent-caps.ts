/**
 * Clownbot agent loop — per-round cap arithmetic, split out of
 * `clown-agent.ts` purely for file-length hygiene (MAP.md; CLAUDE.md's
 * 300-line guideline — flagged as a LOW finding in HUMAN-ACTIONS.md #15).
 * Pure and side-effect free: given the loop's current counters, decides
 * whether every cap (tool-call count, token headroom, wall clock) is
 * already exhausted for the NEXT call, and what `tool_choice` that implies.
 * A straight extraction of `clown-agent.ts`'s own inline block — no
 * behavior change, see that module's header for the caps' own rationale
 * (Codex review BLOCKERs 1/3).
 */
import { MAX_TOKENS } from './clown-client';
import { CLOWN_TAKE_TOOL } from './clown-client-prompt';

/** Matches the `tool_choice` shape `callAnthropicMessages` (clown-client.ts)
 * accepts — not exported from there, so redeclared here rather than adding
 * a cross-module export for this one union. */
export type ToolChoice = { type: 'auto' } | { type: 'tool'; name: string };

export interface CapState {
  toolChoice: ToolChoice;
  capsExhausted: boolean;
}

export interface CapInputs {
  toolCallCount: number;
  tokenTotal: number;
  remainingWallMs: number;
  maxToolCalls: number;
  maxTokens: number;
}

export function computeCapState(inputs: CapInputs): CapState {
  // Six-call cap: `record_take` is itself one of the `maxToolCalls` tool
  // calls, never an extra one on top of it — so the READ budget this check
  // gates is one slot short of the cap. The call that would otherwise be
  // the cap-th READ call is forced to `record_take` instead, keeping the
  // total (reads + take) at exactly the cap, never cap + 1.
  const sixCallBudgetReached = inputs.toolCallCount >= inputs.maxToolCalls - 1;
  // Token headroom margin (Codex review BLOCKER 3): force `record_take`
  // once spent-so-far plus one more call's worst-case output would already
  // meet the token cap, not only once a round has already blown past it —
  // `tokenTotal` alone being under the cap does not mean another full round
  // safely fits under it.
  const tokenHeadroomExhausted = inputs.tokenTotal + MAX_TOKENS >= inputs.maxTokens;
  const capsExhausted = sixCallBudgetReached || tokenHeadroomExhausted || inputs.remainingWallMs <= 0;
  const toolChoice: ToolChoice = capsExhausted ? { type: 'tool', name: CLOWN_TAKE_TOOL.name } : { type: 'auto' };
  return { toolChoice, capsExhausted };
}
