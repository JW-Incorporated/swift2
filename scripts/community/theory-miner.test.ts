import { describe, expect, it, vi } from 'vitest';
import { parseArgs, runTheoryMiner } from './theory-miner.mjs';

describe('parseArgs', () => {
  it('defaults to the home-reader crawl bundle', () => {
    expect(parseArgs([]).artifact).toBe('.artifacts/home-reddit-crawl.json');
  });

  it('honors --artifact', () => {
    expect(parseArgs(['--artifact', 'custom/path.json']).artifact).toBe('custom/path.json');
  });

  it('honors COMMUNITY_CRAWL_ARTIFACT env when no flag is given', () => {
    const original = process.env.COMMUNITY_CRAWL_ARTIFACT;
    process.env.COMMUNITY_CRAWL_ARTIFACT = 'env/path.json';
    try {
      expect(parseArgs([]).artifact).toBe('env/path.json');
    } finally {
      if (original === undefined) delete process.env.COMMUNITY_CRAWL_ARTIFACT;
      else process.env.COMMUNITY_CRAWL_ARTIFACT = original;
    }
  });

  it('a flag overrides the env var', () => {
    const original = process.env.COMMUNITY_CRAWL_ARTIFACT;
    process.env.COMMUNITY_CRAWL_ARTIFACT = 'env/path.json';
    try {
      expect(parseArgs(['--artifact', 'flag/path.json']).artifact).toBe('flag/path.json');
    } finally {
      if (original === undefined) delete process.env.COMMUNITY_CRAWL_ARTIFACT;
      else process.env.COMMUNITY_CRAWL_ARTIFACT = original;
    }
  });
});

describe('runTheoryMiner', () => {
  it('exits cleanly before initializing the extract stage when the crawl artifact is absent', async () => {
    const createServiceClient = vi.fn();
    const loadStage = vi.fn();

    await expect(
      runTheoryMiner({
        argv: ['--artifact', 'missing-community-crawl.json'],
        exists: () => false,
        createServiceClient,
        loadStage,
      }),
    ).resolves.toBe(0);

    expect(createServiceClient).not.toHaveBeenCalled();
    expect(loadStage).not.toHaveBeenCalled();
  });

  it('loads the extract stage with a present crawl bundle', async () => {
    const runTheoryMinerStage = vi.fn().mockResolvedValue({
      bundlesConsidered: 1,
      theoriesFound: 0,
      theoriesUpserted: 0,
      theoriesScreenedOut: 0,
      skipped: 0,
      deferred: 1,
      errors: [],
    });
    const db = { from: vi.fn() };
    const shouldMine = vi.fn();
    const stats = vi.fn(() => ({ calls: 1, capped: 0, cap: 40 }));
    const claude = vi.fn();

    await expect(
      runTheoryMiner({
        argv: ['--artifact', 'community-crawl.json'],
        exists: () => true,
        readFile: () =>
          JSON.stringify({
            subreddits: [
              {
                subreddit: 'reddit:TaylorSwift',
                posts: [{ postId: 'p1', title: 'Thread', permalink: '/p1', comments: [] }],
              },
            ],
          }),
        createServiceClient: () => db,
        loadStage: async () => ({ runTheoryMinerStage }),
        createPrefilter: () => ({ shouldMine, stats }),
        loadFacebookBundles: async () => [],
        createLoggedClaudeCaller: () => claude,
      }),
    ).resolves.toBe(0);

    expect(runTheoryMinerStage).toHaveBeenCalledWith(
      db,
      {
        subreddits: [
          {
            subreddit: 'reddit:TaylorSwift',
            posts: [{ postId: 'p1', title: 'Thread', permalink: '/p1', comments: [] }],
          },
        ],
      },
      { priority: 'P3', shouldMine, claude },
    );
  });

  it('is a clear no-op when Jev is unavailable', async () => {
    const loadStage = vi.fn();
    await expect(
      runTheoryMiner({
        argv: ['--artifact', 'community-crawl.json'],
        exists: () => true,
        readFile: () => JSON.stringify({
          subreddits: [{ subreddit: 'reddit:TaylorSwift', posts: [{ postId: 'p1' }] }],
        }),
        createServiceClient: () => ({ from: vi.fn() }),
        createPrefilter: () => { throw new Error('TYPESAFE_API_KEY is required'); },
        loadFacebookBundles: async () => [],
        createLoggedClaudeCaller: vi.fn(),
        loadStage,
      }),
    ).resolves.toBe(0);
    expect(loadStage).not.toHaveBeenCalled();
  });
});
