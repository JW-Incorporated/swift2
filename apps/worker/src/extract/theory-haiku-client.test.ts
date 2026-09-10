import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractFanTheories,
  sanitizeTheoryMinerResult,
  commentsFromCrawlBundle,
} from './theory-haiku-client';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return {
    async todaysCallCount() {
      return 0;
    },
    async incrementToday() {},
  };
}

const ORIGINAL_ENV = process.env.ANTHROPIC_API_KEY;
const baseInput = {
  subreddit: 'TaylorSwift',
  postTitle: 'anyone else notice the countdown?',
  postId: 'abc123',
  permalink: 'https://www.reddit.com/r/TaylorSwift/comments/abc123/anyone_else/',
  comments: [{ author: 'hash1', body: 'the countdown clearly means a new vault track' }],
  symbolLexiconKeys: [],
  today: '2026-09-06',
};

function toolUseResponse(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_fan_theories', input }] }),
  };
}

describe('extractFanTheories', () => {
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV;
    vi.unstubAllGlobals();
  });

  it('returns null with no ANTHROPIC_API_KEY — the expected state, not an error', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractFanTheories(usage, baseInput);
    expect(result).toBeNull();
  });

  it('returns null when the cap is already reserved out, without calling fetch', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb(), 0, 300); // perRunCap=0
    const result = await extractFanTheories(usage, baseInput);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses an empty theories array with a skip reason', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          toolUseResponse({ theories: [], skip_reason: 'no_theory', redline_flags: [] }),
        ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractFanTheories(usage, baseInput);
    expect(result).toEqual({ theories: [], skipReason: 'no_theory', redlineFlags: [] });
  });

  it('parses a theory and normalizes theory_key to a lowercase slug', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          theories: [
            {
              name: 'Vault Track Countdown',
              claim: 'Fans believe the countdown clock predicts a new vault track drop.',
              theory_key: '1989 TV Vault Track Countdown!!',
              symbols: ['13'],
              stance: 'believed',
              predicts: 'release',
              predicted_date: '2026-10-01',
            },
          ],
          redline_flags: [],
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractFanTheories(usage, baseInput);
    expect(result?.theories).toHaveLength(1);
    const first = result?.theories[0];
    expect(first).toBeDefined();
    expect(first?.theoryKey).toBe('1989-tv-vault-track-countdown');
    expect(first?.predicts).toBe('release');
    expect(first?.predictedDate).toBe('2026-10-01');
  });

  it('drops a theory missing required fields rather than storing it half-empty', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          theories: [{ name: 'Incomplete Theory' }], // missing claim/theory_key/stance
          redline_flags: [],
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractFanTheories(usage, baseInput);
    expect(result?.theories).toEqual([]);
  });

  it('drops an invalid predicted_date rather than storing a malformed one', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          theories: [
            {
              name: 'Vault Track',
              claim: 'Fans believe a vault track is coming.',
              theory_key: 'vault-track',
              stance: 'believed',
              predicts: 'release',
              predicted_date: 'not-a-date',
            },
          ],
          redline_flags: [],
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractFanTheories(usage, baseInput);
    expect(result?.theories[0]?.predictedDate).toBeUndefined();
  });

  it('throws on a non-OK response — a real failure, defers the bundle, never silently drops it', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'server error' }),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractFanTheories(usage, baseInput)).rejects.toThrow(
      'Anthropic theory-miner extract failed (500)',
    );
  });

  it('caches the system prompt via cache_control on the system block', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        toolUseResponse({ theories: [], skip_reason: 'no_theory', redline_flags: [] }),
      );
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractFanTheories(usage, baseInput);
    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    expect(body.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'record_fan_theories' });
  });

  it('never sends comment authors into the user message — aggregate-only, hashed-or-nothing', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        toolUseResponse({ theories: [], skip_reason: 'no_theory', redline_flags: [] }),
      );
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractFanTheories(usage, {
      ...baseInput,
      comments: [{ author: 'deadbeefcafefeed', body: 'this is the real clue everyone missed' }],
    });
    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    const userMessage = body.messages[0].content as string;
    expect(userMessage).toContain('this is the real clue everyone missed');
    expect(userMessage).not.toContain('deadbeefcafefeed');
  });
});

describe('sanitizeTheoryMinerResult', () => {
  it('defaults to an empty theories array for a completely malformed body', () => {
    expect(sanitizeTheoryMinerResult({})).toEqual({ theories: [], redlineFlags: [] });
  });
});

describe('commentsFromCrawlBundle', () => {
  it('maps raw crawl comments straight through without re-hashing', () => {
    const result = commentsFromCrawlBundle([{ author: 'alreadyhashed', body: 'text' }]);
    expect(result).toEqual([{ author: 'alreadyhashed', body: 'text' }]);
  });

  it('normalizes missing author/body to null', () => {
    const result = commentsFromCrawlBundle([{}]);
    expect(result).toEqual([{ author: null, body: null }]);
  });
});
