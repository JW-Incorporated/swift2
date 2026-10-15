/* global Response */
import { ANTHROPIC_MESSAGES_URL } from './anthropic.mjs';
import { callClaude } from './claude-call.mjs';

const RUNTIME_KEY_ENV = 'ANTHROPIC_API_KEY';
const TOOLING_KEY_SENTINEL = 'subscription-wrapper-tooling';

function textOf(value) {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value
    .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text) : ''))
    .filter(Boolean)
    .join('\n');
}

function toolCallSchema(tools) {
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

function toolBlocks(data, forcedName) {
  const calls = forcedName
    ? [{ name: forcedName, input: data }]
    : (data?.tool_calls ?? []);
  return calls.map((call, index) => ({
    type: 'tool_use',
    id: `wrapper-tool-${index}`,
    name: String(call?.name ?? ''),
    input: call?.input ?? {},
  }));
}

function requestUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * Tooling-only bridge for end-to-end runners that intentionally reuse the
 * production Mood/Clown control flow. Runtime clients still build their normal
 * Messages request, but this process intercepts that one endpoint and fulfills
 * it through the public Claude CLI wrapper at P3. Other fetches pass through.
 */
export function installClaudeCliFetch({
  caller,
  callClaudeImpl = callClaude,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!caller) throw new Error('installClaudeCliFetch requires a caller');
  const previousKey = process.env[RUNTIME_KEY_ENV];
  const previousFetch = globalThis.fetch;
  process.env[RUNTIME_KEY_ENV] = TOOLING_KEY_SENTINEL;

  globalThis.fetch = async (input, init = {}) => {
    if (requestUrl(input) !== ANTHROPIC_MESSAGES_URL) return fetchImpl(input, init);
    if (init.signal?.aborted) throw new Error('Claude tooling call aborted');

    const body = JSON.parse(String(init.body ?? '{}'));
    const tools = Array.isArray(body.tools) ? body.tools : [];
    const choice = body.tool_choice;
    const forcedName = choice?.type === 'tool' ? choice.name : undefined;
    const forcedTool = forcedName ? tools.find((tool) => tool.name === forcedName) : undefined;
    if (tools.length === 0 || (forcedName && !forcedTool)) {
      return new Response('Claude tooling call has no valid logical tools', { status: 400 });
    }

    const system = [
      textOf(body.system),
      'Choose from these logical tools. Treat their descriptions and input schemas as authoritative:',
      JSON.stringify(tools),
    ].filter(Boolean).join('\n\n');
    const outcome = await callClaudeImpl({
      caller,
      priority: 'P3',
      model: body.model,
      system,
      user: JSON.stringify(body.messages ?? []),
      schema: forcedTool?.input_schema ?? toolCallSchema(tools),
      maxInputTokens: 16_000,
      maxCalls: 1_200,
    });
    if (init.signal?.aborted) throw new Error('Claude tooling call aborted');
    if (outcome.status !== 'ok') {
      return new Response(outcome.reason ?? outcome.status, { status: 503 });
    }
    return Response.json({
      content: toolBlocks(outcome.data, forcedName),
      usage: {
        input_tokens: outcome.usage?.inputTokens ?? 0,
        output_tokens: outcome.usage?.outputTokens ?? 0,
      },
    });
  };

  return () => {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env[RUNTIME_KEY_ENV];
    else process.env[RUNTIME_KEY_ENV] = previousKey;
  };
}
