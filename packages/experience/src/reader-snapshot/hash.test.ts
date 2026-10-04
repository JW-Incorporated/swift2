import { describe, expect, it } from 'vitest';
import { canonicalize, hashSnapshot, hashValue } from './hash';
import { READER_SNAPSHOT_DOMAIN_NAMES, type ReaderSnapshot } from './types';

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

const fullDomains = Object.fromEntries(READER_SNAPSHOT_DOMAIN_NAMES.map((n) => [n, []]));

describe('hashSnapshot', () => {
  it('hashes snapshot.version: a version-only difference changes the hash', async () => {
    const base = { state: 'ready', origin: { kind: 'baked' }, domains: fullDomains };
    const a = await hashSnapshot({ ...base, version: 1 } as unknown as ReaderSnapshot);
    const b = await hashSnapshot({ ...base, version: 2 } as unknown as ReaderSnapshot);
    expect(a.domains).toEqual(b.domains);
    expect(a.hash).not.toBe(b.hash);
  });

  it('names all 14 domains', () => {
    expect(READER_SNAPSHOT_DOMAIN_NAMES).toHaveLength(14);
  });

  it.each(READER_SNAPSHOT_DOMAIN_NAMES.map((n) => [n]))('throws when domain %s is missing', async (name) => {
    const rest = Object.fromEntries(Object.entries(fullDomains).filter(([k]) => k !== name));
    const snap = { version: 1, state: 'ready', origin: { kind: 'baked' }, domains: rest };
    await expect(hashSnapshot(snap as unknown as ReaderSnapshot)).rejects.toThrow(new RegExp(`missing domains: ${name}`));
  });

  it('throws on a core-only snapshot, naming merch, songMoods and lore', async () => {
    const core = Object.fromEntries(
      Object.entries(fullDomains).filter(([k]) => k !== 'merch' && k !== 'songMoods' && k !== 'lore'),
    );
    const snap = { version: 1, state: 'ready', origin: { kind: 'baked' }, domains: core };
    await expect(hashSnapshot(snap as unknown as ReaderSnapshot)).rejects.toThrow(/merch, songMoods, lore/);
  });
});
