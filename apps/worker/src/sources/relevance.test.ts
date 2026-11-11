import type { NormalizedNewsItem } from '@swift2/shared/news';
import { describe, expect, it } from 'vitest';
import { filterRelevantItems } from './relevance';

const item = (title: string, snippet = ''): NormalizedNewsItem => ({
  externalId: title,
  url: `https://example.com/${encodeURIComponent(title)}`,
  title,
  snippet,
});

describe('filterRelevantItems', () => {
  it('keeps label-feed items only when title or summary mentions Taylor Swift', () => {
    const items = [
      item('Drake announces a tour'),
      item('TAYLOR SWIFT announces a new project'),
      item('Label news', 'A collaboration with Taylor Swift is coming.'),
    ];

    expect(filterRelevantItems({ requiredMention: 'Taylor Swift' }, items)).toEqual([
      items[1],
      items[2],
    ]);
  });

  it('keeps all items from an official channel with no subject guard', () => {
    const items = [item('A message from the official channel')];
    expect(filterRelevantItems({}, items)).toEqual(items);
  });
});
