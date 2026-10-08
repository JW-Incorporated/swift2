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

interface Call {
  method: string;
  args: unknown[];
}

/**
 * Minimal fake Supabase client (Fable 5.1 architecture review, task R14 —
 * every call site now goes through `@supabase/supabase-js` instead of raw
 * `fetch()`). `.from(table)`/`.rpc(name, args)` return a chain-recording,
 * thenable builder; every chained call (`.select()`, `.eq()`, `.upsert()`,
 * ...) is recorded and returns the same builder, and awaiting it invokes
 * `resolver(table, calls)` to produce `{ data, error }` — mirrors how the
 * pre-migration tests branched on the raw PostgREST URL/method, just keyed
 * on table name + recorded method calls instead of a URL string. `table` is
 * `'__rpc__'` for `.rpc()` calls.
 */
function makeDb(resolver: (table: string, calls: Call[]) => { data?: unknown; error?: unknown }) {
  function builderFor(table: string, initial: Call[] = []) {
    const calls: Call[] = [...initial];
    const builder: Record<string, unknown> = {};
    const chainMethods = ['select', 'eq', 'order', 'limit', 'abortSignal', 'upsert', 'insert', 'delete'];
    for (const m of chainMethods) {
      builder[m] = (...args: unknown[]) => {
        calls.push({ method: m, args });
        return builder;
      };
    }
    // `.single()` is terminal in supabase-js (resolves the same
    // `{ data, error }` shape, just unwraps the array to one row) — the
    // resolver decides the shape either way, `.single()` is recorded like
    // any other chain call for the resolver's own dispatch logic.
    builder.single = (...args: unknown[]) => {
      calls.push({ method: 'single', args });
      return builder;
    };
    builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
      try {
        return Promise.resolve(resolver(table, calls)).then(resolve, reject);
      } catch (e) {
        return Promise.reject(e).then(resolve, reject);
      }
    };
    return builder;
  }
  return {
    from(table: string) {
      return builderFor(table);
    },
    rpc(name: string, args: unknown) {
      return builderFor('__rpc__', [{ method: 'rpc', args: [name, args] }]);
    },
  } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

function json(body: unknown, status = 200): Response {
  if (status === 204) return new Response(null, { status });
  return new Response(JSON.stringify(body), { status });
}
void json;

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

describe('incrementUserUsage — no db (env not configured / auth unavailable)', () => {
  it('fails open (true) and never calls the cap RPC', async () => {
    const result = await incrementUserUsage(FIXTURE_SESSION, null);
    expect(result).toBe(true);
  });
});

describe('incrementUserUsage — db resolved', () => {
  it('reports within-cap when the RPC count is under the cap', async () => {
    const rpcCalls: Call[] = [];
    const db = makeDb((table, calls) => {
      if (table === '__rpc__') {
        rpcCalls.push(...calls);
        return { data: 5, error: null };
      }
      throw new Error(`unexpected table: ${table}`);
    });
    const result = await incrementUserUsage(FIXTURE_SESSION, db);
    expect(result).toBe(true);
    const rpcCall = rpcCalls.find((c) => c.method === 'rpc');
    expect(rpcCall?.args[0]).toBe('increment_usage_daily');
    expect(rpcCall?.args[1]).toEqual({ p_scope: 'clown-chat:user-1' });
  });

  it('reports over-cap when the RPC count exceeds the daily cap', async () => {
    const db = makeDb(() => ({ data: CLOWN_USER_DAILY_CAP + 1, error: null }));
    const result = await incrementUserUsage(FIXTURE_SESSION, db);
    expect(result).toBe(false);
  });

  it('fails open (true) when the RPC call itself fails', async () => {
    const db = makeDb(() => ({ data: null, error: { message: 'rpc down' } }));
    const result = await incrementUserUsage(FIXTURE_SESSION, db);
    expect(result).toBe(true);
  });

  it('fails open (true) when the RPC call throws', async () => {
    const db = makeDb(() => {
      throw new Error('network down');
    });
    const result = await incrementUserUsage(FIXTURE_SESSION, db);
    expect(result).toBe(true);
  });
});

