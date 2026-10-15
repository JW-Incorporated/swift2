import { afterEach, describe, expect, it, vi } from 'vitest';

import { ANTHROPIC_MESSAGES_URL } from './anthropic.mjs';
import { installClaudeCliFetch } from './claude-cli-fetch.mjs';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe('installClaudeCliFetch', () => {
  it('maps a forced runtime tool request through the P3 public wrapper', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'existing-value');
    const callClaude = vi.fn(async () => ({
      status: 'ok',
      data: { stance: 'wrapper answer' },
      usage: { inputTokens: 12, outputTokens: 4 },
    }));
    const passthrough = vi.fn();
    const restore = installClaudeCliFetch({
      caller: 'test-tool',
      callClaudeImpl: callClaude,
      fetchImpl: passthrough,
    });

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        system: [{ type: 'text', text: 'system' }],
        tools: [{ name: 'record_take', input_schema: { type: 'object' } }],
        tool_choice: { type: 'tool', name: 'record_take' },
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });
    const json = await response.json();

    expect(response.ok).toBe(true);
    expect(passthrough).not.toHaveBeenCalled();
    expect(callClaude).toHaveBeenCalledWith(expect.objectContaining({
      caller: 'test-tool',
      priority: 'P3',
      model: 'claude-sonnet-5-5',
      schema: { type: 'object' },
    }));
    expect(json.content).toEqual([expect.objectContaining({
      type: 'tool_use',
      name: 'record_take',
      input: { stance: 'wrapper answer' },
    })]);
    expect(json.usage).toEqual({ input_tokens: 12, output_tokens: 4 });

    restore();
    expect(process.env.ANTHROPIC_API_KEY).toBe('existing-value');
  });

  it('passes unrelated fetches through and restores an absent runtime key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    delete process.env.ANTHROPIC_API_KEY;
    const passthrough = vi.fn(async () => new Response('ok'));
    const restore = installClaudeCliFetch({
      caller: 'test-tool',
      callClaudeImpl: vi.fn(),
      fetchImpl: passthrough,
    });

    const response = await fetch('https://example.test/data');
    expect(await response.text()).toBe('ok');
    expect(passthrough).toHaveBeenCalledTimes(1);

    restore();
    expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('turns wrapper unavailability into the runtime client degraded path', async () => {
    const restore = installClaudeCliFetch({
      caller: 'test-tool',
      callClaudeImpl: vi.fn(async () => ({ status: 'unavailable', reason: 'limit' })),
      fetchImpl: vi.fn(),
    });
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        tools: [{ name: 'record_take', input_schema: { type: 'object' } }],
        tool_choice: { type: 'tool', name: 'record_take' },
        messages: [],
      }),
    });
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('limit');
    restore();
  });
});
