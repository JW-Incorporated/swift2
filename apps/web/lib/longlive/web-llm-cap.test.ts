import { afterEach, describe, expect, it, vi } from 'vitest';

import { MoodUsage } from './mood-usage';
import { checkGlobalDailyCap, reserveGlobalUsage } from './usage-db-gate';
import { logWebLlmUsage, resolveWebDailyCap } from './web-llm-cap';
import { classifyMood } from './mood-client';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('resolveWebDailyCap', () => {
  it('uses the fallback without an override and the env value with one', () => {
    expect(resolveWebDailyCap(200, {})).toBe(200);
    expect(resolveWebDailyCap(200, { LLM_WEB_DAILY_CAP: '50' })).toBe(50);
  });
  it('ignores junk overrides', () => {
    for (const bad of ['0', '-3', 'abc', '1.5', '']) {
      expect(resolveWebDailyCap(200, { LLM_WEB_DAILY_CAP: bad })).toBe(200);
    }
  });
});

describe('daily cap counter', () => {
  it('increments and refuses at the cap, then resets on the next UTC day', () => {
    let now = Date.parse('2026-10-17T10:00:00Z');
    const usage = new MoodUsage(() => 2, () => now);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.used()).toBe(2);
    expect(usage.reserve()).toBe(false);
    now = Date.parse('2026-10-18T00:00:01Z');
    expect(usage.reserve()).toBe(true);
    expect(usage.used()).toBe(1);
  });

  it('honours the env override live through a function cap', () => {
    const usage = new MoodUsage(() => resolveWebDailyCap(5));
    vi.stubEnv('LLM_WEB_DAILY_CAP', '1');
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
  });

  it('durable gate: a count past the cap denies and gives the local slot back', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    const fetchMock = vi.fn(async () => new Response('3', { status: 200 }));
    expect(await checkGlobalDailyCap('s', 2, fetchMock as unknown as typeof fetch)).toBe(false);
    const usage = new MoodUsage(10);
    expect(await reserveGlobalUsage(usage, 's', 2, fetchMock as unknown as typeof fetch)).toBe(false);
    expect(usage.used()).toBe(0);
  });
});

describe('cap reached means fallback with no model call', () => {
  it('classifyMood returns null (keyword fallback) and never calls the API', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('LLM_WEB_DAILY_CAP', '1');
    const fetchMock = vi.fn(async () => new Response('2', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    const usage = new MoodUsage(() => resolveWebDailyCap(200));
    expect(await classifyMood(usage, 'I feel wistful')).toBeNull();
    const urls = fetchMock.mock.calls.map((c) => String((c as unknown[])[0]));
    expect(urls.some((u) => u.includes('api.anthropic.com'))).toBe(false);
  });
});

describe('logWebLlmUsage', () => {
  it('is a no-op without Supabase env and writes a claude row with it', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    await logWebLlmUsage({ caller: 'web-mood-chat', model: 'm', inputTokens: 1, outputTokens: 2 }, fetchMock as unknown as typeof fetch);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    await logWebLlmUsage({ caller: 'web-clownbot', model: 'm', inputTokens: 1, outputTokens: 2 }, fetchMock as unknown as typeof fetch);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://example.test/rest/v1/llm_usage');
    expect(JSON.parse(String(init.body))).toMatchObject({ caller: 'web-clownbot', provider: 'claude', input_tokens: 1, output_tokens: 2 });
  });
});
