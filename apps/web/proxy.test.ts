import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { API_VERSION } from '@swift2/shared';
import { proxy } from './proxy';

describe('proxy x-api-version header', () => {
  it('is set on /api/* responses', () => {
    const res = proxy(new NextRequest('http://localhost/api/mood'));
    expect(res.headers.get('x-api-version')).toBe(String(API_VERSION));
  });

  it('is not set on page responses', () => {
    const res = proxy(new NextRequest('http://localhost/'));
    expect(res.headers.get('x-api-version')).toBeNull();
  });

  it('still sets the CSP header', () => {
    const res = proxy(new NextRequest('http://localhost/api/mood'));
    expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
  });
});

describe('proxy utm campaign counter (#4719)', () => {
  it('fires the counter without awaiting it, and only for social arrivals', () => {
    const calls: string[] = [];
    const real = globalThis.fetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    globalThis.fetch = (async (_u: unknown, init: { body: string }) => {
      calls.push(init.body);
      return { ok: true };
    }) as never;
    try {
      const waited: Promise<unknown>[] = [];
      const event = { waitUntil: (p: Promise<unknown>) => waited.push(p) } as never;
      const res = proxy(new NextRequest('http://localhost/?utm_medium=social&utm_campaign=thread:x'), event);
      expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(waited).toHaveLength(1);
      proxy(new NextRequest('http://localhost/?utm_medium=email&utm_campaign=thread:x'), event);
      expect(waited).toHaveLength(1);
      expect(calls).toEqual([JSON.stringify({ p_scope: 'utm-visit:thread' })]);
    } finally {
      globalThis.fetch = real;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });
});