describe('loadClownHistory — no db / no session', () => {
  it('returns null when session is null', async () => {
    const result = await loadClownHistory(null, null);
    expect(result).toBeNull();
  });

  it('returns null when db is null (Supabase env not configured)', async () => {
    const result = await loadClownHistory(FIXTURE_SESSION, null);
    expect(result).toBeNull();
  });
});

describe('loadClownHistory — db resolved', () => {
  it('returns null when no conversation exists yet — never queries clown_turn', async () => {
    const queried: string[] = [];
    const db = makeDb((table) => {
      queried.push(table);
      if (table === 'clown_conversation') return { data: [], error: null };
      throw new Error(`unexpected table: ${table}`);
    });
    const result = await loadClownHistory(FIXTURE_SESSION, db);
    expect(result).toBeNull();
    expect(queried.filter((t) => t === 'clown_turn')).toHaveLength(0);
  });

  it('returns the rolling summary plus recent turns in chronological order', async () => {
    const db = makeDb((table) => {
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: 'earlier folded turns' }], error: null };
      if (table === 'clown_turn') {
        // wire order is DESC (most recent first)
        return {
          data: [
            { role: 'assistant', text: 'a2' },
            { role: 'user', text: 'q2' },
            { role: 'assistant', text: 'a1' },
            { role: 'user', text: 'q1' },
          ],
          error: null,
        };
      }
      throw new Error(`unexpected table: ${table}`);
    });
    const result = await loadClownHistory(FIXTURE_SESSION, db);
    expect(result?.summary).toBe('earlier folded turns');
    expect(result?.turns).toEqual([
      { role: 'user', text: 'q1' },
      { role: 'assistant', text: 'a1' },
      { role: 'user', text: 'q2' },
      { role: 'assistant', text: 'a2' },
    ]);
  });
});

// HUMAN-ACTIONS.md #15 item 2: a Supabase hiccup on the READ path used to
// escape `loadClownHistory` uncaught into `route.ts`'s `POST` — a Supabase
// hiccup would 500 the live chat route instead of degrading to no-memory.
// These lock in the same fails-closed discipline `resolveClownSession`
// already follows, now against the typed client's own failure modes.
describe('loadClownHistory — degrades to null instead of throwing (HUMAN-ACTIONS.md #15 item 2)', () => {
  it('degrades to null (never throws) when the conversation lookup query rejects', async () => {
    const db = makeDb((table) => {
      if (table === 'clown_conversation') throw new Error('network down');
      throw new Error(`unexpected table: ${table}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, db)).resolves.toBeNull();
  });

  it('degrades to null (never throws) when the conversation lookup returns a non-array body', async () => {
    const db = makeDb((table) => {
      if (table === 'clown_conversation') return { data: {}, error: null };
      throw new Error(`unexpected table: ${table}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, db)).resolves.toBeNull();
  });

  it('degrades to summary + empty turns (never throws) when the recent-turns query errors', async () => {
    const db = makeDb((table) => {
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: 'x' }], error: null };
      if (table === 'clown_turn') return { data: null, error: { message: 'down' } };
      throw new Error(`unexpected table: ${table}`);
    });
    await expect(loadClownHistory(FIXTURE_SESSION, db)).resolves.toEqual({ summary: 'x', turns: [] });
  });

  it('logs the read-unavailability exactly once across many failing calls (no retry-storm spam)', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const db = makeDb((table) => {
      if (table === 'clown_conversation') throw new Error('network down');
      throw new Error(`unexpected table: ${table}`);
    });
    await loadClownHistory(FIXTURE_SESSION, db);
    await loadClownHistory(FIXTURE_SESSION, db);
    await loadClownHistory(FIXTURE_SESSION, db);
    const warnCalls = logSpy.mock.calls.filter((c) => c[0] === 'clown:memory-read-unavailable');
    expect(warnCalls).toHaveLength(1);
  });
});

describe('recordClownMemory — no-ops when session or db is missing', () => {
  it('never fires a query when session is null', async () => {
    const db = makeDb(() => {
      throw new Error('should not be called');
    });
    await recordClownMemory({ session: null, question: 'q', answerText: 'a' }, db);
  });

  it('never fires a query when db is null', async () => {
    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, null);
  });
});

