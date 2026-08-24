import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLOWN_USER_DAILY_CAP, recordClownMemory, reserveUserDailyBudget } from './clown-memory';
import { resetClownSessionWarningForTests } from './clown-session';
import type { ClownSession } from './clown-session';

const FIXTURE_SESSION: ClownSession = { userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' };

function json(body: unknown, status = 200): Response {
  if (status === 204) return new Response(null, { status });
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  resetClownSessionWarningForTests();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('reserveUserDailyBudget — toggle OFF (no Supabase env / auth unavailable)', () => {
  it('returns ok:true, session:null, and never calls the cap RPC', async () => {
    const fetchSpy = vi.fn();
    const result = await reserveUserDailyBudget(null, fetchSpy as unknown as typeof fetch);
    expect(result).toEqual({ ok: true, session: null });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('reserveUserDailyBudget — toggle ON (mocked anonymous auth success)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('resolves a session and reports within-cap when the RPC count is under the cap', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: 'access-1', refresh_token: 'refresh-1', user: { id: 'user-1' } }))
      .mockResolvedValueOnce(json(5));
    const result = await reserveUserDailyBudget(null, fetchSpy as unknown as typeof fetch);
    expect(result.ok).toBe(true);
    expect(result.session?.userId).toBe('user-1');
    const rpcCall = fetchSpy.mock.calls[1];
    expect(rpcCall[0]).toBe('https://example.supabase.co/rest/v1/rpc/increment_usage_daily');
    expect(JSON.parse(rpcCall[1].body)).toEqual({ p_scope: 'clown-chat:user-1' });
  });

  it('reports over-cap when the RPC count exceeds the daily cap', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: 'access-1', refresh_token: 'refresh-1', user: { id: 'user-1' } }))
      .mockResolvedValueOnce(json(CLOWN_USER_DAILY_CAP + 1));
    const result = await reserveUserDailyBudget(null, fetchSpy as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.session).not.toBeNull();
  });

  it('fails open (ok:true) when the RPC call itself fails', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: 'access-1', refresh_token: 'refresh-1', user: { id: 'user-1' } }))
      .mockRejectedValueOnce(new Error('rpc down'));
    const result = await reserveUserDailyBudget(null, fetchSpy as unknown as typeof fetch);
    expect(result.ok).toBe(true);
  });
});

describe('recordClownMemory — no-ops when session is null', () => {
  it('never fires a network call', async () => {
    const fetchSpy = vi.fn();
    await recordClownMemory(
      { session: null, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('recordClownMemory — toggle ON, a resolved session', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('creates a new conversation, appends both turns, and bumps last_active_at when none exists yet', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([]);
      if (String(url).includes('/rest/v1/clown_conversation') && init.method === 'POST') {
        return json([{ id: 'conv-1' }], 201);
      }
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json([]);
      if (String(url).includes('/rest/v1/clown_conversation?id=eq.') && init.method === 'PATCH') return json({}, 204);
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'is this an egg', answerText: 'yes, ride or die' },
      fetchSpy as unknown as typeof fetch,
    );

    const turnPosts = calls.filter((c) => c.url.includes('/rest/v1/clown_turn') && c.init.method === 'POST');
    expect(turnPosts).toHaveLength(2);
    expect(JSON.parse(String(turnPosts[0].init.body)).role).toBe('user');
    expect(JSON.parse(String(turnPosts[1].init.body)).role).toBe('assistant');

    const patch = calls.find((c) => c.url.includes('/rest/v1/clown_conversation?id=eq.conv-1'));
    expect(patch).toBeDefined();
  });

  it('continues the most recent existing conversation instead of creating a new one', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) {
        return json([{ id: 'conv-existing', summary: 'earlier folded turns' }]);
      }
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json([]);
      if (init.method === 'PATCH') return json({}, 204);
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q2', answerText: 'a2' },
      fetchSpy as unknown as typeof fetch,
    );

    const conversationPosts = calls.filter((c) => c.url === 'https://example.supabase.co/rest/v1/clown_conversation' && c.init.method === 'POST');
    expect(conversationPosts).toHaveLength(0);
    const turnPosts = calls.filter((c) => c.url.includes('/rest/v1/clown_turn') && c.init.method === 'POST');
    expect(turnPosts.every((c) => JSON.parse(String(c.init.body)).conversation_id === 'conv-existing')).toBe(true);
  });

  it('folds turns past the retention window into summary and deletes the evicted rows', async () => {
    const manyTurns = Array.from({ length: 25 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: '' }]);
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json(manyTurns);
      if (String(url).includes('/rest/v1/clown_turn?id=in.') && init.method === 'DELETE') return json({}, 204);
      if (init.method === 'PATCH') return json({}, 204);
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );

    const deleteCall = calls.find((c) => c.url.includes('/rest/v1/clown_turn?id=in.') && c.init.method === 'DELETE');
    expect(deleteCall).toBeDefined();
    const patchCall = calls.find((c) => c.url.includes('/rest/v1/clown_conversation?id=eq.conv-1') && c.init.method === 'PATCH');
    expect(patchCall).toBeDefined();
    const patchBody = JSON.parse(String(patchCall!.init.body));
    expect(typeof patchBody.summary).toBe('string');
    expect(patchBody.summary.length).toBeGreaterThan(0);
  });
});
