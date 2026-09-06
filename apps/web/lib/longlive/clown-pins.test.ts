import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClownSession } from './clown-session';

const FIXTURE_SESSION: ClownSession = { userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' };

interface Call {
  method: string;
  args: unknown[];
}

/**
 * Minimal fake Supabase client (Fable 5.1 architecture review, task R14 —
 * every call site now goes through `@supabase/supabase-js` instead of raw
 * `fetch()`). Every chained call is recorded and returns the same builder;
 * awaiting it resolves via `resolver(table, calls)`.
 */
function makeDb(resolver: (table: string, calls: Call[]) => { data?: unknown; error?: unknown }) {
  function builderFor(table: string) {
    const calls: Call[] = [];
    const builder: Record<string, unknown> = {};
    const chainMethods = ['select', 'eq', 'upsert', 'delete', 'abortSignal'];
    for (const m of chainMethods) {
      builder[m] = (...args: unknown[]) => {
        calls.push({ method: m, args });
        return builder;
      };
    }
    builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resolver(table, calls)).then(resolve, reject);
    return builder;
  }
  return {
    from(table: string) {
      return builderFor(table);
    },
  } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

const mockCreateClownDbClient = vi.fn();

vi.mock('./clown-session', async () => {
  const actual = await vi.importActual<typeof import('./clown-session')>('./clown-session');
  return { ...actual, createClownDbClient: (...args: unknown[]) => mockCreateClownDbClient(...args) };
});

import { listPinnedTheories, pinTheory, unpinTheory } from './clown-pins';

beforeEach(() => {
  mockCreateClownDbClient.mockReset();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('clown-pins — session null (auth unavailable)', () => {
  it('pinTheory/unpinTheory no-op, listPinnedTheories returns [] — db is never built', async () => {
    await pinTheory(null, 'theory-1');
    await unpinTheory(null, 'theory-1');
    await expect(listPinnedTheories(null)).resolves.toEqual([]);
    expect(mockCreateClownDbClient).not.toHaveBeenCalled();
  });
});

describe('clown-pins — db unavailable (env not configured) even with a session', () => {
  it('pinTheory/unpinTheory no-op, listPinnedTheories returns []', async () => {
    mockCreateClownDbClient.mockReturnValue(null);
    await pinTheory(FIXTURE_SESSION, 'theory-1');
    await unpinTheory(FIXTURE_SESSION, 'theory-1');
    await expect(listPinnedTheories(FIXTURE_SESSION)).resolves.toEqual([]);
  });
});

describe('clown-pins — a resolved session and db', () => {
  it('pinTheory upserts the user-scoped row with ignoreDuplicates (equivalent to Prefer: resolution=ignore-duplicates)', async () => {
    let captured: Call[] = [];
    const db = makeDb((table, calls) => {
      captured = calls;
      expect(table).toBe('clown_pinned_theory');
      return { data: null, error: null };
    });
    mockCreateClownDbClient.mockReturnValue(db);

    await pinTheory(FIXTURE_SESSION, 'theory-1');

    const upsertCall = captured.find((c) => c.method === 'upsert');
    expect(upsertCall).toBeDefined();
    const [body, opts] = upsertCall!.args as [Record<string, unknown>, { onConflict: string; ignoreDuplicates: boolean }];
    expect(body).toEqual({ user_id: 'user-1', live_theory_id: 'theory-1' });
    expect(opts.onConflict).toBe('user_id,live_theory_id');
    expect(opts.ignoreDuplicates).toBe(true);
  });

  it('unpinTheory DELETEs scoped to user + theory', async () => {
    let captured: Call[] = [];
    const db = makeDb((table, calls) => {
      captured = calls;
      expect(table).toBe('clown_pinned_theory');
      return { data: null, error: null };
    });
    mockCreateClownDbClient.mockReturnValue(db);

    await unpinTheory(FIXTURE_SESSION, 'theory-1');

    expect(captured.some((c) => c.method === 'delete')).toBe(true);
    const eqCalls = captured.filter((c) => c.method === 'eq');
    expect(eqCalls[0].args).toEqual(['user_id', 'user-1']);
    expect(eqCalls[1].args).toEqual(['live_theory_id', 'theory-1']);
  });

  it('listPinnedTheories returns the ids on success', async () => {
    const db = makeDb((table) => {
      expect(table).toBe('clown_pinned_theory');
      return { data: [{ live_theory_id: 'a' }, { live_theory_id: 'b' }], error: null };
    });
    mockCreateClownDbClient.mockReturnValue(db);

    await expect(listPinnedTheories(FIXTURE_SESSION)).resolves.toEqual(['a', 'b']);
  });

  it('listPinnedTheories degrades to [] on a failed read', async () => {
    const db = makeDb(() => ({ data: null, error: { message: 'down' } }));
    mockCreateClownDbClient.mockReturnValue(db);

    await expect(listPinnedTheories(FIXTURE_SESSION)).resolves.toEqual([]);
  });
});
