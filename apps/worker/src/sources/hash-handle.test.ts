import { describe, expect, it } from 'vitest';
import { hashHandle } from './hash-handle';

describe('hashHandle', () => {
  it('never returns the raw input', () => {
    expect(hashHandle('some.fan.handle')).not.toContain('some.fan.handle');
  });

  it('is deterministic for the same handle', () => {
    expect(hashHandle('jane.bsky.social')).toBe(hashHandle('jane.bsky.social'));
  });

  it('is case- and whitespace-insensitive (the same person never hashes two ways)', () => {
    expect(hashHandle('  Jane.Bsky.Social  ')).toBe(hashHandle('jane.bsky.social'));
  });

  it('two different handles hash differently', () => {
    expect(hashHandle('jane.bsky.social')).not.toBe(hashHandle('john.bsky.social'));
  });

  it('returns a short, fixed-length hex string, not a full digest', () => {
    const hash = hashHandle('/u/some_redditor');
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});
