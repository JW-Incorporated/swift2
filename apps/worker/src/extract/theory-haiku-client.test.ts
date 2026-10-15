import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import {
  commentsFromCrawlBundle,
  extractFanTheories,
  sanitizeTheoryMinerResult,
} from './theory-haiku-client';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return { todaysCallCount: async () => 0, incrementToday: async () => undefined };
}

const baseInput = {
  subreddit: 'TaylorSwift',
  postTitle: 'anyone else notice the countdown?',
  postId: 'abc123',
  permalink: 'https://www.reddit.com/r/TaylorSwift/comments/abc123/anyone_else/',
  comments: [{ author: 'hash1', body: 'the countdown clearly means a new vault track' }],
  symbolLexiconKeys: [],
  today: '2026-09-06',
};

function fakeClaude(data: unknown) {
  return vi.fn().mockResolvedValue({ status: 'ok', data }) as WorkerClaudeCaller;
}

afterEach(() => vi.unstubAllEnvs());

describe('extractFanTheories', () => {
  it('returns null with no subscription token', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const claude = fakeClaude({ theories: [] });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractFanTheories(usage, baseInput, { claude })).resolves.toBeNull();
    expect(claude).not.toHaveBeenCalled();
  });

  it('returns null when the cap is reserved out', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({ theories: [] });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb(), 0, 300);
    await expect(extractFanTheories(usage, baseInput, { claude })).resolves.toBeNull();
    expect(claude).not.toHaveBeenCalled();
  });

  it('parses a skip response and uses the lower news theory priority', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({
      theories: [],
      skip_reason: 'no_theory',
      redline_flags: [],
    });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractFanTheories(usage, baseInput, { claude })).resolves.toEqual({
      theories: [],
      skipReason: 'no_theory',
      redlineFlags: [],
    });
    expect(claude).toHaveBeenCalledWith(expect.objectContaining({
      caller: 'news-worker-theory',
      priority: 'P2',
      model: 'claude-haiku-5-5',
    }));
  });

  it('uses P3 and the standalone caller name for the Theory Miner', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({ theories: [], redline_flags: [] });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractFanTheories(usage, baseInput, { priority: 'P3', claude });
    expect(claude).toHaveBeenCalledWith(expect.objectContaining({
      caller: 'theory-miner',
      priority: 'P3',
    }));
  });

  it('normalizes a theory key and prediction', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({
      theories: [{
        name: 'Vault Track Countdown',
        claim: 'Fans believe the countdown predicts a new vault track drop.',
        theory_key: '1989 TV Vault Track Countdown!!',
        stance: 'believed',
        predicts: 'release',
        predicted_date: '2026-10-01',
      }],
      redline_flags: [],
    });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractFanTheories(usage, baseInput, { claude });
    expect(result?.theories[0]).toMatchObject({
      theoryKey: '1989-tv-vault-track-countdown',
      predicts: 'release',
      predictedDate: '2026-10-01',
    });
  });

  it('drops missing required fields and malformed dates', () => {
    const result = sanitizeTheoryMinerResult({
      theories: [
        { name: 'Incomplete Theory' },
        {
          name: 'Vault Track',
          claim: 'Fans believe a vault track is coming.',
          theory_key: 'vault-track',
          stance: 'believed',
          predicts: 'release',
          predicted_date: 'not-a-date',
        },
      ],
    });
    expect(result.theories).toHaveLength(1);
    expect(result.theories[0]?.predictedDate).toBeUndefined();
  });

  it('defers and logs when the subscription wrapper is unavailable', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const claude = vi.fn().mockResolvedValue({
      status: 'unavailable',
      reason: 'limit',
    }) as WorkerClaudeCaller;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractFanTheories(usage, baseInput, { claude })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deferred'));
    warn.mockRestore();
  });

  it('never sends comment authors into the user message', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({ theories: [], redline_flags: [] });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractFanTheories(usage, {
      ...baseInput,
      comments: [{ author: 'deadbeefcafefeed', body: 'this is the clue everyone missed' }],
    }, { claude });
    const user = vi.mocked(claude).mock.calls[0]?.[0].user ?? '';
    expect(user).toContain('this is the clue everyone missed');
    expect(user).not.toContain('deadbeefcafefeed');
  });
});

describe('commentsFromCrawlBundle', () => {
  it('maps raw crawl comments without re-hashing', () => {
    expect(commentsFromCrawlBundle([{ author: 'alreadyhashed', body: 'text' }]))
      .toEqual([{ author: 'alreadyhashed', body: 'text' }]);
  });

  it('normalizes missing author and body to null', () => {
    expect(commentsFromCrawlBundle([{}])).toEqual([{ author: null, body: null }]);
  });
});
