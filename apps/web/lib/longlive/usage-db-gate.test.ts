import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkGlobalDailyCap, reserveGlobalUsage } from './usage-db-gate';
import { MoodUsage } from './mood-usage';

const FIXED_NOW = () => Date.parse('2026-09-04T10:00:00Z');

function usage(cap = 10) {
  return new MoodUsage(cap, FIXED_NOW);
}

function jsonRes(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('checkGlobalDailyCap — fails open on every degraded state', () => {
  it('returns true (allowed) and never calls fetch when Supabase env is unconfigured', async () => {
    vi.unstubAllEnvs();
    const fetchSpy = vi.fn();
    const allowed = await checkGlobalDailyCap('mood-chat-global', 200, fetchSpy as unknown as typeof fetch);
    expect(allowed).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns true when the RPC responds non-2xx', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const fetchSpy = vi.fn(async () => jsonRes(null, false));
    const allowed = await checkGlobalDailyCap('mood-chat-global', 200, fetchSpy as unknown as typeof fetch);
    expect(allowed).toBe(true);
  });

  it('returns true when the fetch itself throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const fetchSpy = vi.fn(async () => {
      throw new Error('network down');
    });
    const allowed = await checkGlobalDailyCap('mood-chat-global', 200, fetchSpy as unknown as typeof fetch);
    expect(allowed).toBe(true);
  });
});

describe('checkGlobalDailyCap — configured Supabase, real RPC call', () => {
  it('calls the RPC with the service-role key headers and the given scope', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const fetchSpy = vi.fn(async () => jsonRes(5));
    await checkGlobalDailyCap('clown-chat-global', 200, fetchSpy as unknown as typeof fetch);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/increment_usage_daily');
    expect(init.headers.apikey).toBe('service-role-key');
    expect(init.headers.Authorization).toBe('Bearer service-role-key');
    expect(JSON.parse(init.body as string)).toEqual({ p_scope: 'clown-chat-global' });
  });

  it('reports within-cap when the post-increment count is under the cap', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const fetchSpy = vi.fn(async () => jsonRes(5));
    expect(await checkGlobalDailyCap('mood-chat-global', 200, fetchSpy as unknown as typeof fetch)).toBe(true);
  });

  it('reports over-cap when the post-increment count exceeds the cap', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const fetchSpy = vi.fn(async () => jsonRes(201));
    expect(await checkGlobalDailyCap('mood-chat-global', 200, fetchSpy as unknown as typeof fetch)).toBe(false);
  });
});

describe('reserveGlobalUsage — combined local + DB gate', () => {
  it('reserves locally then confirms the DB gate; both pass', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const u = usage(10);
    const fetchSpy = vi.fn(async () => jsonRes(5));
    const allowed = await reserveGlobalUsage(u, 'mood-chat-global', 200, fetchSpy as unknown as typeof fetch);
    expect(allowed).toBe(true);
    expect(u.used()).toBe(1);
  });

  it('refuses immediately on the in-process cap without ever reaching the DB', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const u = usage(0); // local cap already exhausted
    const fetchSpy = vi.fn();
    const allowed = await reserveGlobalUsage(u, 'mood-chat-global', 200, fetchSpy as unknown as typeof fetch);
    expect(allowed).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gives back the local reservation when the DB gate reports over-cap', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const u = usage(10);
    const fetchSpy = vi.fn(async () => jsonRes(500)); // durable count already over cap
    const allowed = await reserveGlobalUsage(u, 'clown-chat-global', 200, fetchSpy as unknown as typeof fetch);
    expect(allowed).toBe(false);
    // The local slot was given back — a subsequent local-only check still has room.
    expect(u.used()).toBe(0);
  });
});
