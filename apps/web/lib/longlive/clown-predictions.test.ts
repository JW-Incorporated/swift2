import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { persistPrediction } from './clown-predictions';
import type { ClownTake } from './clown-client';

function fixtureTake(overrides: Partial<ClownTake> = {}): ClownTake {
  return {
    stance: 'a stance',
    argument: 'an argument',
    counterpoint: 'a counterpoint',
    citedIds: ['lore:x'],
    delulu: 2,
    theoryName: 'The Thing',
    aside: 'aside',
    offLimits: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('persistPrediction', () => {
  it('no-ops silently when Supabase env is not configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ question: 'q', take: fixtureTake(), sources: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts to bot_prediction when env is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ question: 'q', take: fixtureTake(), sources: [] });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/rest/v1/bot_prediction');
    expect(JSON.parse(String(init.body))).toMatchObject({ theory_name: 'The Thing', delulu: 2 });
  });

  it('degrades silently (logs, never throws) when the table does not exist yet', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(persistPrediction({ question: 'q', take: fixtureTake(), sources: [] })).resolves.toBeUndefined();
  });

  it('degrades silently on a network error', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(persistPrediction({ question: 'q', take: fixtureTake(), sources: [] })).resolves.toBeUndefined();
  });
});
