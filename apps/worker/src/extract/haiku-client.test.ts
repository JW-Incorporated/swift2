import { afterEach, describe, expect, it, vi } from 'vitest';
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

const ORIGINAL_ENV = process.env.ANTHROPIC_API_KEY;
const baseInput = { items: [{ title: 't', snippet: 's' }], symbolLexiconKeys: [], eraId: 'tloas', today: '2026-08-23' };

function toolUseResponse(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_knowledge', input }] }),
  };
}

describe('extractWithLLM', () => {
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV;
    vi.unstubAllGlobals();
  });

  it('returns null with no ANTHROPIC_API_KEY — the expected state, not an error', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result).toBeNull();
  });

  it('returns null when the cap is already reserved out, without calling fetch', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb(), 0, 600); // perRunCap=0
    const result = await extractWithLLM(usage, baseInput);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses a skip tool call', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', skip_reason: 'not_taylor', redline_flags: [] })),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result).toEqual({ kind: 'skip', skipReason: 'not_taylor', redlineFlags: [] });
  });

  it('parses a current_item tool call and clamps an out-of-range category', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
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
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result?.kind).toBe('current_item');
    expect(result?.currentItem?.category).toBe('sighting'); // fallback default
    expect(result?.currentItem?.headline).toBe('H');
  });

  it('degrades an empty current_item body to skip rather than write a half-empty row', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(toolUseResponse({ kind: 'current_item', redline_flags: [] })));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result?.kind).toBe('skip');
    expect(result?.skipReason).toBe('no_truth_value');
  });

  it('throws on a non-OK response — a real failure, defers the cluster, never silently drops it', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'server error' }),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractWithLLM(usage, baseInput)).rejects.toThrow('Anthropic extract failed (500)');
  });

  it('caches the system prompt via cache_control on the system block', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', redline_flags: [] }));
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractWithLLM(usage, baseInput);
    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    expect(body.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'record_knowledge' });
  });

  it('sends real-shaped Reddit comment bodies as explicitly untrusted, aggregate-only context', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', redline_flags: [] }));
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractWithLLM(usage, {
      ...baseInput,
      commentThreads: [
        {
          postTitle: 'Taylor Swift Performance - The Icon Sessions at the Grammy Museum.',
          comments: [
            'WAKE THE FCK UP ITS SURPRISE SONG OCLOCK',
            'i miss The Eras Tour piano so much! the idea of mashing up I Knew It, I Knew You x august x All Too Well is genius.',
          ],
        },
      ],
    });

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    const userMessage = body.messages[0].content as string;
    expect(userMessage).toContain('REDDIT COMMENT THREAD CONTEXT');
    expect(userMessage).toContain('SURPRISE SONG OCLOCK');
    expect(userMessage).toContain('mashing up I Knew It, I Knew You x august x All Too Well');
    expect(userMessage).not.toContain('/u/');
    expect(body.system[0].text).toContain('untrusted source material');
    expect(body.system[0].text).toContain('Never name, quote, closely paraphrase');
    expect(body.system[0].text).toContain('Easter-egg interpretation, theories, and new-song discussion');
  });
});

describe('sanitizeResult', () => {
  it('defaults to skip for a completely unrecognized kind', () => {
    expect(sanitizeResult({ kind: 'nonsense' })).toEqual({ kind: 'skip', redlineFlags: [] });
  });
});
