import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import { imagesFrom } from './sync-longlive-content.mjs';

describe('imagesFrom', () => {
  it('maps thumbnail_url to the primary image', () => {
    expect(imagesFrom('https://example.com/a.jpg', null)).toEqual([
      { url: 'https://example.com/a.jpg', kind: 'primary' },
    ]);
  });

  it('maps moment.photos to archival entries after the primary, carrying credit', () => {
    expect(
      imagesFrom('https://example.com/a.jpg', [
        { url: 'https://example.com/b.jpg', credit: 'Getty Images' },
      ]),
    ).toEqual([
      { url: 'https://example.com/a.jpg', kind: 'primary' },
      { url: 'https://example.com/b.jpg', credit: 'Getty Images', caption: undefined, kind: 'archival' },
    ]);
  });

  it('respects an explicit valid photo kind and coerces unknown kinds to archival', () => {
    const out = imagesFrom(null, [
      { url: 'https://example.com/r.jpg', kind: 'reference' },
      { url: 'https://example.com/x.jpg', kind: 'totally-real' },
    ]);
    expect(out?.map((i) => i.kind)).toEqual(['reference', 'archival']);
  });

  it('de-dupes by url, keeping the primary first and merging the photo credit/caption in', () => {
    expect(
      imagesFrom('https://example.com/a.jpg', [
        { url: 'https://example.com/a.jpg', credit: 'Big Machine Records', caption: 'Album art' },
        { url: 'https://example.com/a.jpg', credit: 'Someone Else' },
      ]),
    ).toEqual([
      {
        url: 'https://example.com/a.jpg',
        credit: 'Big Machine Records',
        caption: 'Album art',
        kind: 'primary',
      },
    ]);
  });

  it('drops malformed photo entries (no url / blank url / non-object)', () => {
    expect(
      imagesFrom(null, [null, {}, { url: '   ' }, { credit: 'Getty' }, 'nope']),
    ).toBeUndefined();
  });

  it('returns undefined when there is no imagery at all (field omitted -> era-art fallback)', () => {
    expect(imagesFrom(null, null)).toBeUndefined();
    expect(imagesFrom('', [])).toBeUndefined();
  });
});
