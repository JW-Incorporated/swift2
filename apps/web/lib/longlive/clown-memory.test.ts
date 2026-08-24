import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLOWN_USER_DAILY_CAP, incrementUserUsage, loadClownHistory, recordClownMemory } from './clown-memory';
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

describe('incrementUserUsage — toggle OFF (no Supabase env / auth unavailable)', () => {
  it('fails open (true) and never calls the cap RPC', async () => {
    const fetchSpy = vi.fn();
    const result = await incrementUserUsage(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('incrementUserUsage — toggle ON (mocked anonymous auth success)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('reports within-cap when the RPC count is under the cap', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(json(5));
    const result = await incrementUserUsage(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result).toBe(true);
    const rpcCall = fetchSpy.mock.calls[0];
    expect(rpcCall[0]).toBe('https://example.supabase.co/rest/v1/rpc/increment_usage_daily');
    expect(JSON.parse(rpcCall[1].body)).toEqual({ p_scope: 'clown-chat:user-1' });
  });

  it('reports over-cap when the RPC count exceeds the daily cap', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(json(CLOWN_USER_DAILY_CAP + 1));
    const result = await incrementUserUsage(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result).toBe(false);
  });

  it('fails open (true) when the RPC call itself fails', async () => {
    const fetchSpy = vi.fn().mockRejectedValueOnce(new Error('rpc down'));
    const result = await incrementUserUsage(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result).toBe(true);
  });
});

describe('loadClownHistory — toggle OFF / no session', () => {
  it('returns null and never fires a network call when session is null', async () => {
    const fetchSpy = vi.fn();
    const result = await loadClownHistory(null, fetchSpy as unknown as typeof fetch);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null when Supabase env is not configured', async () => {
    const fetchSpy = vi.fn();
    const result = await loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('loadClownHistory — toggle ON, a resolved session', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('returns null when no conversation exists yet — never creates one', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([]);
      throw new Error(`unexpected call: ${url}`);
    });
    const result = await loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result).toBeNull();
    const postCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).endsWith('/rest/v1/clown_conversation'));
    expect(postCalls).toHaveLength(0);
  });

  it('returns the rolling summary plus recent turns in chronological order', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (String(url).includes('/rest/v1/clown_conversation?select')) {
        return json([{ id: 'conv-1', summary: 'earlier folded turns' }]);
      }
      if (String(url).includes('/rest/v1/clown_turn?select')) {
        // wire order is DESC (most recent first)
        return json([
          { role: 'assistant', text: 'a2' },
          { role: 'user', text: 'q2' },
          { role: 'assistant', text: 'a1' },
          { role: 'user', text: 'q1' },
        ]);
      }
      throw new Error(`unexpected call: ${url}`);
    });
    const result = await loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    expect(result?.summary).toBe('earlier folded turns');
    expect(result?.turns).toEqual([
      { role: 'user', text: 'q1' },
      { role: 'assistant', text: 'a1' },
      { role: 'user', text: 'q2' },
      { role: 'assistant', text: 'a2' },
    ]);
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

  it('creates a new conversation, appends both turns, and folds via the RPC when none exists yet', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([]);
      if (String(url).includes('/rest/v1/clown_conversation') && init.method === 'POST') {
        return json([{ id: 'conv-1' }], 201);
      }
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json([]);
      if (String(url).includes('/rest/v1/rpc/fold_clown_conversation')) return json({}, 200);
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

    const fold = calls.find((c) => c.url.includes('/rest/v1/rpc/fold_clown_conversation'));
    expect(fold).toBeDefined();
    expect(JSON.parse(String(fold!.init.body))).toEqual({
      p_conversation_id: 'conv-1',
      p_delete_turn_ids: [],
      p_new_summary: null,
    });
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
      if (String(url).includes('/rest/v1/rpc/fold_clown_conversation')) return json({}, 200);
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

  it('folds turns past the retention window into summary and deletes the evicted rows, in ONE RPC call', async () => {
    const manyTurns = Array.from({ length: 25 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: '' }]);
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json(manyTurns);
      if (String(url).includes('/rest/v1/rpc/fold_clown_conversation')) return json({}, 200);
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );

    // Exactly one call folds the conversation — no separate DELETE + PATCH.
    const foldCalls = calls.filter((c) => c.url.includes('/rest/v1/rpc/fold_clown_conversation'));
    expect(foldCalls).toHaveLength(1);
    const deleteCalls = calls.filter((c) => c.init.method === 'DELETE');
    const patchCalls = calls.filter((c) => c.init.method === 'PATCH');
    expect(deleteCalls).toHaveLength(0);
    expect(patchCalls).toHaveLength(0);

    const body = JSON.parse(String(foldCalls[0].init.body));
    expect(body.p_conversation_id).toBe('conv-1');
    expect(body.p_delete_turn_ids).toHaveLength(5); // 25 turns, KEEP_RECENT_TURNS=20 → 5 evicted
    expect(body.p_delete_turn_ids).toEqual(['turn-0', 'turn-1', 'turn-2', 'turn-3', 'turn-4']);
    expect(typeof body.p_new_summary).toBe('string');
    expect(body.p_new_summary.length).toBeGreaterThan(0);
  });

  it('does not silently continue when the fold RPC fails — logs the failure, no partial writes attempted', async () => {
    const manyTurns = Array.from({ length: 25 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const logSpy = vi.spyOn(console, 'log');
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: '' }]);
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json(manyTurns);
      if (String(url).includes('/rest/v1/rpc/fold_clown_conversation')) return json({ message: 'db error' }, 500);
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );

    // The RPC itself is the ONLY write attempted for the fold — no separate
    // delete/patch fallback that could half-apply once the RPC 500s.
    const foldCalls = calls.filter((c) => c.url.includes('/rest/v1/rpc/fold_clown_conversation'));
    expect(foldCalls).toHaveLength(1);
    expect(calls.some((c) => c.init.method === 'DELETE')).toBe(false);
    expect(logSpy).toHaveBeenCalledWith('clown:memory-fold-failed', expect.stringContaining('conv-1'));
  });

  it('bails without attempting the fold when listing turns fails, rather than folding blind', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: '' }]);
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json({ message: 'down' }, 500);
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );

    expect(calls.some((c) => c.url.includes('/rest/v1/rpc/fold_clown_conversation'))).toBe(false);
    expect(logSpy).toHaveBeenCalledWith('clown:memory-fold-list-failed', expect.stringContaining('conv-1'));
  });
});
