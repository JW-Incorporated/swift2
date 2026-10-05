import { describe, expect, it } from 'vitest';
import { bearerToken, timingSafeSecretEqual } from './rate-limit';

describe('timingSafeSecretEqual', () => {
  it('accepts the exact secret', () => {
    expect(timingSafeSecretEqual('real-secret', 'real-secret')).toBe(true);
  });

  it('rejects a wrong secret of the same length', () => {
    expect(timingSafeSecretEqual('real-secreT', 'real-secret')).toBe(false);
  });

  it('rejects wrong-length secrets without throwing', () => {
    expect(timingSafeSecretEqual('short', 'real-secret')).toBe(false);
    expect(timingSafeSecretEqual('real-secret-and-more', 'real-secret')).toBe(false);
    expect(timingSafeSecretEqual('', 'real-secret')).toBe(false);
  });
});

describe('bearerToken', () => {
  const req = (authorization?: string) =>
    new Request('http://localhost/x', authorization ? { headers: { authorization } } : undefined);

  it('extracts the token from a Bearer header', () => {
    expect(bearerToken(req('Bearer abc123'))).toBe('abc123');
  });

  it('returns null for a missing or non-Bearer header', () => {
    expect(bearerToken(req())).toBeNull();
    expect(bearerToken(req('Basic abc123'))).toBeNull();
  });
});
