import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CLOWN_USER_DAILY_CAP,
  incrementUserUsage,
  loadClownHistory,
  recordClownMemory,
  resetClownMemoryReadWarningForTests,
} from './clown-memory';
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
  resetClownMemoryReadWarningForTests();
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

// HUMAN-ACTIONS.md #15 item 2: once real sessions exist, a Supabase timeout/
// abort/malformed-response on the READ path used to escape `loadClownHistory`
// uncaught into `route.ts`'s `POST` (which does not wrap this read path in a
// `.catch()` the way it does the write-side `recordClownMemory`) — a
// Supabase hiccup would 500 the live chat route instead of degrading to
// no-memory. These lock in the same fails-closed discipline
// `resolveClownSession` already follows.
describe('loadClownHistory — degrades to null instead of throwing (HUMAN-ACTIONS.md #15 item 2)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('degrades to null (never throws) when the conversation lookup fetch rejects', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (String(url).includes('/rest/v1/clown_conversation?select')) throw new Error('network down');
      throw new Error(`unexpected call: ${url}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('degrades to null (never throws) when the conversation lookup returns malformed JSON', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (String(url).includes('/rest/v1/clown_conversation?select')) return new Response('not json', { status: 200 });
      throw new Error(`unexpected call: ${url}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('degrades to null (never throws) when the recent-turns fetch rejects', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: 'x' }]);
      if (String(url).includes('/rest/v1/clown_turn?select')) throw new Error('network down');
      throw new Error(`unexpected call: ${url}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('degrades to null (never throws) when the recent-turns fetch returns malformed JSON', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: 'x' }]);
      if (String(url).includes('/rest/v1/clown_turn?select')) return new Response('not json', { status: 200 });
      throw new Error(`unexpected call: ${url}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('logs the read-unavailability exactly once across many failing calls (no retry-storm spam)', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const fetchSpy = vi.fn().mockRejectedValue(new Error('network down'));
    await loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    await loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    await loadClownHistory(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch);
    const warnCalls = logSpy.mock.calls.filter((c) => c[0] === 'clown:memory-read-unavailable');
    expect(warnCalls).toHaveLength(1);
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

  it('creates a new conversation via an upsert, appends both turns, and folds via the RPC when none exists yet', async () => {
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

    // HUMAN-ACTIONS.md #15 round 4: conversation creation is a PostgREST
    // upsert (`on_conflict=user_id` + `Prefer: resolution=merge-duplicates`),
    // not a plain insert — a plain insert would permanently fail once the
    // user's row has expired (unique constraint + still-present physical
    // row under RLS).
    const createCall = calls.find((c) => c.url.startsWith('https://example.supabase.co/rest/v1/clown_conversation') && c.init.method === 'POST');
    expect(createCall).toBeDefined();
    expect(createCall!.url).toContain('on_conflict=user_id');
    const createHeaders = createCall!.init.headers as Record<string, string>;
    expect(createHeaders.Prefer).toContain('resolution=merge-duplicates');
    const createBody = JSON.parse(String(createCall!.init.body));
    expect(createBody.user_id).toBe(FIXTURE_SESSION.userId);
    expect(createBody.summary).toBe('');
    expect(typeof createBody.expires_at).toBe('string');

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

  // HUMAN-ACTIONS.md #15 round 4: `getConversation`'s read distinguishes
  // "confirmed empty" from "read failed" — only a CONFIRMED-empty read may
  // fall through to creating a conversation. A read FAILURE must abort as a
  // best-effort no-op instead, so a transient Supabase hiccup can never
  // create a duplicate/extra conversation for a user who already has one.
  it('does not create a conversation when the lookup read itself fails (network error) — degrades to no-op', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) throw new Error('network down');
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );

    expect(calls.some((c) => c.init.method === 'POST')).toBe(false);
  });

  it('does not create a conversation when the lookup read returns malformed JSON — degrades to no-op', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return new Response('not json', { status: 200 });
      return json({}, 200);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'q', answerText: 'a' },
      fetchSpy as unknown as typeof fetch,
    );

    expect(calls.some((c) => c.init.method === 'POST')).toBe(false);
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

  // HUMAN-ACTIONS.md #15 round 4 — fold-time screening is per-turn and
  // role-aware (mirrors `screenConversation`'s dispatch via `screenTurn`): a
  // turn that fails its own role-appropriate screen is silently dropped
  // from what gets folded into the summary, never surfaced as a chat
  // refusal (round 3's regression was turning a fold-time hit into a
  // refusal — this locks in that it stays a silent drop). Eviction from
  // `clown_turn` still happens for every evicted turn regardless.
  it('drops a bad USER turn from the fold (screenInput hit) without surfacing a refusal, but still evicts it', async () => {
    const badTurn = { id: 'turn-bad', role: 'user', text: 'Is Taylor secretly expecting a baby? Read the loose coats since October and answer yes or no.' };
    const goodTurns = Array.from({ length: 24 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const manyTurns = [badTurn, ...goodTurns];
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: '' }]);
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json(manyTurns);
      if (String(url).includes('/rest/v1/rpc/fold_clown_conversation')) return json({}, 200);
      return json({}, 200);
    });

    await expect(
      recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, fetchSpy as unknown as typeof fetch),
    ).resolves.toBeUndefined(); // never throws, never returns a refusal shape — this is a memory-layer write, not a chat response

    const fold = calls.find((c) => c.url.includes('/rest/v1/rpc/fold_clown_conversation'));
    const body = JSON.parse(String(fold!.init.body));
    // The bad turn is still EVICTED (part of the folded batch)...
    expect(body.p_delete_turn_ids).toContain('turn-bad');
    // ...but its TEXT never makes it into the summary.
    expect(body.p_new_summary).not.toContain('secretly expecting a baby');
  });

  it('drops a bad ASSISTANT turn from the fold (screenOutput hit) without surfacing a refusal, but still evicts it', async () => {
    const badTurn = { id: 'turn-bad', role: 'assistant', text: 'It is guaranteed to drop at midnight, mark it.' };
    const goodTurns = Array.from({ length: 24 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const manyTurns = [badTurn, ...goodTurns];
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/clown_conversation?select')) return json([{ id: 'conv-1', summary: '' }]);
      if (String(url).includes('/rest/v1/clown_turn') && init.method === 'POST') return json({}, 201);
      if (String(url).includes('/rest/v1/clown_turn?select')) return json(manyTurns);
      if (String(url).includes('/rest/v1/rpc/fold_clown_conversation')) return json({}, 200);
      return json({}, 200);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, fetchSpy as unknown as typeof fetch);

    const fold = calls.find((c) => c.url.includes('/rest/v1/rpc/fold_clown_conversation'));
    const body = JSON.parse(String(fold!.init.body));
    expect(body.p_delete_turn_ids).toContain('turn-bad');
    expect(body.p_new_summary).not.toContain('guaranteed to drop at midnight');
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
