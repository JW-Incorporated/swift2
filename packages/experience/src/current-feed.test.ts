import { describe, expect, it } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { currentFeedEntries, outletFor, summarizeCurrentActivity } from './current-feed';

const ERA_START = '2026-01-01';
const ERA_END = '2026-12-31';

const currentItem = (overrides: Partial<CurrentItem> & { id: string; observedOn: string }): CurrentItem => ({
  eraId: 'tloas',
  category: 'sighting',
  tags: ['Lore'],
  headline: 'Something happened',
  summary: 'A short summary.',
  detail: 'A little more detail.',
  status: 'reported',
  confidence: 'reputable_reporting',
  sourceTier: 'established',
  sources: [{ name: 'People', url: 'https://people.com/x', tier: 'established' }],
  symbols: [],
  entities: [],
  heat: 1,
  lastCheckedOn: overrides.observedOn,
  expiresAt: '2026-12-31T00:00:00.000Z',
  updatedAt: '2026-08-23T12:00:00.000Z',
  redlineOk: true,
  ...overrides,
});

describe('currentFeedEntries', () => {
  it('anchors every entry exactly on observedOn (never era-scattered)', () => {
    const items = [currentItem({ id: 'ci1', observedOn: '2026-08-20' })];
    const [entry] = currentFeedEntries(items, ERA_START, ERA_END);
    expect(entry.kind).toBe('current');
    expect(entry.anchor).toEqual({ sortDate: '2026-08-20', displayDate: '2026-08-20', via: 'exact' });
  });

  it('carries the item through unmodified', () => {
    const items = [currentItem({ id: 'ci1', observedOn: '2026-08-20', headline: 'Seen at rehearsal' })];
    const [entry] = currentFeedEntries(items, ERA_START, ERA_END);
    expect(entry.kind === 'current' ? entry.item.headline : null).toBe('Seen at rehearsal');
  });

  it('is empty for an empty input', () => {
    expect(currentFeedEntries([], ERA_START, ERA_END)).toEqual([]);
  });
});

describe('outletFor', () => {
  it('reads the first source’s name', () => {
    const item = currentItem({
      id: 'ci1',
      observedOn: '2026-08-20',
      sources: [
        { name: 'People', url: 'https://people.com/x', tier: 'established' },
        { name: 'ET', url: 'https://et.com/y', tier: 'established' },
      ],
    });
    expect(outletFor(item)).toBe('People');
  });

  it('is undefined with no sources', () => {
    expect(outletFor(currentItem({ id: 'ci1', observedOn: '2026-08-20', sources: [] }))).toBeUndefined();
  });
});

describe('summarizeCurrentActivity', () => {
  const NOW = Date.parse('2026-08-23T18:00:00.000Z');

  it('is null with no items', () => {
    expect(summarizeCurrentActivity([], NOW)).toBeNull();
  });

  it('reports the most recent updatedAt and a count of rows observed in the last 7 days', () => {
    const items = [
      currentItem({ id: 'ci1', observedOn: '2026-08-23', updatedAt: '2026-08-23T15:00:00.000Z' }), // 3h ago, this week
      currentItem({ id: 'ci2', observedOn: '2026-08-20', updatedAt: '2026-08-20T00:00:00.000Z' }), // this week
      currentItem({ id: 'ci3', observedOn: '2026-07-01', updatedAt: '2026-07-01T00:00:00.000Z' }), // not this week
    ];
    const summary = summarizeCurrentActivity(items, NOW);
    expect(summary).not.toBeNull();
    expect(summary?.updatedLabel).toBe('3 hours ago');
    expect(summary?.newThisWeek).toBe(2);
  });
});
