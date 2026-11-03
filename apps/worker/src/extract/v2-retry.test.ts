import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { loadPendingStories, V2_RETRY_GAP_MS } from './v2-retry';
import { writerMode } from './v2-stage';

function recordingDb(errorOnOr = false) {
  const calls: [string, ...unknown[]][] = [];
  const query: Record<string, unknown> = {
    then: (resolve: (value: unknown) => void) => resolve({
      data: [],
      error: errorOnOr && String(calls.filter(([name]) => name === 'select').at(-1)?.[1]).includes('v2_') ? { message: 'column v2_last_attempt_at does not exist' } : null,
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
    expect(calls).toContainEqual(['or', `v2_last_attempt_at.is.null,v2_last_attempt_at.lt.${cutoff}`]);
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
    const { db, calls } = recordingDb(true);
    const loaded = await loadPendingStories(db, 50, true);
    expect(loaded.error).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('v2 retry columns unavailable'));
    expect(String(calls.filter(([name]) => name === 'select').at(-1)?.[1])).not.toContain('v2_');
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
