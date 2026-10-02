import { describe, expect, it } from 'vitest';
import { canonicalize, hashValue } from './hash';

describe('canonicalize', () => {
  it('is independent of key order and drops undefined members', () => {
    expect(canonicalize({ b: 1, a: { d: [1, undefined], c: undefined } })).toBe('{"a":{"d":[1,null]},"b":1}');
    expect(canonicalize({ a: 1, b: 2 })).toBe(canonicalize({ b: 2, a: 1 }));
  });

  it('rejects values that would hash differently across runtimes', () => {
    expect(() => canonicalize({ a: NaN })).toThrow();
    expect(() => canonicalize({ a: new Map() })).toThrow();
  });
});

describe('hashValue', () => {
  it('is SHA-256 hex of the canonical form', async () => {
    expect(await hashValue({ b: 1, a: 2 })).toBe(await hashValue({ a: 2, b: 1 }));
    expect(await hashValue(1)).toBe('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b');
  });
});
