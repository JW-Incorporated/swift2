import { describe, expect, it } from 'vitest';
import { assertCardFile, isCardImage, MAX_CARD_BYTES } from './share-card-guard';

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);

describe('share card guard', () => {
  it('accepts png and jpeg within the cap', () => {
    expect(isCardImage(PNG)).toBe(true);
    expect(isCardImage(JPEG)).toBe(true);
    expect(() => assertCardFile(MAX_CARD_BYTES, PNG)).not.toThrow();
  });

  it.each([
    ['html', Uint8Array.from(Buffer.from('<!doctype html>'))],
    ['svg', Uint8Array.from(Buffer.from('<svg xmlns='))],
    ['gif', Uint8Array.from(Buffer.from('GIF89a'))],
    ['empty', new Uint8Array()],
  ])('rejects %s content', (_n, head) => {
    expect(() => assertCardFile(100, head)).toThrow(/png\/jpeg/);
  });

  it('rejects a file over the 5 MB cap', () => {
    expect(() => assertCardFile(MAX_CARD_BYTES + 1, PNG)).toThrow(/too large/);
  });
});
