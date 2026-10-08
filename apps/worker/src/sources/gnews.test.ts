import { describe, expect, it, vi } from 'vitest';
import { fetchGnewsQuery, gnewsAdapter, GNEWS_DAILY_CAP } from './gnews';
import { UsageStore, type UsageDb } from '../classify/usage-store';
import type { NewsSourceRow } from './types';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

function fakeUsageDb(initialCount = 0): UsageDb {
  let count = initialCount;
  return {
    async todaysCallCount() {
      return count;
    },
    async incrementToday() {
      count++;
    },
  };
}

const BILLBOARD_ARTICLE = {
  title: 'Taylor Swift breaks another record',
  description: 'A short description of the story.',
  url: 'https://www.billboard.com/music/pop/taylor-swift-record-story/',
  publishedAt: '2026-08-24T00:00:00Z',
  source: { name: 'Billboard', url: 'https://www.billboard.com' },
};

const UNKNOWN_DOMAIN_ARTICLE = {
  title: 'A story from a site not in the tier map',
  description: 'desc',
  url: 'https://some-random-blog.example.com/post',
  source: { name: 'Random Blog' },
};

describe('fetchGnewsQuery', () => {
  it('re-tiers to established for a known outlet domain via the shared tier map', async () => {
    const usage = await UsageStore.create(fakeUsageDb(), 100);
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ articles: [BILLBOARD_ARTICLE] }));
    const items = await fetchGnewsQuery('taylor swift', 'test-key', usage, fetchImpl);
    expect(items).toHaveLength(1);
    expect((items[0] as { resolvedTier?: string }).resolvedTier).toBe('established');
    expect(items[0]!.publisher).toBe('Billboard');
  });

  it('stays unverified for a domain not in the tier map', async () => {
    const usage = await UsageStore.create(fakeUsageDb(), 100);
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ articles: [UNKNOWN_DOMAIN_ARTICLE] }));
    const items = await fetchGnewsQuery('taylor swift', 'test-key', usage, fetchImpl);
    expect((items[0] as { resolvedTier?: string }).resolvedTier).toBe('unverified');
  });

  it('THE CAP: reserve() false skips the network call entirely once the daily cap is hit', async () => {
    const usage = await UsageStore.create(fakeUsageDb(), 2); // tiny cap for the test
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ articles: [BILLBOARD_ARTICLE] }));

    await fetchGnewsQuery('q1', 'test-key', usage, fetchImpl);
    await fetchGnewsQuery('q2', 'test-key', usage, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(2); // cap = 2, both allowed

    const thirdResult = await fetchGnewsQuery('q3', 'test-key', usage, fetchImpl);
    expect(thirdResult).toEqual([]); // cap reached — no third call
    expect(fetchImpl).toHaveBeenCalledTimes(2); // still 2 — fetch was never invoked a third time
  });

  it('the cap holds cumulatively across separate UsageStore instances backed by the same db (cross-run)', async () => {
    const db = fakeUsageDb();
    const cap = GNEWS_DAILY_CAP;
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ articles: [] }));

    // Simulate this run using up most of the daily budget.
    for (let i = 0; i < cap - 1; i++) {
      const usage = await UsageStore.create(db, cap);
      await fetchGnewsQuery(`q${i}`, 'test-key', usage, fetchImpl);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(cap - 1);

    // A fresh run (new UsageStore, same db) — only 1 call of budget left.
    const nextRunUsage = await UsageStore.create(db, cap);
    await fetchGnewsQuery('one more', 'test-key', nextRunUsage, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(cap);

    const overCapUsage = await UsageStore.create(db, cap);
    const blocked = await fetchGnewsQuery('over cap', 'test-key', overCapUsage, fetchImpl);
    expect(blocked).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(cap); // never reached cap+1
  });

  it('throws on a non-2xx response so run-cycle can log+isolate it', async () => {
    const usage = await UsageStore.create(fakeUsageDb(), 100);
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({}, false, 400));
    await expect(fetchGnewsQuery('taylor swift', 'bad-key', usage, fetchImpl)).rejects.toThrow(/400/);
  });
});

describe('gnewsAdapter', () => {
  it('returns empty (no throw, no DB touched) when GNEWS_API_KEY is not configured', async () => {
    vi.stubEnv('GNEWS_API_KEY', '');
    const source: NewsSourceRow = { id: '1', name: 'GNews search', sourceType: 'gnews', config: { query: 'taylor swift' } };
    await expect(gnewsAdapter.fetch(source)).resolves.toEqual([]);
    vi.unstubAllEnvs();
  });

  it('throws a descriptive error when config.query is missing', async () => {
    vi.stubEnv('GNEWS_API_KEY', 'test-key');
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
    const source: NewsSourceRow = { id: '1', name: 'GNews search', sourceType: 'gnews', config: {} };
    await expect(gnewsAdapter.fetch(source)).rejects.toThrow(/config\.query/);
    vi.unstubAllEnvs();
  });
});
