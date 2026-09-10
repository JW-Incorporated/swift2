import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClownTake } from './clown-client';
import type { ClownSession } from './clown-session';

function fixtureTake(overrides: Partial<ClownTake> = {}): ClownTake {
  return {
    stance: 'a stance',
    argument: 'an argument',
    counterpoint: 'a counterpoint',
    citedIds: ['lore:x'],
    delulu: 2,
    theoryName: 'The Thing',
    aside: 'aside',
    offLimits: false,
    ...overrides,
  };
}

const FIXTURE_SESSION: ClownSession = { userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' };

interface Call {
  method: string;
  args: unknown[];
}

/** Same fake-client shape as `clown-memory.test.ts`/`clown-pins.test.ts` —
 * see either file's header for the full rationale (Fable 5.1 architecture
 * review, task R14). */
function makeDb(resolver: (table: string, calls: Call[]) => { data?: unknown; error?: unknown }) {
  function builderFor(table: string) {
    const calls: Call[] = [];
    const builder: Record<string, unknown> = {};
    const chainMethods = ['insert', 'abortSignal'];
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

import { persistPrediction } from './clown-predictions';

beforeEach(() => {
  mockCreateClownDbClient.mockReset();
  vi.unstubAllEnvs();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('persistPrediction — PLAN.md Stage 11, wired for real', () => {
  it('never builds a db client when session is null (auth unavailable — toggle off)', async () => {
    await persistPrediction({ session: null, question: 'q', take: fixtureTake(), sources: [] });
    expect(mockCreateClownDbClient).not.toHaveBeenCalled();
  });

  it('never fires a query when db is unavailable (env not configured), even with a session', async () => {
    mockCreateClownDbClient.mockReturnValue(null);
    await persistPrediction({ session: FIXTURE_SESSION, question: 'q', take: fixtureTake(), sources: [] });
  });

  it('inserts bot_prediction with the session-scoped user id and pending status when a session resolves', async () => {
    let captured: Call[] = [];
    const db = makeDb((table, calls) => {
      captured = calls;
      expect(table).toBe('bot_prediction');
      return { data: null, error: null };
    });
    mockCreateClownDbClient.mockReturnValue(db);

    await persistPrediction({ session: FIXTURE_SESSION, question: 'what about the eggs', take: fixtureTake(), sources: [] });

    const insertCall = captured.find((c) => c.method === 'insert');
    expect(insertCall).toBeDefined();
    const body = insertCall!.args[0] as Record<string, unknown>;
    expect(body.user_id).toBe('user-1');
    expect(body.status).toBe('pending');
    expect(body.claim).toBe('a stance');
    expect(body.cited_ids).toEqual(['lore:x']);
    expect(body.delulu).toBe(2);
    expect(body.symbols).toEqual([]);
  });

  it('rejects when the insert errors', async () => {
    const db = makeDb(() => ({ data: null, error: { message: 'service unavailable' } }));
    mockCreateClownDbClient.mockReturnValue(db);

    await expect(
      persistPrediction({ session: FIXTURE_SESSION, question: 'q', take: fixtureTake(), sources: [] }),
    ).rejects.toThrow('clown prediction insert failed');
  });
});
