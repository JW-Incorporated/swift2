import type { AnthropicCallResult } from '@swift2/shared/llm/anthropic-messages';
import { callClaude } from '../../../../scripts/lib/claude-call.mjs';

export const CLOWN_MODEL = 'claude-sonnet-5-5';
const CLOWN_MAX_CALLS = 1_200;

interface ToolDefinition {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value
    .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text) : ''))
    .filter(Boolean)
    .join('\n');
}

function toolCallSchema(tools: ToolDefinition[]): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      tool_calls: {
        type: 'array',
        minItems: 1,
        maxItems: tools.length,
        items: {
          oneOf: tools.map((tool) => ({
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { const: tool.name },
              input: tool.input_schema,
            },
            required: ['name', 'input'],
          })),
        },
      },
    },
    required: ['tool_calls'],
  };
}

function toolBlocks(data: unknown, forcedName?: string): unknown[] {
  const calls = forcedName
    ? [{ name: forcedName, input: data }]
    : ((data as { tool_calls?: unknown[] } | null)?.tool_calls ?? []);
  return calls.map((call, index) => {
    const record = call as { name?: unknown; input?: unknown };
    return {
      type: 'tool_use',
      id: `wrapper-tool-${index}`,
      name: String(record.name ?? ''),
      input: record.input ?? {},
    };
  });
}

/**
 * Compatibility surface for Clownbot's existing tool loop. The CLI wrapper
 * has tools disabled, so logical tool choices are requested as JSON schema
 * and translated back into the loop's established tool_use block shape.
 */
export async function callClownModel(
  body: Record<string, unknown>,
  signal?: AbortSignal,
  callClaudeImpl: typeof callClaude = callClaude,
): Promise<AnthropicCallResult> {
  if (signal?.aborted) throw new Error('Claude clown call aborted');
  const tools = Array.isArray(body.tools) ? body.tools as ToolDefinition[] : [];
  const choice = body.tool_choice as { type?: string; name?: string } | undefined;
  const forcedName = choice?.type === 'tool' ? choice.name : undefined;
  const forcedTool = forcedName ? tools.find((tool) => tool.name === forcedName) : undefined;
  if (tools.length === 0 || (forcedName && !forcedTool)) {
    throw new Error('Claude clown call has no valid logical tools');
  }
  const system = [
    textOf(body.system),
    'Choose from these logical tools. Treat their descriptions and input schemas as authoritative:',
    JSON.stringify(tools),
  ].filter(Boolean).join('\n\n');
  const outcome = await callClaudeImpl({
    caller: 'clown-client',
    priority: process.env.CLOWN_CALL_PRIORITY === 'P3' ? 'P3' : 'P2',
    model: CLOWN_MODEL,
    system,
    user: JSON.stringify(body.messages ?? []),
    schema: forcedTool?.input_schema ?? toolCallSchema(tools),
    maxInputTokens: 16_000,
    maxCalls: CLOWN_MAX_CALLS,
    // Ignored by the public wrapper. Existing Clownbot transport tests use
    // this inert copy to fake the wrapper while preserving their request-
    // shape assertions without a live CLI.
    compatBody: body,
  });
  if (outcome.status !== 'ok') throw new Error(outcome.reason ?? outcome.status);
  return {
    raw: { content: toolBlocks(outcome.data, forcedName) },
    usage: {
      inputTokens: outcome.usage?.inputTokens ?? 0,
      outputTokens: outcome.usage?.outputTokens ?? 0,
    },
  };
}
