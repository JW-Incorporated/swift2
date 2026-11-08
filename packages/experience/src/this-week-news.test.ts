import { describe, expect, it } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { currentFeedEntries } from './current-feed';
import { isThisWeekNews, streamExtraEntries, thisWeekNewsItems } from './this-week-news';

const NOW = Date.parse('2026-11-03T12:00:00Z');

const currentItem = (overrides: Partial<CurrentItem> & { id: string; observedOn: string }): CurrentItem => ({
  eraId: 'tloas',
  category: 'sighting',
  tags: ['Lore'],
  headline: 'Something happened',
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
  lastCheckedOn: overrides.observedOn,
  expiresAt: '2026-12-31T00:00:00.000Z',
  updatedAt: '2026-11-03T12:00:00.000Z',
  redlineOk: true,
  ...overrides,
});

describe('thisWeekNewsItems', () => {
  it('is empty for no items', () => {
    expect(thisWeekNewsItems([], NOW)).toEqual([]);
  });

  it('keeps the exact 7-day boundary and drops anything older', () => {
    const items = [
      currentItem({ id: 'edge', observedOn: '2026-10-27' }),
      currentItem({ id: 'old', observedOn: '2026-10-26' }),
    ];
    expect(thisWeekNewsItems(items, Date.parse('2026-11-03T00:00:00Z')).map((i) => i.id)).toEqual(['edge']);
  });

  it('orders newest first, ties by id', () => {
    const items = [
      currentItem({ id: 'b', observedOn: '2026-11-01' }),
      currentItem({ id: 'c', observedOn: '2026-11-02' }),
      currentItem({ id: 'a', observedOn: '2026-11-01' }),
    ];
    expect(thisWeekNewsItems(items, NOW).map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('respects the quality gate and merged-duplicate collapse', () => {
    const items = [
      currentItem({ id: 'ok', observedOn: '2026-11-02' }),
      currentItem({ id: 'no-image', observedOn: '2026-11-02', imageUrl: undefined }),
      currentItem({ id: 'merged', observedOn: '2026-11-02', mergedInto: 'ok' }),
    ];
    expect(thisWeekNewsItems(items, NOW).map((i) => i.id)).toEqual(['ok']);
  });
});

describe('isThisWeekNews', () => {
  it('is false for a playable video, so it renders as a stream card', () => {
    const video = currentItem({ id: 'v', observedOn: '2026-11-02', mediaKind: 'video', embed: { provider: 'youtube', videoId: 'dQw4w9WgXcQ' } });
    expect(isThisWeekNews(video, NOW)).toBe(false);
    expect(thisWeekNewsItems([video], NOW)).toEqual([]);
  });

  it('is false for an unparseable date', () => {
    expect(isThisWeekNews(currentItem({ id: 'x', observedOn: 'soon' }), NOW)).toBe(false);
  });
});

describe('streamExtraEntries', () => {
  const live = currentFeedEntries(
    [
      currentItem({ id: 'new', observedOn: '2026-11-02' }),
      currentItem({ id: 'older', observedOn: '2026-10-01' }),
    ],
    '2026-01-01',
    '2026-12-31',
  );
  const egg = { kind: 'egg' } as never;
  const thread = { kind: 'thread' } as never;

  it('drops egg doorways, keeps other doorways', () => {
    expect(streamExtraEntries([egg, thread], [], NOW)).toEqual([thread]);
  });

  it('drops live items inside the week window and keeps older ones in the stream', () => {
    const kept = streamExtraEntries([], live, NOW);
    expect(kept.map((e) => (e.kind === 'current' ? e.item.id : ''))).toEqual(['older']);
  });
});
