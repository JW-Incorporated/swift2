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

describe('persistPrediction — no-ops until bot_prediction exists (Codex review MAJOR 9)', () => {
  it('never fires a network call when Supabase env is not configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ question: 'q', take: fixtureTake(), sources: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never fires a doomed POST even when Supabase env IS configured — bot_prediction is Stage 11\'s table', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ question: 'q', take: fixtureTake(), sources: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resolves cleanly (never throws), regardless of env', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    await expect(persistPrediction({ question: 'q', take: fixtureTake(), sources: [] })).resolves.toBeUndefined();
  });
});
