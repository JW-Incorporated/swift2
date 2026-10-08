import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSessionCookieHeader,
  decodeSessionToken,
  encodeSessionToken,
  readSessionCookie,
  resetClownSessionWarningForTests,
  resolveClownSession,
} from './clown-session';

function authResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ access_token: 'access-1', refresh_token: 'refresh-1', user: { id: 'user-1' }, ...overrides }),
    { status: 200 },
  );
}

beforeEach(() => {
  vi.unstubAllEnvs();
  resetClownSessionWarningForTests();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('resolveClownSession — no Supabase env configured', () => {
  it('resolves null and never fires a network call', async () => {
    const fetchSpy = vi.fn();
    await expect(resolveClownSession(null, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('resolveClownSession — toggle ON (mocked anonymous auth success)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('signs in anonymously when no existing token is given', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(authResponse());
    const session = await resolveClownSession(null, fetchSpy as unknown as typeof fetch);
    expect(session).toEqual({ userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://example.supabase.co/auth/v1/signup');
  });

  it('continues via refresh-token exchange when an existing token is given', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(authResponse({ access_token: 'access-2', refresh_token: 'refresh-2' }));
    const session = await resolveClownSession(
      { accessToken: 'old-access', refreshToken: 'old-refresh' },
      fetchSpy as unknown as typeof fetch,
    );
    expect(session?.accessToken).toBe('access-2');
    expect(fetchSpy.mock.calls[0][0]).toContain('/auth/v1/token?grant_type=refresh_token');
  });

  it('falls back to a fresh anonymous sign-in when the refresh fails', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response('bad refresh', { status: 401 }))
      .mockResolvedValueOnce(authResponse());
    const session = await resolveClownSession(
      { accessToken: 'old-access', refreshToken: 'old-refresh' },
      fetchSpy as unknown as typeof fetch,
    );
    expect(session).toEqual({ userId: 'user-1', accessToken: 'access-1', refreshToken: 'refresh-1' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('resolveClownSession — toggle OFF (the real deployed state tonight)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  it('resolves null, never throws, when anonymous sign-ins are disabled', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Anonymous sign-ins are disabled' }), { status: 422 }),
    );
    await expect(resolveClownSession(null, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('resolves null, never throws, on a network error', async () => {
    const fetchSpy = vi.fn().mockRejectedValueOnce(new Error('network down'));
    await expect(resolveClownSession(null, fetchSpy as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('resolves null, never throws, when the shared deadline aborts mid-call (never hangs a chat reply)', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchSpy = vi.fn().mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
    await expect(
      resolveClownSession(null, fetchSpy as unknown as typeof fetch, controller.signal),
    ).resolves.toBeNull();
  });

  it('logs the unavailability exactly once across many calls (no retry-storm spam)', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 422 }));
    await resolveClownSession(null, fetchSpy as unknown as typeof fetch);
    await resolveClownSession(null, fetchSpy as unknown as typeof fetch);
    await resolveClownSession(null, fetchSpy as unknown as typeof fetch);
    const warnCalls = logSpy.mock.calls.filter((c) => c[0] === 'clown:memory-auth-unavailable');
    expect(warnCalls).toHaveLength(1);
  });
});

describe('session token encode/decode', () => {
  it('round-trips', () => {
    const token = encodeSessionToken({ accessToken: 'a', refreshToken: 'r' });
    expect(decodeSessionToken(token)).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('decodes null/garbage to null without throwing', () => {
    expect(decodeSessionToken(null)).toBeNull();
    expect(decodeSessionToken('not-base64-json')).toBeNull();
  });
});

// Architect-directed redesign, HUMAN-ACTIONS.md #15 round 4: the session
// round-trips via an `HttpOnly` cookie, not a client-visible header.
describe('readSessionCookie', () => {
  it('extracts the clown_session value from a single-cookie header', () => {
    expect(readSessionCookie('clown_session=abc123')).toBe('abc123');
  });

  it('extracts clown_session from among other cookies, in any position', () => {
    expect(readSessionCookie('other=1; clown_session=abc123; another=2')).toBe('abc123');
    expect(readSessionCookie('clown_session=abc123; other=1')).toBe('abc123');
  });

  it('returns null when the header is null or the cookie is absent', () => {
    expect(readSessionCookie(null)).toBeNull();
    expect(readSessionCookie('other=1; another=2')).toBeNull();
    expect(readSessionCookie('')).toBeNull();
  });
});

describe('buildSessionCookieHeader', () => {
  it('produces an HttpOnly, Secure, SameSite=Strict cookie scoped to /api/clown with a 180-day Max-Age', () => {
    const header = buildSessionCookieHeader('abc123');
    expect(header).toContain('clown_session=abc123');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Strict');
    expect(header).toContain('Path=/api/clown');
    expect(header).toContain('Max-Age=15552000');
  });
});

describe('session cookie round-trip', () => {
  it('encodeSessionToken -> buildSessionCookieHeader -> readSessionCookie -> decodeSessionToken recovers the original session token', () => {
    const original = { accessToken: 'a', refreshToken: 'r' };
    const encoded = encodeSessionToken(original);
    const setCookieHeader = buildSessionCookieHeader(encoded);
    // Simulate the browser sending back just the name=value pair on the
    // NEXT request's Cookie header (attributes like HttpOnly/Path are never
    // echoed back by the browser).
    const cookieValue = setCookieHeader.split(';')[0];
    const roundTripped = decodeSessionToken(readSessionCookie(cookieValue));
    expect(roundTripped).toEqual(original);
  });
});
