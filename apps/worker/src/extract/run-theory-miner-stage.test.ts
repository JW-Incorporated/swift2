import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runTheoryMinerStage, type CrawlArtifact } from './run-theory-miner-stage';

const mocks = vi.hoisted(() => ({ callWorkerClaude: vi.fn() }));
vi.mock('../claude-call', () => ({
  callWorkerClaude: mocks.callWorkerClaude,
  hasClaudeSubscriptionToken: () => Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN),
}));

function chain(result: { data?: unknown; error?: unknown }) {
  const value: Record<string, unknown> = {
    then: (resolve: (resolved: typeof result) => void) => resolve(result),
  };
  for (const method of ['select', 'insert', 'eq', 'maybeSingle', 'update', 'single']) {
    value[method] = () => value;
  }
  return value;
}

function fakeDb(overrides: Record<string, () => unknown> = {}) {
  return {
    from: vi.fn((table: string) => {
      if (overrides[table]) return overrides[table]();
      if (table === 'symbol_lexicon') return chain({ data: [], error: null });
      if (table === 'usage_daily') return chain({ data: null, error: null });
      if (table === 'fan_theory_candidate') {
        const value = chain({ data: null, error: null }) as Record<string, unknown>;
        value.maybeSingle = () => Promise.resolve({ data: null, error: null });
        value.insert = () => chain({ data: { id: 'cand-1' }, error: null });
        return value;
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn(() => chain({ error: null })),
  } as unknown as SupabaseClient;
}

const artifact: CrawlArtifact = {
  subreddits: [{
    subreddit: 'reddit:TaylorSwift',
    posts: [{
      postId: 'p1',
      title: 'countdown theory thread',
      permalink: 'https://www.reddit.com/r/TaylorSwift/comments/p1/x/',
      comments: [{ author: 'hash1', body: 'the countdown clue is real' }],
    }],
  }],
};

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.callWorkerClaude.mockReset();
});

describe('runTheoryMinerStage', () => {
  it('defers every bundle when no subscription token is set', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const result = await runTheoryMinerStage(fakeDb(), artifact);
    expect(result).toMatchObject({ bundlesConsidered: 1, deferred: 1, errors: [] });
  });

  it('counts a skip without touching fan_theory_candidate', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    mocks.callWorkerClaude.mockResolvedValue({
      status: 'ok',
      data: { theories: [], skip_reason: 'no_theory', redline_flags: [] },
    });
    const result = await runTheoryMinerStage(fakeDb(), artifact);
    expect(result).toMatchObject({ skipped: 1, theoriesFound: 0 });
  });

  it('upserts a found theory and reports the bare subreddit name', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    mocks.callWorkerClaude.mockResolvedValue({
      status: 'ok',
      data: {
        theories: [{
          name: 'Vault Countdown',
          claim: 'Fans believe the countdown predicts a vault track.',
          theory_key: 'vault-countdown',
          stance: 'believed',
        }],
        redline_flags: [],
      },
    });
    let insertedRow: Record<string, unknown> | undefined;
    const db = fakeDb({
      fan_theory_candidate: () => {
        const value = chain({ data: null, error: null }) as Record<string, unknown>;
        value.maybeSingle = () => Promise.resolve({ data: null, error: null });
        value.insert = (row: Record<string, unknown>) => {
          insertedRow = row;
          return chain({ data: { id: 'cand-1' }, error: null });
        };
        return value;
      },
    });
    const result = await runTheoryMinerStage(db, artifact);
    expect(result).toMatchObject({ theoriesFound: 1, theoriesUpserted: 1 });
    expect(insertedRow?.communities).toEqual(['TaylorSwift']);
  });

  it('counts a screened-out theory separately', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    mocks.callWorkerClaude.mockResolvedValue({
      status: 'ok',
      data: {
        theories: [{
          name: 'Where does she live',
          claim: 'is she pregnant, fans wonder',
          theory_key: 'pregnant-theory',
          stance: 'contested',
        }],
        redline_flags: ['health'],
      },
    });
    const result = await runTheoryMinerStage(fakeDb(), artifact);
    expect(result).toMatchObject({ theoriesScreenedOut: 1, theoriesUpserted: 0 });
  });

  it('logs wrapper failures and continues across bundles', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    mocks.callWorkerClaude.mockResolvedValue({ status: 'invalid', reason: 'schema miss' });
    const first = artifact.subreddits[0]!.posts[0]!;
    const twoPosts: CrawlArtifact = {
      subreddits: [{
        subreddit: 'reddit:TaylorSwift',
        posts: [first, { ...first, postId: 'p2' }],
      }],
    };
    const result = await runTheoryMinerStage(fakeDb(), twoPosts);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('theory-miner failed for post p1');
  });
});
