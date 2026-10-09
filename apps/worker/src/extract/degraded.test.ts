import { describe, expect, it } from 'vitest';
import { detectExtractDegraded } from './degraded';

const base = { clustersConsidered: 0, extracted: 0, deferred: 0, schemaPending: 0, hasApiKey: true };

describe('detectExtractDegraded', () => {
  it('flags all-deferred with no key', () => {
    const r = detectExtractDegraded({ ...base, clustersConsidered: 50, deferred: 50, hasApiKey: false });
    expect(r?.cause).toBe('deferred-no-key');
    expect(r?.message).toContain('extract-degraded');
  });

  it('flags all-deferred at the cap when a key is present', () => {
    expect(detectExtractDegraded({ ...base, clustersConsidered: 3, deferred: 3 })?.cause).toBe('deferred-at-cap');
  });

  it('flags schema-pending', () => {
    expect(detectExtractDegraded({ ...base, schemaPending: 2 })?.cause).toBe('schema-pending');
  });

  it('is quiet on a normal run', () => {
    expect(detectExtractDegraded({ ...base, clustersConsidered: 50, extracted: 5, deferred: 0 })).toBeNull();
  });

  it('is quiet when some clusters extracted even if others deferred', () => {
    expect(detectExtractDegraded({ ...base, clustersConsidered: 50, extracted: 5, deferred: 45 })).toBeNull();
  });

  it('is quiet when clusters were screened out or skipped, not deferred', () => {
    expect(detectExtractDegraded({ ...base, clustersConsidered: 4, deferred: 1 })).toBeNull();
  });

  it('is quiet with zero clusters', () => {
    expect(detectExtractDegraded(base)).toBeNull();
  });
});
