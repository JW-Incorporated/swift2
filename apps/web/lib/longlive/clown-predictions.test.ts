import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { persistPrediction } from './clown-predictions';
import type { ClownTake } from './clown-client';
import type { ClownSession } from './clown-session';

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

const FIXTURE_SESSION: ClownSession = { userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' };

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('persistPrediction — PLAN.md Stage 11, wired for real', () => {
  it('never fires a network call when session is null (auth unavailable — toggle off)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ session: null, question: 'q', take: fixtureTake(), sources: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never fires a network call when Supabase env is not configured, even with a session', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ session: FIXTURE_SESSION, question: 'q', take: fixtureTake(), sources: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('POSTs bot_prediction with the session access token and pending status when a session resolves', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    await persistPrediction({ session: FIXTURE_SESSION, question: 'what about the eggs', take: fixtureTake(), sources: [] });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/bot_prediction');
    expect(init.headers.Authorization).toBe('Bearer access-1');
    const body = JSON.parse(init.body);
    expect(body.user_id).toBe('user-1');
    expect(body.status).toBe('pending');
    expect(body.claim).toBe('a stance');
    expect(body.cited_ids).toEqual(['lore:x']);
    expect(body.delulu).toBe(2);
    expect(body.symbols).toEqual([]);
  });

  it('rejects when the network write fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(
      persistPrediction({ session: FIXTURE_SESSION, question: 'q', take: fixtureTake(), sources: [] }),
    ).rejects.toThrow();
  });

  it('rejects when PostgREST returns a non-success response', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(
      persistPrediction({ session: FIXTURE_SESSION, question: 'q', take: fixtureTake(), sources: [] }),
    ).rejects.toThrow('clown prediction insert failed (503)');
  });
});
