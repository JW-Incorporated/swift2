import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runIngestStage } from './ingest-stage';
import { isUpstreamError, withRetry } from '../sources/retry';

const recent = new Date(Date.now() - 3_600_000).toISOString();
const old = new Date(Date.now() - 72 * 3_600_000).toISOString();

type UpdateEntry = { id: string; patch: Record<string, unknown> };
interface DbOptions {
  upsertError?: { message: string } | null;
  updateLog?: UpdateEntry[];
  trackedSelectError?: { message: string; code?: string } | null;
  updateError?: { message: string } | null;
}

function fakeDb(sources: unknown[], opts: DbOptions = {}) {
  const { upsertError = null, updateLog = [], trackedSelectError = null, updateError = null } = opts;
  return {
    from: (table: string) =>
      table === 'news_source'
        ? {
            select: (columns: string) => {
              const failing = trackedSelectError && columns.includes('consecutive_failures');
              const q = Promise.resolve(
                failing ? { data: null, error: trackedSelectError } : { data: sources, error: null },
              );
              return Object.assign(q, { eq: () => q });
            },
            update: (patch: Record<string, unknown>) => ({
              eq: (_column: string, id: string) => {
                updateLog.push({ id, patch });
                return Promise.resolve({ error: updateError });
              },
            }),
          }
        : { upsert: () => Promise.resolve({ error: upsertError }) },
  } as unknown as SupabaseClient;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const src = (
  id: string,
  last_polled_at: string | null = recent,
  consecutive_failures = 0,
  last_ok_at: string | null = null,
) => ({
  id,
  name: id,
  source_type: 'rss',
  config: {},
  last_polled_at,
  consecutive_failures,
  last_ok_at,
});
const fresh = () => ({ sourcesPolled: 0, itemsIngested: 0, errors: [] as string[], warnings: [] as string[] });
const item = { externalId: 'e', url: 'https://x.test/a', title: 'Taylor Swift news' };
const adapterFor = (fail: string[], message = 'Status code 404') => () => ({
  fetch: async (s: { id: string }) => {
    if (fail.includes(s.id)) throw new Error(message);
    return [item];
  },
});

describe('withRetry', () => {
  it('retries a transient failure then succeeds', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('Status code 404')).mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(fn, { sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('gives up after 2 retries and does not retry non-upstream errors', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const always = vi.fn().mockRejectedValue(new Error('Status code 503'));
    await expect(withRetry(always, { sleep })).rejects.toThrow('503');
    expect(always).toHaveBeenCalledTimes(3);
    const bug = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(withRetry(bug, { sleep })).rejects.toThrow('boom');
    expect(bug).toHaveBeenCalledTimes(1);
  });
});

describe('403 handling', () => {
  it('is not retried by withRetry', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const blocked = vi.fn().mockRejectedValue(new Error('Status code 403'));
    await expect(withRetry(blocked, { sleep })).rejects.toThrow('403');
    expect(blocked).toHaveBeenCalledTimes(1);
    expect(isUpstreamError(new Error('Status code 403'))).toBe(false);
  });
});

describe('runIngestStage source resilience', () => {
  it('turns a single-source 404 into a warning, not an error', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('yt'), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.sourcesPolled).toBe(1);
  });

  it('escalates at the 3rd consecutive failure when there is no recent success', async () => {
    const result = fresh();
    const updateLog: UpdateEntry[] = [];
    await runIngestStage(
      fakeDb([src('yt', recent, 2, hoursAgo(5)), src('ok')], { updateLog }),
      { adapterFor: adapterFor(['yt']) },
      result,
    );
    expect(result.errors.join()).toMatch(/3 consecutive failures/);
    expect(result.warnings).toEqual([]);
    expect(updateLog).toContainEqual({ id: 'yt', patch: { consecutive_failures: 3 } });
  });

  it('escalates on the counter alone when last_ok_at is null', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('yt', recent, 2, null), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors.join()).toMatch(/3 consecutive failures/);
  });

  it('stays a warning at 3 failures when the last success was under 3h ago', async () => {
    const result = fresh();
    await runIngestStage(
      fakeDb([src('yt', recent, 2, hoursAgo(1)), src('ok')]),
      { adapterFor: adapterFor(['yt']) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('does not escalate below the 3-failure threshold even with an old last_ok_at', async () => {
    const result = fresh();
    const updateLog: UpdateEntry[] = [];
    await runIngestStage(
      fakeDb([src('yt', recent, 1, hoursAgo(10)), src('ok')], { updateLog }),
      { adapterFor: adapterFor(['yt']) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(updateLog).toContainEqual({ id: 'yt', patch: { consecutive_failures: 2 } });
  });

  // YouTube's feed server 404s every feed for hours at a time (2026-11-10 it
  // outlasted the 3h/3-cycle escalation and reddened every hourly run); the
  // counter never fails the run for it, only the 48h stale rule does.
  const ytFeed = (last_polled_at: string | null, failures: number, last_ok_at: string | null) => ({
    ...src('yt', last_polled_at, failures, last_ok_at),
    config: { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g' },
  });

  it('never escalates a YouTube feed on the counter alone, but still tracks it', async () => {
    const result = fresh();
    const updateLog: UpdateEntry[] = [];
    await runIngestStage(
      fakeDb([ytFeed(recent, 6, hoursAgo(7)), src('ok')], { updateLog }),
      { adapterFor: adapterFor(['yt']) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(updateLog).toContainEqual({ id: 'yt', patch: { consecutive_failures: 7 } });
  });

  it('still fails the run for a YouTube feed with no success in >48h', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([ytFeed(old, 6, old), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors.join()).toMatch(/no success in >48h/);
  });

  it('still escalates a YouTube feed on a 403 block', async () => {
    const result = fresh();
    await runIngestStage(
      fakeDb([ytFeed(recent, 2, hoursAgo(5)), src('ok')]),
      { adapterFor: adapterFor(['yt'], 'Status code 403') },
      result,
    );
    expect(result.errors.join()).toMatch(/3 consecutive failures/);
  });

  it('still escalates a YouTube feed on a non-upstream error', async () => {
    const result = fresh();
    await runIngestStage(
      fakeDb([ytFeed(recent, 2, hoursAgo(5)), src('ok')]),
      { adapterFor: adapterFor(['yt'], 'TypeError: boom') },
      result,
    );
    expect(result.errors).toHaveLength(1);
  });

  it('classifies a 403 as a source-level upstream failure (warning, not error)', async () => {
    const result = fresh();
    await runIngestStage(
      fakeDb([src('yt'), src('ok')]),
      { adapterFor: adapterFor(['yt'], 'Status code 403') },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('warns when the failure counter update errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = fresh();
    await runIngestStage(
      fakeDb([src('yt'), src('ok')], { updateError: { message: 'write denied' } }),
      { adapterFor: adapterFor(['yt']) },
      result,
    );
    expect(warn.mock.calls.join()).toMatch(/could not record failure count for "yt".*write denied/);
    warn.mockRestore();
  });

  it('resets the consecutive-failure counter on the succeeding source row', async () => {
    const updateLog: UpdateEntry[] = [];
    const result = fresh();
    await runIngestStage(
      fakeDb([src('yt', recent, 2), src('ok')], { updateLog }),
      { adapterFor: adapterFor([]) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    const ytUpdate = updateLog.find((u) => u.id === 'yt');
    expect(ytUpdate?.patch).toMatchObject({ consecutive_failures: 0 });
    expect(ytUpdate?.patch.last_ok_at).toEqual(expect.any(String));
  });

  it('falls back to untracked behavior when the error-state columns are missing', async () => {
    const updateLog: UpdateEntry[] = [];
    const result = fresh();
    await runIngestStage(
      fakeDb([src('yt'), src('ok')], {
        updateLog,
        trackedSelectError: { message: 'column news_source.consecutive_failures does not exist', code: '42703' },
      }),
      { adapterFor: adapterFor(['yt']) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain('error-state columns missing (migration pending)');
    expect(result.warnings).toHaveLength(2);
    expect(result.sourcesPolled).toBe(1);
    expect(updateLog).toHaveLength(1);
    expect(updateLog[0]?.id).toBe('ok');
    expect(Object.keys(updateLog[0]?.patch ?? {})).toEqual(['last_polled_at']);
  });

  it('still fails ingestion on an unrelated select error', async () => {
    const result = fresh();
    const ids = await runIngestStage(
      fakeDb([], { trackedSelectError: { message: 'permission denied for table news_source' } }),
      { adapterFor: adapterFor([]) },
      result,
    );
    expect(ids).toBeNull();
    expect(result.errors.join()).toMatch(/could not load news_source rows/);
  });

  it('errors when more than 50% of sources fail in one cycle', async () => {
    // 3 sources, 2 fail → 2/3 > 50% → real error.
    const result = fresh();
    await runIngestStage(
      fakeDb([src('a'), src('b'), src('c')]),
      { adapterFor: adapterFor(['a', 'b']) },
      result,
    );
    expect(result.errors.join()).toMatch(/2 of 3/);
  });

  it('does not error when fewer than 50% of sources fail', async () => {
    // 4 sources, 1 fails → 1/4 < 50% → warning only, no majority error.
    const result = fresh();
    await runIngestStage(
      fakeDb([src('a'), src('b'), src('c'), src('d')]),
      { adapterFor: adapterFor(['a']) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('errors when every source fails', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('a'), src('b')]), { adapterFor: adapterFor(['a', 'b']) }, result);
    expect(result.errors.join()).toMatch(/all 2 source/);
  });

  it('errors when a failing source has had no success for >48h', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('yt', old), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors.join()).toMatch(/no success in >48h/);
    expect(result.warnings).toEqual([]);
  });

  it('still reports a DB write failure as a real error', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('ok')], { upsertError: { message: 'permission denied' } }), { adapterFor: adapterFor([]) }, result);
    expect(result.errors.join()).toMatch(/upsert failed.*permission denied/);
  });
});
