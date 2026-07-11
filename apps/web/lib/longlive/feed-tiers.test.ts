import { describe, expect, it } from 'vitest';
import { assignFeedTiers } from './feed-tiers';
import type { ContentItem } from './types';

const realImg = [{ url: 'https://example.com/a.jpg', kind: 'primary' as const }];
const eraArtOnly = [{ url: '/eras/debut.png', kind: 'primary' as const }];

function item(overrides: Partial<ContentItem> & { id: string }): ContentItem {
  return {
    eraId: 'debut',
    date: '2020-01-01',
    dateLabel: 'January 2020',
    title: 'Title',
    summary: 'A summary.',
    body: ['One paragraph.'],
    tags: [],
    images: eraArtOnly,
    ...overrides,
  };
}

describe('assignFeedTiers', () => {
  it('gives text tier to items with only the era-art fallback image', () => {
    const items = [item({ id: 'a', images: eraArtOnly })];
    expect(assignFeedTiers(items).get('a')).toBe('text');
  });

  it('gives chip tier to routine, short, unremarkable items with a real photo', () => {
    const items = [
      item({ id: 'a', images: realImg, tags: ['Tour'], summary: 'Short.' }),
    ];
    expect(assignFeedTiers(items).get('a')).toBe('chip');
  });

  it('gives media tier to a real-photo item that is not routine', () => {
    const items = [item({ id: 'a', images: realImg, tags: ['Music'] })];
    expect(assignFeedTiers(items).get('a')).toBe('media');
  });

  it('gives hero tier to a real-photo item with a video, spaced from other heroes', () => {
    const heroItem = item({
      id: 'a',
      images: realImg,
      tags: ['Music'],
      video: { youtubeId: 'abc', title: 'A video' },
    });
    const filler = Array.from({ length: 9 }, (_, i) =>
      item({ id: `f${i}`, images: realImg, tags: ['Music'] }),
    );
    const tiers = assignFeedTiers([heroItem, ...filler]);
    expect(tiers.get('a')).toBe('hero');
  });

  it('never places two heroes within the minimum spacing window', () => {
    const heroA = item({
      id: 'a',
      images: realImg,
      video: { youtubeId: 'x', title: 'x' },
    });
    const heroB = item({
      id: 'b',
      images: realImg,
      video: { youtubeId: 'y', title: 'y' },
    });
    const tiers = assignFeedTiers([heroA, heroB]);
    expect(tiers.get('a')).toBe('hero');
    expect(tiers.get('b')).not.toBe('hero');
  });

  it('breaks up a long run of media/hero cards into a breather instead of an unbroken wall of images', () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      item({ id: `m${i}`, images: realImg, tags: ['Music'] }),
    );
    const tiers = assignFeedTiers(items);
    const values = items.map((it) => tiers.get(it.id));
    expect(values.some((t) => t === 'text' || t === 'chip')).toBe(true);
  });

  it('never demotes an item with a hidden clue away from an image tier', () => {
    const run = Array.from({ length: 6 }, (_, i) =>
      item({ id: `m${i}`, images: realImg, tags: ['Music'] }),
    );
    const clueItem = item({
      id: 'clue',
      images: realImg,
      tags: ['Music'],
      hiddenClue: { clue: 'c', payoff: 'p' },
    });
    const tiers = assignFeedTiers([...run, clueItem]);
    expect(tiers.get('clue')).not.toBe('text');
    expect(tiers.get('clue')).not.toBe('chip');
  });

  it('is a pure function of the sequence — same input always produces the same tiers', () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      item({ id: `x${i}`, images: i % 2 === 0 ? realImg : eraArtOnly, tags: ['Fashion'] }),
    );
    const first = assignFeedTiers(items);
    const second = assignFeedTiers(items);
    for (const it of items) {
      expect(first.get(it.id)).toBe(second.get(it.id));
    }
  });
});
