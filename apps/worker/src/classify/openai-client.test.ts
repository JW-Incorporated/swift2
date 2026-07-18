import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyWithLLM } from './openai-client';
import { UsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return {
    async todaysCallCount() {
      return 0;
    },
    async incrementToday() {},
  };
}

const ORIGINAL_ENV = process.env.OPENAI_API_KEY;

describe('classifyWithLLM', () => {
  afterEach(() => {
    process.env.OPENAI_API_KEY = ORIGINAL_ENV;
    vi.unstubAllGlobals();
  });

  it('returns null with no OPENAI_API_KEY — the expected state today, not an error', async () => {
    delete process.env.OPENAI_API_KEY;
    const usage = await UsageStore.create(unlimitedUsageDb());
    const result = await classifyWithLLM(usage, { title: 't', snippet: 's' });
    expect(result).toBeNull();
  });

  it('returns null when the daily cap is already reserved out, without calling fetch', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await UsageStore.create(unlimitedUsageDb(), 0); // cap of 0 — nothing gets reserved
    const result = await classifyWithLLM(usage, { title: 't', snippet: 's' });
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sanitizes a valid model response: clamps importance, drops an invalid category', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  category: 'not-a-real-category',
                  headline: 'H',
                  summary: 'S',
                  importance: 99,
                }),
              },
            },
          ],
        }),
      }),
    );
    const usage = await UsageStore.create(unlimitedUsageDb());
    const result = await classifyWithLLM(usage, { title: 't', snippet: 's' });
    expect(result).toEqual({ category: 'sighting', headline: 'H', summary: 'S', importance: 10 });
  });

  it('throws on a non-OK response — a real failure, not a fallback signal', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'server error' }),
    );
    const usage = await UsageStore.create(unlimitedUsageDb());
    await expect(classifyWithLLM(usage, { title: 't', snippet: 's' })).rejects.toThrow(
      'OpenAI classify failed (500)',
    );
  });
});
