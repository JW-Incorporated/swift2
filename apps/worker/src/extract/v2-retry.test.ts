import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { emptyResult } from './extract-stage-result';
import { loadPendingStories, recordV2Attempt, V2_RETRY_GAP_MS } from './v2-retry';
import { writerMode } from './v2-stage';

function recordingDb(errorOnOr: { message: string; code?: string } | false = false) {
  const calls: [string, ...unknown[]][] = [];
  const query: Record<string, unknown> = {
    then: (resolve: (value: unknown) => void) => resolve({
      data: [],
      error: errorOnOr && String(calls.filter(([name]) => name === 'select').at(-1)?.[1]).includes('v2_') ? errorOnOr : null,
    }),
  };
  for (const method of ['select', 'not', 'is', 'or', 'order', 'limit']) {
    query[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return query;
    };
  }
  return { db: { from: () => query } as unknown as SupabaseClient, calls };
}

describe('loadPendingStories', () => {
  it('orders oldest first and skips stories attempted within the retry gap in on mode', async () => {
    const now = Date.parse('2026-11-03T12:00:00.000Z');
    const { db, calls } = recordingDb();
    await loadPendingStories(db, 50, true, now);
    const cutoff = new Date(now - V2_RETRY_GAP_MS).toISOString();
    expect(cutoff).toBe('2026-11-03T10:00:00.000Z');
    expect(calls).toContainEqual(['or', `v2_last_attempt_at.is.null,v2_last_attempt_at.lt."${cutoff}"`]);
    expect(calls).toContainEqual(['order', 'first_seen_at', { ascending: true }]);
    expect(calls.find(([name]) => name === 'select')?.[1]).toContain('v2_attempts');
  });

  it('never selects or filters on the v2 columns in off and shadow modes, still oldest first', async () => {
    const { db, calls } = recordingDb();
    await loadPendingStories(db, 50, false);
    expect(calls.some(([name]) => name === 'or')).toBe(false);
    expect(String(calls.find(([name]) => name === 'select')?.[1])).not.toContain('v2_');
    expect(calls).toContainEqual(['order', 'first_seen_at', { ascending: true }]);
  });

  it('falls back to the plain query when the v2 columns do not exist yet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db, calls } = recordingDb({ message: 'column news_story.v2_last_attempt_at does not exist', code: '42703' });
    const loaded = await loadPendingStories(db, 50, true);
    expect(loaded.error).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('v2 retry columns unavailable'));
    expect(String(calls.filter(([name]) => name === 'select').at(-1)?.[1])).not.toContain('v2_');
    warn.mockRestore();
  });
});

