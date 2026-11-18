import { describe, expect, it } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { currentItemSearchDocs } from './current-search-docs';
import { searchDocs } from './search-index';

const item = (overrides: Partial<CurrentItem> & { id: string; headline: string }): CurrentItem => ({
  observedOn: '2026-11-13',
  eraId: 'tloas',
  category: 'sighting',
  tags: ['Lore'],
  summary:
    'A notable thing happened today in the fandom, according to multiple reports. Fans reacted quickly across social media and began sharing their reactions widely online.',
  detail:
    'This is a longer, our-words paragraph describing the event in enough detail to clear the current-item-quality detail floor for test fixtures across this whole file every single time word count matters here today in testing, with extra context about the era, the timing, and why fans would care, written out at length so the word count comfortably clears the sixty-word floor every single run without being anywhere near borderline.',
  imageUrl: 'https://www.people.com/photo.jpg',
  status: 'reported',
  confidence: 'reputable_reporting',
  sourceTier: 'established',
  sources: [{ name: 'People', url: 'https://people.com/x', tier: 'established' }],
  symbols: [],
  entities: [],
  heat: 1,
  lastCheckedOn: '2026-11-13',
  expiresAt: '2026-12-31T00:00:00.000Z',
  updatedAt: '2026-11-13T12:00:00.000Z',
  redlineOk: true,
  ...overrides,
});

describe('currentItemSearchDocs', () => {
  const cma = item({ id: 'cma', headline: 'Taylor reportedly set to perform at the CMA Awards for the first time' });

  it('makes a live story findable by a headline word, opening the live item', () => {
    const groups = searchDocs(currentItemSearchDocs([cma]), 'CMA');
    expect(groups.map((g) => g.label)).toEqual(['News']);
    expect(groups[0]!.results[0]!.doc.target).toEqual({ kind: 'current', itemId: 'cma' });
    expect(groups[0]!.results[0]!.doc.snippet).toContain('People');
  });

  it('matches words from the summary too', () => {
    expect(searchDocs(currentItemSearchDocs([cma]), 'fandom')).toHaveLength(1);
  });

  it('applies the same dedupe and quality gate as the feed and the strip', () => {
    const docs = currentItemSearchDocs([
      cma,
      item({ id: 'merged', headline: 'CMA duplicate', mergedInto: 'cma' }),
      item({ id: 'no-image', headline: 'CMA no image', imageUrl: undefined }),
    ]);
    expect(docs.map((d) => d.key)).toEqual(['news:cma']);
  });
});
