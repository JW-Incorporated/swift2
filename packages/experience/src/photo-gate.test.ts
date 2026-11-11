import { describe, expect, it } from 'vitest';
import { hasDisplayablePhoto, hasRealPrimaryImage } from '@swift2/experience';
import type { ContentItem, ImageKind } from '@swift2/experience';

// The KCA-photo-gate split (2026-10-14): a card may RENDER a photo whenever the
// moment has any real (non-era-art) photo, of ANY kind — matching the detail
// page, which resolves via primaryImageRef's images[0] fallback. The reported
// bug: moments whose only photo was editorially tagged 'archival'/'reference'
// rendered no card photo while their detail page showed one (42 moments in
// tloas, incl. the 2026-10-08 KCA-nominations post).
const img = (url: string, kind: ImageKind): { url: string; kind: ImageKind } => ({ url, kind });

function item(images: { url: string; kind: ImageKind }[]): ContentItem {
  return {
    id: 'm1',
    eraId: 'debut',
    date: '2020-01-01',
    dateLabel: 'January 2020',
    title: 'T',
    summary: 'S',
    body: ['B'],
    tags: [],
    images,
  };
}

describe('hasDisplayablePhoto — the feed-card photo gate', () => {
  it('accepts a primary-kind photo', () => {
    expect(hasDisplayablePhoto(item([img('https://a.com/p.jpg', 'primary')]))).toBe(true);
  });

  it('accepts an archival-only photo (the KCA case)', () => {
    expect(hasDisplayablePhoto(item([img('https://upload.wikimedia.org/x.jpg', 'archival')]))).toBe(
      true,
    );
  });

  it('accepts a reference-only photo', () => {
    expect(hasDisplayablePhoto(item([img('https://a.com/r.jpg', 'reference')]))).toBe(true);
  });

  it('accepts a gallery where the primary entry is era-art but a real entry follows', () => {
    expect(
      hasDisplayablePhoto(item([img('/eras/debut.png', 'primary'), img('https://a.com/a.jpg', 'archival')])),
    ).toBe(true);
  });

  it('rejects an era-art fallback as the only image', () => {
    expect(hasDisplayablePhoto(item([img('/eras/debut.png', 'primary')]))).toBe(false);
  });

  it('rejects a moment with no images at all', () => {
    expect(hasDisplayablePhoto(item([]))).toBe(false);
  });
});

describe('hasRealPrimaryImage vs hasDisplayablePhoto — the split', () => {
  it('diverges exactly on non-primary-kind photos (archival)', () => {
    const it = item([img('https://upload.wikimedia.org/x.jpg', 'archival')]);
    expect(hasRealPrimaryImage(it)).toBe(false);
    expect(hasDisplayablePhoto(it)).toBe(true);
  });

  it('diverges exactly on non-primary-kind photos (reference)', () => {
    const it = item([img('https://a.com/r.jpg', 'reference')]);
    expect(hasRealPrimaryImage(it)).toBe(false);
    expect(hasDisplayablePhoto(it)).toBe(true);
  });

  it('agrees on a primary-kind photo', () => {
    const it = item([img('https://a.com/p.jpg', 'primary')]);
    expect(hasRealPrimaryImage(it)).toBe(true);
    expect(hasDisplayablePhoto(it)).toBe(true);
  });

  it('agrees on era-art-only', () => {
    const it = item([img('/eras/debut.png', 'primary')]);
    expect(hasRealPrimaryImage(it)).toBe(false);
    expect(hasDisplayablePhoto(it)).toBe(false);
  });
});
