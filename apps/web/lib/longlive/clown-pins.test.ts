import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listPinnedTheories, pinTheory, unpinTheory } from './clown-pins';
import type { ClownSession } from './clown-session';

const FIXTURE_SESSION: ClownSession = { userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' };

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('clown-pins — session null (auth unavailable)', () => {
  it('pinTheory/unpinTheory no-op, listPinnedTheories returns []', async () => {
    const fetchSpy = vi.fn();
    await pinTheory(null, 'theory-1', fetchSpy as unknown as typeof fetch);
    await unpinTheory(null, 'theory-1', fetchSpy as unknown as typeof fetch);
    await expect(listPinnedTheories(null, fetchSpy as unknown as typeof fetch)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('clown-pins — a resolved session', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('pinTheory POSTs the user-scoped row', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await pinTheory(FIXTURE_SESSION, 'theory-1', fetchSpy as unknown as typeof fetch);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/clown_pinned_theory');
    expect(JSON.parse(init.body)).toEqual({ user_id: 'user-1', live_theory_id: 'theory-1' });
  });

  it('unpinTheory DELETEs scoped to user + theory', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await unpinTheory(FIXTURE_SESSION, 'theory-1', fetchSpy as unknown as typeof fetch);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('user_id=eq.user-1');
    expect(url).toContain('live_theory_id=eq.theory-1');
    expect(init.method).toBe('DELETE');
  });

  it('listPinnedTheories returns the ids on success', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ live_theory_id: 'a' }, { live_theory_id: 'b' }]), { status: 200 }),
    );
    await expect(listPinnedTheories(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch)).resolves.toEqual(['a', 'b']);
  });

  it('listPinnedTheories degrades to [] on a failed read', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(listPinnedTheories(FIXTURE_SESSION, fetchSpy as unknown as typeof fetch)).resolves.toEqual([]);
  });
});
