import { createHash as nodeHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash, sha256 } from './hash';

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const expected = (text: string) => nodeHash('sha256').update(text, 'utf8').digest('hex');

describe('sha256 (pure-JS fallback)', () => {
  it('matches the FIPS 180-4 test vectors', () => {
    expect(hex(sha256(new TextEncoder().encode('')))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(hex(sha256(new TextEncoder().encode('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  // Every padding boundary (55/56/63/64 bytes) plus multi-block and non-ASCII input.
  it.each([1, 55, 56, 57, 63, 64, 65, 119, 120, 1000, 100_003])(
    'matches node:crypto at %i bytes',
    (n) => {
      const text = 'é✨a'.repeat(n).slice(0, n);
      expect(hex(sha256(new TextEncoder().encode(text)))).toBe(expected(text));
    },
  );
});

describe('createHash', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses WebCrypto when present', async () => {
    expect(await createHash('Long Live')).toBe(expected('Long Live'));
  });

  it('accepts pre-encoded bytes without re-encoding', async () => {
    const bytes = new TextEncoder().encode('Long Live ✨');
    const encode = vi.spyOn(TextEncoder.prototype, 'encode');
    expect(await createHash(bytes)).toBe(expected('Long Live ✨'));
    expect(encode).not.toHaveBeenCalled();
    encode.mockRestore();
  });

  // Hermes (the native app) has `crypto.randomUUID` but no `crypto.subtle`.
  it('falls back to pure JS when crypto.subtle is missing', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'x' });
    expect(await createHash('Long Live ✨')).toBe(expected('Long Live ✨'));
  });

  it('falls back to pure JS when there is no crypto global at all', async () => {
    vi.stubGlobal('crypto', undefined);
    expect(await createHash('{"eras":[]}')).toBe(expected('{"eras":[]}'));
  });
});