describe('recordClownMemory — db resolved', () => {
  it('creates a new conversation via an upsert, appends both turns, and folds via the RPC when none exists yet', async () => {
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation' && tableCalls.some((c) => c.method === 'upsert')) {
        return { data: { id: 'conv-1' }, error: null };
      }
      if (table === 'clown_conversation') return { data: [], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: [], error: null };
      if (table === '__rpc__') return { data: null, error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory(
      { session: FIXTURE_SESSION, question: 'is this an egg', answerText: 'yes, ride or die' },
      db,
    );

    // HUMAN-ACTIONS.md #15 round 4: conversation creation is an upsert
    // (`onConflict: 'user_id'`), not a plain insert — a plain insert would
    // permanently fail once the user's row has expired (unique constraint
    // + still-present physical row under RLS).
    const upsertCall = calls.find((c) => c.table === 'clown_conversation' && c.calls.some((x) => x.method === 'upsert'));
    expect(upsertCall).toBeDefined();
    const upsertMethodCall = upsertCall!.calls.find((c) => c.method === 'upsert')!;
    const [upsertBody, upsertOpts] = upsertMethodCall.args as [Record<string, unknown>, { onConflict: string }];
    expect(upsertBody.user_id).toBe(FIXTURE_SESSION.userId);
    expect(upsertBody.summary).toBe('');
    expect(typeof upsertBody.expires_at).toBe('string');
    expect(upsertOpts.onConflict).toBe('user_id');

    const turnInsertCall = calls.find((c) => c.table === 'clown_turn' && c.calls.some((x) => x.method === 'insert'));
    expect(turnInsertCall).toBeDefined();
    const insertMethodCall = turnInsertCall!.calls.find((c) => c.method === 'insert')!;
    const turnPair = insertMethodCall.args[0] as Array<{ role: string; conversation_id: string; created_at: string }>;
    expect(turnPair).toHaveLength(2);
    expect(turnPair.map((t) => t.role)).toEqual(['user', 'assistant']);
    expect(turnPair[0].created_at < turnPair[1].created_at).toBe(true);
    expect(turnPair.every((t) => t.conversation_id === 'conv-1')).toBe(true);

    const foldCall = calls.find((c) => c.table === '__rpc__');
    expect(foldCall).toBeDefined();
    const rpcMethodCall = foldCall!.calls.find((c) => c.method === 'rpc')!;
    expect(rpcMethodCall.args[0]).toBe('fold_clown_conversation');
    expect(rpcMethodCall.args[1]).toEqual({
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
  it('does not create a conversation when the lookup read itself fails — degrades to no-op', async () => {
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') throw new Error('network down');
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    expect(calls.some((c) => c.calls.some((x) => x.method === 'upsert' || x.method === 'insert'))).toBe(false);
  });

  it('does not create a conversation when the lookup read returns a non-array body — degrades to no-op', async () => {
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: {}, error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    expect(calls.some((c) => c.calls.some((x) => x.method === 'upsert' || x.method === 'insert'))).toBe(false);
  });

  it('does not create a conversation when the lookup read returns an array of unexpected shape — degrades to no-op', async () => {
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{}], error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    expect(calls.some((c) => c.calls.some((x) => x.method === 'upsert' || x.method === 'insert'))).toBe(false);
  });

  it('continues the most recent existing conversation instead of creating a new one', async () => {
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-existing', summary: 'earlier folded turns' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: [], error: null };
      if (table === '__rpc__') return { data: null, error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q2', answerText: 'a2' }, db);

    expect(calls.some((c) => c.table === 'clown_conversation' && c.calls.some((x) => x.method === 'upsert'))).toBe(false);
    const turnInsertCall = calls.find((c) => c.table === 'clown_turn' && c.calls.some((x) => x.method === 'insert'));
    const turnPair = turnInsertCall!.calls.find((c) => c.method === 'insert')!.args[0] as Array<{ conversation_id: string }>;
    expect(turnPair.every((t) => t.conversation_id === 'conv-existing')).toBe(true);
  });

  it('rejects a failed atomic turn-pair insert and never folds a partial conversation', async () => {
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: '' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) {
        return { data: null, error: { message: 'write failed' } };
      }
      throw new Error(`unexpected table: ${table}`);
    });

    await expect(
      recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db),
    ).rejects.toThrow('clown memory turn insert failed');

    expect(calls.some((c) => c.table === 'clown_turn' && c.calls.some((x) => x.method === 'select'))).toBe(false);
    expect(calls.some((c) => c.table === '__rpc__')).toBe(false);
  });

  it('folds turns past the retention window into summary and deletes the evicted rows, in ONE RPC call', async () => {
    const manyTurns = Array.from({ length: 25 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: '' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: manyTurns, error: null };
      if (table === '__rpc__') return { data: null, error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    const foldCalls = calls.filter((c) => c.table === '__rpc__');
    expect(foldCalls).toHaveLength(1);
    expect(calls.some((c) => c.calls.some((x) => x.method === 'delete'))).toBe(false);

    const body = foldCalls[0].calls.find((c) => c.method === 'rpc')!.args[1] as {
      p_conversation_id: string;
      p_delete_turn_ids: string[];
      p_new_summary: string;
    };
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
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: '' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: manyTurns, error: null };
      if (table === '__rpc__') return { data: null, error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await expect(
      recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db),
    ).resolves.toBeUndefined(); // never throws, never returns a refusal shape — this is a memory-layer write, not a chat response

    const fold = calls.find((c) => c.table === '__rpc__');
    const body = fold!.calls.find((c) => c.method === 'rpc')!.args[1] as { p_delete_turn_ids: string[]; p_new_summary: string };
    // The bad turn is still EVICTED (part of the folded batch)...
    expect(body.p_delete_turn_ids).toContain('turn-bad');
    // ...but its TEXT never makes it into the summary.
    expect(body.p_new_summary).not.toContain('secretly expecting a baby');
  });

  it('drops a bad ASSISTANT turn from the fold (screenOutput hit) without surfacing a refusal, but still evicts it', async () => {
    const badTurn = { id: 'turn-bad', role: 'assistant', text: 'It is guaranteed to drop at midnight, mark it.' };
    const goodTurns = Array.from({ length: 24 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const manyTurns = [badTurn, ...goodTurns];
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: '' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: manyTurns, error: null };
      if (table === '__rpc__') return { data: null, error: null };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    const fold = calls.find((c) => c.table === '__rpc__');
    const body = fold!.calls.find((c) => c.method === 'rpc')!.args[1] as { p_delete_turn_ids: string[]; p_new_summary: string };
    expect(body.p_delete_turn_ids).toContain('turn-bad');
    expect(body.p_new_summary).not.toContain('guaranteed to drop at midnight');
  });

  it('does not silently continue when the fold RPC fails — logs the failure, no partial writes attempted', async () => {
    const manyTurns = Array.from({ length: 25 }, (_, i) => ({ id: `turn-${i}`, role: 'user', text: `msg ${i}` }));
    const logSpy = vi.spyOn(console, 'log');
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: '' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: manyTurns, error: null };
      if (table === '__rpc__') return { data: null, error: { message: 'db error' } };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    // The RPC itself is the ONLY write attempted for the fold — no separate
    // delete/patch fallback that could half-apply once the RPC errors.
    const foldCalls = calls.filter((c) => c.table === '__rpc__');
    expect(foldCalls).toHaveLength(1);
    expect(calls.some((c) => c.calls.some((x) => x.method === 'delete'))).toBe(false);
    expect(logSpy).toHaveBeenCalledWith('clown:memory-fold-failed', expect.stringContaining('conv-1'));
  });

  it('bails without attempting the fold when listing turns fails, rather than folding blind', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const calls: Array<{ table: string; calls: Call[] }> = [];
    const db = makeDb((table, tableCalls) => {
      calls.push({ table, calls: tableCalls });
      if (table === 'clown_conversation') return { data: [{ id: 'conv-1', summary: '' }], error: null };
      if (table === 'clown_turn' && tableCalls.some((c) => c.method === 'insert')) return { data: null, error: null };
      if (table === 'clown_turn') return { data: null, error: { message: 'down' } };
      throw new Error(`unexpected table: ${table}`);
    });

    await recordClownMemory({ session: FIXTURE_SESSION, question: 'q', answerText: 'a' }, db);

    expect(calls.some((c) => c.table === '__rpc__')).toBe(false);
    expect(logSpy).toHaveBeenCalledWith('clown:memory-fold-list-failed', expect.stringContaining('conv-1'));
  });
});
