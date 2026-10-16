import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import { extractWithLLM, sanitizeResult } from './haiku-client';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return {
    async todaysCallCount() {
      return 0;
    },
    async incrementToday() {},
  };
}

const baseInput = {
  items: [{ title: 't', snippet: 's' }],
  symbolLexiconKeys: [],
  eraId: 'tloas',
  today: '2026-08-23',
};

function fakeClaude(data: unknown) {
  return vi.fn().mockResolvedValue({ status: 'ok', data }) as WorkerClaudeCaller;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('extractWithLLM', () => {
  it('returns null with no subscription token', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const claude = fakeClaude({ kind: 'skip' });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractWithLLM(usage, baseInput, claude)).resolves.toBeNull();
    expect(claude).not.toHaveBeenCalled();
  });

  it('returns null when the cap is already reserved out', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({ kind: 'skip' });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb(), 0, 600);
    await expect(extractWithLLM(usage, baseInput, claude)).resolves.toBeNull();
    expect(claude).not.toHaveBeenCalled();
  });

  it('parses a skip response through the fake subscription wrapper', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({
      kind: 'skip',
      skip_reason: 'not_taylor',
      redline_flags: [],
    });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractWithLLM(usage, baseInput, claude)).resolves.toEqual({
      kind: 'skip',
      skipReason: 'not_taylor',
      redlineFlags: [],
    });
    expect(claude).toHaveBeenCalledWith(expect.objectContaining({
      caller: 'news-worker-extract',
      priority: 'P1',
      model: 'claude-haiku-5-5',
      schema: expect.objectContaining({ type: 'object' }),
    }));
  });

  it('parses a current item and clamps an out-of-range category', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({
      kind: 'current_item',
      redline_flags: [],
      current_item: {
        observed_on: '2026-08-23',
        category: 'not-a-real-category',
        headline: 'H',
        summary: 'S',
        detail: 'D',
        status_hint: 'reported',
        tags: ['taylor'],
        symbols: ['13'],
        entities: [],
      },
    });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput, claude);
    expect(result?.currentItem?.category).toBe('sighting');
    expect(result?.currentItem?.headline).toBe('H');
  });

  it('degrades an empty current item to skip', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(
      usage,
      baseInput,
      fakeClaude({ kind: 'current_item', redline_flags: [] }),
    );
    expect(result).toMatchObject({ kind: 'skip', skipReason: 'no_truth_value' });
  });

  it('defers and logs when the wrapper is unavailable', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const claude = vi.fn().mockResolvedValue({
      status: 'unavailable',
      reason: 'limit',
    }) as WorkerClaudeCaller;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractWithLLM(usage, baseInput, claude)).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deferred'));
    warn.mockRestore();
  });

  it('throws on invalid wrapper output so the cluster retries next cycle', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = vi.fn().mockResolvedValue({
      status: 'invalid',
      reason: 'schema miss',
    }) as WorkerClaudeCaller;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractWithLLM(usage, baseInput, claude))
      .rejects.toThrow('Claude extract returned invalid output');
  });

  it('sends Reddit comments and article text as bounded, untrusted context', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({ kind: 'skip', redline_flags: [] });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractWithLLM(usage, {
      ...baseInput,
      commentThreads: [{ postTitle: 'Thread', comments: ['SURPRISE SONG OCLOCK'] }],
      articleTexts: [{
        url: 'https://variety.com/article',
        outletName: 'Variety',
        text: 'Eras Tour anniversary as the inspiration.',
      }],
    }, claude);
    const call = vi.mocked(claude).mock.calls[0]?.[0];
    expect(call?.user).toContain('REDDIT COMMENT THREAD CONTEXT');
    expect(call?.user).toContain('SURPRISE SONG OCLOCK');
    expect(call?.user).toContain('FULL ARTICLE TEXT');
    expect(call?.user).toContain('Variety');
    expect(call?.system).toContain('untrusted source material');
  });

  it('caps the total article-text block', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = fakeClaude({ kind: 'skip', redline_flags: [] });
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const longText = 'word '.repeat(2_000);
    await extractWithLLM(usage, {
      ...baseInput,
      articleTexts: [
        { url: 'https://a.example/1', text: longText },
        { url: 'https://b.example/2', text: longText },
        { url: 'https://c.example/3', text: longText },
      ],
    }, claude);
    const user = vi.mocked(claude).mock.calls[0]?.[0].user ?? '';
    expect(user.length - user.indexOf('FULL ARTICLE TEXT')).toBeLessThan(10_000);
  });
});

describe('sanitizeResult', () => {
  it('defaults to skip for an unrecognized kind', () => {
    expect(sanitizeResult({ kind: 'nonsense' })).toEqual({
      kind: 'skip',
      redlineFlags: [],
    });
  });
});
