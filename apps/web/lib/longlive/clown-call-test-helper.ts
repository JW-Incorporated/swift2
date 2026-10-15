export async function fakeClownWrapper(input: Record<string, unknown>) {
  const body = input.compatBody as Record<string, unknown>;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) return { status: 'unavailable', reason: `HTTP ${response.status}` };
    const raw = await response.json() as {
      content?: Array<{ type?: string; name?: string; input?: unknown }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const blocks = (raw.content ?? []).filter((block) => block.type === 'tool_use');
    const choice = body.tool_choice as { type?: string; name?: string } | undefined;
    const data = choice?.type === 'tool'
      ? blocks.find((block) => block.name === choice.name)?.input
      : { tool_calls: blocks.map((block) => ({ name: block.name, input: block.input })) };
    if (data === undefined) return { status: 'invalid', reason: 'missing structured output' };
    return {
      status: 'ok',
      data,
      usage: {
        inputTokens: raw.usage?.input_tokens ?? 0,
        outputTokens: raw.usage?.output_tokens ?? 0,
      },
    };
  } catch {
    return { status: 'unavailable', reason: 'fake wrapper failure' };
  }
}
