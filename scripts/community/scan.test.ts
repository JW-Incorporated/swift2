import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  scanEnabled,
  mergeRankedPosts,
  filterUnseenPosts,
  buildContext,
  buildLeadRow,
  fetchKnownThreadIds,
  fetchScanWatchlist,
  insertLeads,
  scanSubreddit,
  runScan,
  DEFAULT_TOP_N,
} from './scan.mjs';

function post(
  id: string,
  rank: number,
  overrides: Record<string, unknown> = {},
): { id: string; title: string; permalink: string; url: string; createdAt: string; rank: number } {
  return {
    id,
    title: `Post ${id}`,
    permalink: `https://www.reddit.com/r/TaylorSwift/comments/${id}/post_${id}/`,
    url: `https://www.reddit.com/r/TaylorSwift/comments/${id}/post_${id}/`,
    createdAt: '2026-09-06T00:00:00.000Z',
    rank,
    ...overrides,
  };
}

describe('scanEnabled', () => {
  it('is disabled by default', () => {
    expect(scanEnabled({})).toBe(false);
  });
  it('is enabled only on an explicit true/1', () => {
    expect(scanEnabled({ COMMUNITY_SCAN_ENABLED: 'true' })).toBe(true);
    expect(scanEnabled({ COMMUNITY_SCAN_ENABLED: '1' })).toBe(true);
    expect(scanEnabled({ COMMUNITY_SCAN_ENABLED: 'false' })).toBe(false);
    expect(scanEnabled({ COMMUNITY_SCAN_ENABLED: 'yes' })).toBe(false);
  });
});

describe('mergeRankedPosts', () => {
  it('dedupes by id, keeping the best (lowest) rank across both feeds', () => {
    const topOfDay = [post('a', 3), post('b', 1)];
    const hot = [post('a', 1), post('c', 2)];
    const merged = mergeRankedPosts(topOfDay, hot);
    expect(merged.map((p: { id: string; rank: number }) => [p.id, p.rank])).toEqual(
      (
        [
          ['a', 1],
          ['c', 2],
          ['b', 1],
        ] as [string, number][]
      ).sort((x, y) => x[1] - y[1]),
    );
  });

  it('drops posts with no id', () => {
    expect(mergeRankedPosts([{ rank: 1 }], [])).toEqual([]);
  });
});

describe('filterUnseenPosts', () => {
  it('drops posts already known (lead or ledger)', () => {
    const posts = [post('a', 1), post('b', 2)];
    expect(filterUnseenPosts(posts, new Set(['a']))).toEqual([post('b', 2)]);
  });
});

describe('buildContext', () => {
  it('never includes comment bodies, only a count sentence', () => {
    expect(buildContext(0, 'TaylorSwift')).toBe(
      'Hot thread in r/TaylorSwift — 0 top comments observed (hot-thread scan, no bodies stored).',
    );
    expect(buildContext(1, 'TaylorSwift')).toContain('1 top comment observed');
  });
});

describe('buildLeadRow', () => {
  it('shapes a hot_thread lead with the schema defaults', () => {
    const row = buildLeadRow({ subreddit: 'TaylorSwift', post: post('abc', 1), commentCount: 5 });
    expect(row).toEqual({
      platform: 'reddit',
      community: 'TaylorSwift',
      kind: 'hot_thread',
      thread_id: 'abc',
      url: post('abc', 1).permalink,
      title: 'Post abc',
      context:
        'Hot thread in r/TaylorSwift — 5 top comments observed (hot-thread scan, no bodies stored).',
      matched_doc_ids: [],
      status: 'new',
      redline_ok: false,
    });
  });
});

