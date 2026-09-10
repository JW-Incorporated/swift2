import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runTheoryMinerStage, type CrawlArtifact } from './run-theory-miner-stage';

const ORIGINAL_ENV = process.env.ANTHROPIC_API_KEY;

function chain(result: { data?: unknown; error?: unknown }) {
  const obj: Record<string, unknown> = {
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  for (const method of ['select', 'insert', 'eq', 'maybeSingle', 'update', 'single']) {
    obj[method] = () => obj;
  }
  return obj;
}

function fakeDb(overrides: Record<string, (table: string) => unknown> = {}) {
  return {
    from: vi.fn((table: string) => {
      if (overrides[table]) return overrides[table](table);
      if (table === 'symbol_lexicon') return chain({ data: [], error: null });
      if (table === 'usage_daily') return chain({ data: null, error: null });
      if (table === 'fan_theory_candidate') {
        const c = chain({ data: null, error: null }) as Record<string, unknown>;
        c.maybeSingle = () => Promise.resolve({ data: null, error: null });
        c.insert = () => chain({ data: { id: 'cand-1' }, error: null });
        return c;
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn(() => chain({ error: null })),
  } as unknown as SupabaseClient;
}

function toolUseResponse(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_fan_theories', input }] }),
  };
}

const artifact: CrawlArtifact = {
  subreddits: [
    {
      subreddit: 'reddit:TaylorSwift',
      posts: [
        {
          postId: 'p1',
          title: 'countdown theory thread',
          permalink: 'https://www.reddit.com/r/TaylorSwift/comments/p1/x/',
          comments: [{ author: 'hash1', body: 'the countdown clue is real' }],
        },
      ],
    },
  ],
};

describe('runTheoryMinerStage', () => {
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV;
    vi.unstubAllGlobals();
  });

  it('defers every bundle when no API key is set — not a failure', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const db = fakeDb();
    const result = await runTheoryMinerStage(db, artifact);
    expect(result.bundlesConsidered).toBe(1);
    expect(result.deferred).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it('counts a skip (no theory found) without touching fan_theory_candidate', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          toolUseResponse({ theories: [], skip_reason: 'no_theory', redline_flags: [] }),
        ),
    );
    const db = fakeDb();
    const result = await runTheoryMinerStage(db, artifact);
    expect(result.skipped).toBe(1);
    expect(result.theoriesFound).toBe(0);
  });

  it('upserts a found theory and reports the bare subreddit name as community', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          theories: [
            {
              name: 'Vault Countdown',
              claim: 'Fans believe the countdown predicts a vault track.',
              theory_key: 'vault-countdown',
              stance: 'believed',
            },
          ],
          redline_flags: [],
        }),
      ),
    );
    let insertedRow: Record<string, unknown> | undefined;
    const db = fakeDb({
      fan_theory_candidate: () => {
        const c = chain({ data: null, error: null }) as Record<string, unknown>;
        c.maybeSingle = () => Promise.resolve({ data: null, error: null });
        c.insert = (row: Record<string, unknown>) => {
          insertedRow = row;
          const inserted = chain({ data: { id: 'cand-1' }, error: null });
          return inserted;
        };
        return c;
      },
    });
    const result = await runTheoryMinerStage(db, artifact);
    expect(result.theoriesFound).toBe(1);
    expect(result.theoriesUpserted).toBe(1);
    expect(insertedRow?.communities).toEqual(['TaylorSwift']);
  });

  it('counts a screened-out theory separately from an upserted one', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          theories: [
            {
              name: 'Where does she live',
              claim: 'is she pregnant, fans wonder',
              theory_key: 'pregnant-theory',
              stance: 'contested',
            },
          ],
          redline_flags: ['health'],
        }),
      ),
    );
    const db = fakeDb();
    const result = await runTheoryMinerStage(db, artifact);
    expect(result.theoriesFound).toBe(1);
    expect(result.theoriesScreenedOut).toBe(1);
    expect(result.theoriesUpserted).toBe(0);
  });

  it('one bundle failure is logged and does not abort the rest of the run', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' }),
    );
    const firstPost = artifact.subreddits[0]?.posts[0];
    if (!firstPost) throw new Error('fixture setup error: expected a post in the base artifact');
    const twoPostArtifact: CrawlArtifact = {
      subreddits: [
        {
          subreddit: 'reddit:TaylorSwift',
          posts: [firstPost, { ...firstPost, postId: 'p2' }],
        },
      ],
    };
    const db = fakeDb();
    const result = await runTheoryMinerStage(db, twoPostArtifact);
    expect(result.bundlesConsidered).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('theory-miner failed for post p1');
  });
});
