import { describe, expect, it } from 'vitest';
import { readGeneratedAt, contentGeneratedAt, setContentGeneratedAtSource } from './freshness';

describe('readGeneratedAt', () => {
  it('returns the stamp when present and a non-empty string', () => {
    expect(readGeneratedAt({ CONTENT_GENERATED_AT: '2026-07-09T00:00:00.000Z' })).toBe(
      '2026-07-09T00:00:00.000Z',
    );
  });

  it('returns null for a module without the export (the committed fallback)', () => {
    expect(readGeneratedAt({})).toBeNull();
    expect(readGeneratedAt({ VAULT_RAW: {} })).toBeNull();
  });

  it('returns null for malformed values instead of crashing', () => {
    expect(readGeneratedAt({ CONTENT_GENERATED_AT: 42 })).toBeNull();
    expect(readGeneratedAt({ CONTENT_GENERATED_AT: null })).toBeNull();
    expect(readGeneratedAt({ CONTENT_GENERATED_AT: '' })).toBeNull();
  });
});

describe('contentGeneratedAt', () => {
  it('never throws against an unwired source (defaults to an empty record)', () => {
    setContentGeneratedAtSource({});
    expect(contentGeneratedAt()).toBeNull();
  });

  it('reads through whatever source was last wired in', () => {
    setContentGeneratedAtSource({ CONTENT_GENERATED_AT: '2026-07-09T00:00:00.000Z' });
    expect(contentGeneratedAt()).toBe('2026-07-09T00:00:00.000Z');
    setContentGeneratedAtSource({});
  });
});