// Minimal fake of the Supabase query-builder surface this script uses:
// `.from(table).select(...).eq(...).eq(...)` / `.not(...)` resolving to
// `{ data, error }`, and `.insert(rows)` resolving to `{ error }`.
function fakeSupabase({
  watchlist = [],
  leadThreadIds = [],
  ledgerThreadIds = [],
  insertError = null,
  onInsert = () => {},
}: {
  watchlist?: { id: string; name: string }[];
  leadThreadIds?: string[];
  ledgerThreadIds?: string[];
  insertError?: { code: string } | null;
  onInsert?: (table: string, rows: unknown) => void;
} = {}) {
  function chain(table: string, resolved: { data?: unknown; error?: unknown }) {
    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: () => builder,
      not: () => Promise.resolve(resolved),
      insert: (rows: unknown) => {
        onInsert(table, rows);
        return Promise.resolve({ error: insertError });
      },
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolved).then(resolve),
    };
    return builder;
  }
  return {
    from(table: string) {
      if (table === 'community_watchlist') return chain(table, { data: watchlist });
      if (table === 'engagement_lead') {
        return chain(table, { data: leadThreadIds.map((thread_id) => ({ thread_id })) });
      }
      if (table === 'community_post_ledger') {
        return chain(table, { data: ledgerThreadIds.map((thread_id) => ({ thread_id })) });
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

describe('fetchScanWatchlist', () => {
  it('returns reddit scan rows', async () => {
    const supabase = fakeSupabase({
      watchlist: [{ id: 'reddit:TaylorSwift', name: 'TaylorSwift' }],
    });
    expect(await fetchScanWatchlist(supabase as never)).toEqual([
      { id: 'reddit:TaylorSwift', subreddit: 'TaylorSwift' },
    ]);
  });
});

describe('fetchKnownThreadIds', () => {
  it('unions lead and ledger thread ids', async () => {
    const supabase = fakeSupabase({ leadThreadIds: ['a', 'b'], ledgerThreadIds: ['b', 'c'] });
    const known = await fetchKnownThreadIds(supabase as never);
    expect([...known].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('insertLeads', () => {
  it('no-ops on an empty array', async () => {
    expect(await insertLeads(fakeSupabase() as never, [])).toEqual({ inserted: 0, duplicates: 0 });
  });

  it('inserts the whole batch when there is no collision', async () => {
    const rows = [buildLeadRow({ subreddit: 'TaylorSwift', post: post('a', 1), commentCount: 0 })];
    const result = await insertLeads(fakeSupabase() as never, rows);
    expect(result).toEqual({ inserted: 1, duplicates: 0 });
  });

  it('falls back to per-row insert on a duplicate-key collision, counting duplicates separately', async () => {
    let call = 0;
    const supabase = fakeSupabase({
      insertError: { code: '23505' },
      onInsert: () => {
        call += 1;
      },
    });
    const rows = [
      buildLeadRow({ subreddit: 'TaylorSwift', post: post('a', 1), commentCount: 0 }),
      buildLeadRow({ subreddit: 'TaylorSwift', post: post('b', 2), commentCount: 0 }),
    ];
    const result = await insertLeads(supabase as never, rows);
    // Bulk attempt (1 call) + one per row on fallback (2 calls) = 3.
    expect(call).toBe(3);
    expect(result).toEqual({ inserted: 0, duplicates: 2 });
  });

  it('rethrows a non-duplicate insert error', async () => {
    const supabase = fakeSupabase({ insertError: { code: '42501' } });
    const rows = [buildLeadRow({ subreddit: 'TaylorSwift', post: post('a', 1), commentCount: 0 })];
    await expect(insertLeads(supabase as never, rows)).rejects.toEqual({ code: '42501' });
  });
});

describe('scanSubreddit', () => {
  it('merges top-of-day and hot feeds and caps at topN', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      // topPosts (sort=top&t=day) is requested first, then hot.
      const entries =
        call === 1 ? [post('a', 1), post('b', 2), post('c', 3)] : [post('d', 1), post('a', 2)];
      const atom = entries
        .map(
          (p) =>
            `<entry><id>t3_${p.id}</id><link href="${p.permalink}" /><title>${p.title}</title><updated>${p.createdAt}</updated></entry>`,
        )
        .join('');
      return new Response(`<feed xmlns="http://www.w3.org/2005/Atom">${atom}</feed>`, {
        status: 200,
      });
    });
    const ranked = await scanSubreddit('TaylorSwift', { topN: 2, fetchImpl });
    expect(ranked.length).toBe(2);
    expect(ranked[0].id).toBe('a'); // best rank (1) wins over its rank-2 appearance in hot
  });
});

describe('runScan', () => {
  it('scans the watchlist, dedupes against known threads, and inserts new leads', async () => {
    const insertedRows: unknown[][] = [];
    const supabase = fakeSupabase({
      watchlist: [{ id: 'reddit:TaylorSwift', name: 'TaylorSwift' }],
      leadThreadIds: ['already-known'],
      onInsert: (table, rows) => {
        if (table === 'engagement_lead') insertedRows.push(rows as unknown[]);
      },
    });
    const fetchImpl = vi.fn(async () => {
      const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>t3_new1</id><link href="https://www.reddit.com/r/TaylorSwift/comments/new1/x/" /><title>New</title><updated>2026-09-06T00:00:00.000Z</updated></entry></feed>`;
      return new Response(atom, { status: 200 });
    });
    const fetchComments = vi.fn(async () => ({ comments: [{ id: 't1_1' }], status: 200 }));

    const result = await runScan({
      supabase: supabase as never,
      topN: DEFAULT_TOP_N,
      fetchImpl,
      fetchComments,
    });

    expect(result.subredditsScanned).toBe(1);
    expect(result.totalNewLeads).toBe(1);
    expect(insertedRows[0][0]).toMatchObject({
      thread_id: 'new1',
      platform: 'reddit',
      kind: 'hot_thread',
    });
  });

  it('degrades one subreddit failing without aborting the whole run', async () => {
    const supabase = fakeSupabase({
      watchlist: [
        { id: 'reddit:Broken', name: 'Broken' },
        { id: 'reddit:TaylorSwift', name: 'TaylorSwift' },
      ],
    });
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/r/Broken/')) return new Response('nope', { status: 403 });
      const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>t3_ok</id><link href="https://www.reddit.com/r/TaylorSwift/comments/ok/x/" /><title>OK</title><updated>2026-09-06T00:00:00.000Z</updated></entry></feed>`;
      return new Response(atom, { status: 200 });
    });
    const fetchComments = vi.fn(async () => ({ comments: [], status: 200 }));
    const warn = vi.fn();

    const result = await runScan({ supabase: supabase as never, fetchImpl, fetchComments, warn });

    // A 403 is handled inside scanSubreddit itself (degrades to zero posts,
    // same posture as reddit-rss.mjs) rather than throwing up to runScan, so
    // no warning fires here — the "Broken" subreddit just contributes zero
    // ranked posts and zero new leads without aborting the run.
    expect(warn).not.toHaveBeenCalled();
    expect(result.subredditsScanned).toBe(2);
    expect(
      result.perSubreddit.find((s: { subreddit: string }) => s.subreddit === 'Broken'),
    ).toMatchObject({ scanned: 0, newLeads: 0 });
    expect(
      result.perSubreddit.find((s: { subreddit: string }) => s.subreddit === 'TaylorSwift'),
    ).toMatchObject({ newLeads: 1 });
  });

  it('degrades a per-post comment-fetch failure to a zero count instead of dropping the lead', async () => {
    const insertedRows: unknown[][] = [];
    const supabase = fakeSupabase({
      watchlist: [{ id: 'reddit:TaylorSwift', name: 'TaylorSwift' }],
      onInsert: (table, rows) => {
        if (table === 'engagement_lead') insertedRows.push(rows as unknown[]);
      },
    });
    const fetchImpl = vi.fn(async () => {
      const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>t3_new1</id><link href="https://www.reddit.com/r/TaylorSwift/comments/new1/x/" /><title>New</title><updated>2026-09-06T00:00:00.000Z</updated></entry></feed>`;
      return new Response(atom, { status: 200 });
    });
    const fetchComments = vi.fn(async () => {
      throw new Error('boom');
    });

    const result = await runScan({ supabase: supabase as never, fetchImpl, fetchComments });

    expect(result.totalNewLeads).toBe(1);
    expect((insertedRows[0][0] as { context: string }).context).toContain(
      '0 top comments observed',
    );
  });
});