describe('loadPendingStories error handling', () => {
  it('falls back on a message that names a v2 column even without a code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db } = recordingDb({ message: 'v2_attempts is not a column' });
    expect((await loadPendingStories(db, 50, true)).error).toBeNull();
    warn.mockRestore();
  });

  it('does not swallow an unrelated error: it is returned and no fallback runs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db, calls } = recordingDb({ message: 'connection reset', code: '08006' });
    const loaded = await loadPendingStories(db, 50, true);
    expect(loaded.error).toEqual({ message: 'connection reset', code: '08006' });
    expect(calls.filter(([name]) => name === 'select')).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

type Step = { data?: unknown; error?: { message: string } | null };

function attemptDb(updates: Step[], reads: Step[] = []) {
  const patches: Record<string, unknown>[] = [];
  const guards: unknown[][] = [];
  const db = {
    from: () => ({
      update: (patch: Record<string, unknown>) => {
        patches.push(patch);
        const step = updates.shift() ?? { data: [], error: null };
        const chain: Record<string, unknown> = {
          eq: (...args: unknown[]) => {
            guards.push(args);
            return chain;
          },
          select: async () => ({ data: step.data ?? [], error: step.error ?? null }),
        };
        return chain;
      },
      select: () => ({
        eq: () => ({ maybeSingle: async () => reads.shift() ?? { data: null, error: null } }),
      }),
    }),
  } as unknown as SupabaseClient;
  return { db, patches, guards };
}

describe('recordV2Attempt', () => {
  const ROW = { data: [{ id: 's1' }] };

  it('increments, stamps v2_last_attempt_at and guards on the previous count without marking extracted', async () => {
    const { db, patches, guards } = attemptDb([ROW]);
    const result = emptyResult();
    const outcome = await recordV2Attempt(db, result, 's1', 1, 'deferred');
    expect(outcome).toEqual({ attempts: 2, gaveUp: false, reason: 'deferred' });
    expect(patches[0]).toMatchObject({ v2_attempts: 2, v2_last_attempt_at: expect.any(String) });
    expect(patches[0]).not.toHaveProperty('extracted_at');
    expect(guards).toEqual([['id', 's1'], ['v2_attempts', 1]]);
    expect(result.v2GaveUp).toBe(0);
  });

  it('treats a missing previous count as 0', async () => {
    const { db, guards } = attemptDb([ROW]);
    await recordV2Attempt(db, emptyResult(), 's1', undefined, 'missing_facts');
    expect(guards).toContainEqual(['v2_attempts', 0]);
  });

  it('gives up at the third attempt: sets extracted_at, counts v2GaveUp and returns the reason', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db, patches } = attemptDb([ROW]);
    const result = emptyResult();
    const outcome = await recordV2Attempt(db, result, 's1', 2, 'missing_facts');
    expect(outcome).toEqual({ attempts: 3, gaveUp: true, reason: 'missing_facts' });
    expect(patches[0]).toMatchObject({ v2_attempts: 3, extracted_at: expect.any(String), v2_last_attempt_at: expect.any(String) });
    expect(result.v2GaveUp).toBe(1);
    expect(result.v2GaveUpReasons).toEqual({ missing_facts: 1 });
    warn.mockRestore();
  });

  it('re-reads once and retries once when the guard matches no row', async () => {
    const { db, patches, guards } = attemptDb([{ data: [] }, ROW], [{ data: { v2_attempts: 2, extracted_at: null }, error: null }]);
    const outcome = await recordV2Attempt(db, emptyResult(), 's1', 1, 'deferred');
    expect(outcome).toMatchObject({ attempts: 3, gaveUp: true });
    expect(patches.map((patch) => patch.v2_attempts)).toEqual([2, 3]);
    expect(guards.filter(([column]) => column === 'v2_attempts')).toEqual([['v2_attempts', 1], ['v2_attempts', 2]]);
  });

  it('gives up quietly after one retry still matches no row, and does not count a give-up', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db, patches } = attemptDb([{ data: [] }, { data: [] }], [{ data: { v2_attempts: 2, extracted_at: null }, error: null }]);
    const result = emptyResult();
    expect(await recordV2Attempt(db, result, 's1', 1, 'deferred')).toBeUndefined();
    expect(patches).toHaveLength(2);
    expect(result.v2GaveUp).toBe(0);
    warn.mockRestore();
  });

  it('does not retry when the re-read shows the story was already extracted', async () => {
    const { db, patches } = attemptDb([{ data: [] }], [{ data: { v2_attempts: 3, extracted_at: '2026-11-03T00:00:00Z' }, error: null }]);
    expect(await recordV2Attempt(db, emptyResult(), 's1', 1, 'deferred')).toBeUndefined();
    expect(patches).toHaveLength(1);
  });

  it('warns and records nothing on an update error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db } = attemptDb([{ error: { message: 'boom' } }]);
    const result = emptyResult();
    expect(await recordV2Attempt(db, result, 's1', 2, 'deferred')).toBeUndefined();
    expect(result.v2GaveUp).toBe(0);
    warn.mockRestore();
  });
});

describe('writerMode', () => {
  it('defaults to off and only recognises on and shadow', () => {
    expect(writerMode({})).toBe('off');
    expect(writerMode({ NEWS_WRITER_V2: 'typo' })).toBe('off');
    expect(writerMode({ NEWS_WRITER_V2: 'ON' })).toBe('on');
    expect(writerMode({ NEWS_WRITER_V2: 'shadow' })).toBe('shadow');
  });
});
