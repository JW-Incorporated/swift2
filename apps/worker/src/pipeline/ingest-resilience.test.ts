import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runIngestStage } from './ingest-stage';
import { withRetry } from '../sources/retry';

const recent = new Date(Date.now() - 3_600_000).toISOString();
const old = new Date(Date.now() - 72 * 3_600_000).toISOString();

function fakeDb(
  sources: unknown[],
  upsertError: { message: string } | null = null,
  updateLog: Array<Record<string, unknown>> = [],
) {
  return {
    from: (table: string) =>
      table === 'news_source'
        ? {
            select: () => {
              const q = Promise.resolve({ data: sources, error: null });
              return Object.assign(q, { eq: () => q });
            },
            update: (patch: Record<string, unknown>) => ({
              eq: () => {
                updateLog.push(patch);
                return Promise.resolve({ error: null });
              },
            }),
          }
        : { upsert: () => Promise.resolve({ error: upsertError }) },
  } as unknown as SupabaseClient;
}

const src = (id: string, last_polled_at: string | null = recent, consecutive_failures = 0) => ({
  id,
  name: id,
  source_type: 'rss',
  config: {},
  last_polled_at,
  consecutive_failures,
});
const fresh = () => ({ sourcesPolled: 0, itemsIngested: 0, errors: [] as string[], warnings: [] as string[] });
const item = { externalId: 'e', url: 'https://x.test/a', title: 'Taylor Swift news' };
const adapterFor = (fail: string[]) => () => ({
  fetch: async (s: { id: string }) => {
    if (fail.includes(s.id)) throw new Error('Status code 404');
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

describe('runIngestStage source resilience', () => {
  it('turns a single-source 404 into a warning, not an error', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('yt'), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.sourcesPolled).toBe(1);
  });

  it('escalates to an error at the 3rd consecutive failure for the same source', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('yt', recent, 2), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors.join()).toMatch(/3 consecutive failures/);
    expect(result.warnings).toEqual([]);
  });

  it('does not escalate below the 3-consecutive-failure threshold', async () => {
    const result = fresh();
    await runIngestStage(fakeDb([src('yt', recent, 1), src('ok')]), { adapterFor: adapterFor(['yt']) }, result);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('resets the consecutive-failure counter on a successful fetch', async () => {
    const updateLog: Array<Record<string, unknown>> = [];
    const result = fresh();
    // Source that previously had 2 failures but now succeeds.
    await runIngestStage(
      fakeDb([src('yt', recent, 2), src('ok')], null, updateLog),
      { adapterFor: adapterFor([]) },
      result,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    // The update for 'yt' (first source) should reset consecutive_failures to 0.
    const ytUpdate = updateLog.find((u) => u.consecutive_failures === 0);
    expect(ytUpdate).toBeDefined();
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
    await runIngestStage(fakeDb([src('ok')], { message: 'permission denied' }), { adapterFor: adapterFor([]) }, result);
    expect(result.errors.join()).toMatch(/upsert failed.*permission denied/);
  });
});
