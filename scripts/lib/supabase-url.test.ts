import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module
import { checkBareSupabaseUrl, strictServiceClient, SUPABASE_URL_MESSAGE } from './supabase.mjs';

describe('checkBareSupabaseUrl', () => {
  it.each([
    ['https://abc-123.supabase.co', 'https://abc-123.supabase.co'],
    ['https://abc.supabase.co/', 'https://abc.supabase.co'],
    ['  "https://abc.supabase.co"  ', 'https://abc.supabase.co'],
    ["'https://abc.supabase.co/'", 'https://abc.supabase.co'],
    ['http://localhost:54321', 'http://localhost:54321'],
    ['http://127.0.0.1:54321/', 'http://127.0.0.1:54321'],
  ])('accepts %s', (input, url) => {
    expect(checkBareSupabaseUrl(input)).toEqual({ ok: true, url });
  });

  it.each([
    ['https://abc.supabase.co/rest/v1', 'has a path'],
    ['http://abc.supabase.co', 'not https'],
    ['abc.supabase.co', 'not https'],
    ['https://abc.supabase.co/"x"', 'quoted'],
    ['https://abc .supabase.co', 'whitespace'],
    [undefined, 'missing'],
  ])('rejects %s by rule %s', (input, rule) => {
    expect(checkBareSupabaseUrl(input)).toEqual({ ok: false, rule });
  });
});

describe('strictServiceClient', () => {
  it('returns null when env is unset', () => {
    expect(strictServiceClient({})).toBeNull();
  });

  it('throws the clear message naming the rule, never the value', () => {
    const secret = 'https://abc.supabase.co/secret-path';
    let message = '';
    try {
      strictServiceClient({ SUPABASE_URL: secret, SUPABASE_SERVICE_ROLE_KEY: 'k' });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain(SUPABASE_URL_MESSAGE);
    expect(message).toContain('has a path');
    expect(message).not.toContain('secret-path');
  });

  it('builds a client for a valid URL', () => {
    expect(
      strictServiceClient({ SUPABASE_URL: ' "https://abc.supabase.co/" ', SUPABASE_SERVICE_ROLE_KEY: 'k' }),
    ).toBeTruthy();
  });
});
