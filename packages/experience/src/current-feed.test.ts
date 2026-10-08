import { describe, expect, it } from 'vitest';
import type { CurrentItem, LiveTheory } from '@swift2/shared';
import {
  currentFeedEntries,
  isBigTheory,
  isLiveCountdown,
  outletFor,
  pickBannerCandidate,
  pickCountdownBannerItem,
  summarizeCurrentActivity,
} from './current-feed';

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
    expect(entry!.kind).toBe('current');
    expect(entry!.anchor).toEqual({ sortDate: '2026-08-20', displayDate: '2026-08-20', via: 'exact' });
  });

  it('carries the item through unmodified', () => {
    const items = [currentItem({ id: 'ci1', observedOn: '2026-08-20', headline: 'Seen at rehearsal' })];
    const [entry] = currentFeedEntries(items, ERA_START, ERA_END);
    expect(entry!.kind === 'current' ? entry!.item.headline : null).toBe('Seen at rehearsal');
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

describe('isLiveCountdown', () => {
  const NOW = Date.parse('2026-09-22T18:00:00.000Z');

  it('is false when countdownTargetAt is unset', () => {
    const item = currentItem({ id: 'ci1', observedOn: '2026-09-22' });
    expect(isLiveCountdown(item, NOW)).toBe(false);
  });

  it('is true when the target is in the future', () => {
    const item = currentItem({
      id: 'ci1',
      observedOn: '2026-09-22',
      countdownTargetAt: '2026-09-22T20:00:00.000Z',
    });
    expect(isLiveCountdown(item, NOW)).toBe(true);
  });

  it('is false once countdownResolvedAt is set, even if the target is future', () => {
    const item = currentItem({
      id: 'ci1',
      observedOn: '2026-09-22',
      countdownTargetAt: '2026-09-22T20:00:00.000Z',
      countdownResolvedAt: '2026-09-22T17:00:00.000Z',
    });
    expect(isLiveCountdown(item, NOW)).toBe(false);
  });

  it('stays true briefly past the target, within the grace window', () => {
    const item = currentItem({
      id: 'ci1',
      observedOn: '2026-09-22',
      countdownTargetAt: '2026-09-22T17:55:00.000Z', // 5 minutes ago
    });
    expect(isLiveCountdown(item, NOW)).toBe(true); // default grace is 15 minutes
  });

  it('goes false once past the grace window', () => {
    const item = currentItem({
      id: 'ci1',
      observedOn: '2026-09-22',
      countdownTargetAt: '2026-09-22T17:00:00.000Z', // 1 hour ago
    });
    expect(isLiveCountdown(item, NOW)).toBe(false);
  });

  it('is false for an unparseable countdownTargetAt', () => {
    const item = currentItem({
      id: 'ci1',
      observedOn: '2026-09-22',
      countdownTargetAt: 'not-a-date',
    });
    expect(isLiveCountdown(item, NOW)).toBe(false);
  });
});

describe('pickCountdownBannerItem', () => {
  const NOW = Date.parse('2026-09-22T18:00:00.000Z');

  it('is undefined when nothing qualifies', () => {
    const items = [currentItem({ id: 'ci1', observedOn: '2026-09-22' })];
    expect(pickCountdownBannerItem(items, NOW)).toBeUndefined();
  });

  it('picks the single live countdown', () => {
    const items = [
      currentItem({ id: 'ci1', observedOn: '2026-09-22', countdownTargetAt: '2026-09-22T20:00:00.000Z' }),
    ];
    expect(pickCountdownBannerItem(items, NOW)?.id).toBe('ci1');
  });

  it('NEVER STACKS: picks exactly one item, the SOONEST deadline, when two countdowns overlap', () => {
    const items = [
      currentItem({ id: 'ci-later', observedOn: '2026-09-22', countdownTargetAt: '2026-09-23T00:00:00.000Z' }),
      currentItem({ id: 'ci-sooner', observedOn: '2026-09-22', countdownTargetAt: '2026-09-22T19:00:00.000Z' }),
    ];
    const winner = pickCountdownBannerItem(items, NOW);
    expect(winner?.id).toBe('ci-sooner');
  });

  it('NEVER DEADLOCKS: breaks an exact tie on the stable id, deterministically', () => {
    const sameTarget = '2026-09-22T20:00:00.000Z';
    const itemsAsc = [
      currentItem({ id: 'ci-b', observedOn: '2026-09-22', countdownTargetAt: sameTarget }),
      currentItem({ id: 'ci-a', observedOn: '2026-09-22', countdownTargetAt: sameTarget }),
    ];
    const itemsReversed = [...itemsAsc].reverse();
    // Same winner regardless of input order — id 'ci-a' sorts first.
    expect(pickCountdownBannerItem(itemsAsc, NOW)?.id).toBe('ci-a');
    expect(pickCountdownBannerItem(itemsReversed, NOW)?.id).toBe('ci-a');
  });

  it('ignores a resolved countdown even if its target is still in the future', () => {
    const items = [
      currentItem({
        id: 'ci-resolved',
        observedOn: '2026-09-22',
        countdownTargetAt: '2026-09-22T20:00:00.000Z',
        countdownResolvedAt: '2026-09-22T17:00:00.000Z',
      }),
      currentItem({ id: 'ci-live', observedOn: '2026-09-22', countdownTargetAt: '2026-09-23T00:00:00.000Z' }),
    ];
    expect(pickCountdownBannerItem(items, NOW)?.id).toBe('ci-live');
  });
});

const liveTheory = (overrides: Partial<LiveTheory> & { id: string }): LiveTheory => ({
  name: 'Fans think the vault track is a duet',
  claim: 'A specific claim the fandom is theorizing about.',
  firstSeenOn: '2026-09-20',
  lastSeenOn: '2026-09-22',
  origin: 'fan',
  status: 'rumor',
  outcome: 'pending',
  evidenceIds: [],
  symbols: [],
  heat: 1,
  expiresAt: '2026-12-31T00:00:00.000Z',
  ...overrides,
});

describe('isBigTheory', () => {
  it('is false below the heat threshold', () => {
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 2.9 }))).toBe(false);
  });

  it('is true at or above the heat threshold with a live status', () => {
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 3 }))).toBe(true);
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 3, status: 'reported' }))).toBe(true);
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 3, status: 'confirmed' }))).toBe(true);
  });

  it('is false once debunked or faded, however high the heat', () => {
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 100, status: 'debunked' }))).toBe(false);
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 100, status: 'faded' }))).toBe(false);
  });

  it('accepts a custom heat threshold override', () => {
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 5 }), 10)).toBe(false);
    expect(isBigTheory(liveTheory({ id: 'lt1', heat: 10 }), 10)).toBe(true);
  });
});

describe('pickBannerCandidate', () => {
  const NOW = Date.parse('2026-09-22T18:00:00.000Z');

  it('is undefined when neither a countdown nor a big theory qualifies', () => {
    const items = [currentItem({ id: 'ci1', observedOn: '2026-09-22' })];
    const theories = [liveTheory({ id: 'lt1', heat: 1 })];
    expect(pickBannerCandidate(items, theories, NOW)).toBeUndefined();
  });

  it('picks the big theory when no countdown is live', () => {
    const items = [currentItem({ id: 'ci1', observedOn: '2026-09-22' })];
    const theories = [liveTheory({ id: 'lt1', heat: 5 })];
    const candidate = pickBannerCandidate(items, theories, NOW);
    expect(candidate).toEqual({ kind: 'theory', theory: theories[0] });
  });

  it('a live countdown ALWAYS wins the slot over a big theory (deadline-driven beats non-deadline)', () => {
    const items = [
      currentItem({ id: 'ci1', observedOn: '2026-09-22', countdownTargetAt: '2026-09-22T20:00:00.000Z' }),
    ];
    const theories = [liveTheory({ id: 'lt1', heat: 999 })];
    const candidate = pickBannerCandidate(items, theories, NOW);
    expect(candidate).toEqual({ kind: 'countdown', item: items[0] });
  });

  it('NEVER STACKS: among multiple big theories, picks exactly one — the hottest', () => {
    const theories = [
      liveTheory({ id: 'lt-cooler', heat: 4 }),
      liveTheory({ id: 'lt-hotter', heat: 9 }),
    ];
    const candidate = pickBannerCandidate([], theories, NOW);
    expect(candidate?.kind).toBe('theory');
    expect(candidate?.kind === 'theory' ? candidate.theory.id : null).toBe('lt-hotter');
  });

  it('NEVER DEADLOCKS: breaks an exact heat tie on the stable theory id, deterministically', () => {
    const theoriesAsc = [liveTheory({ id: 'lt-b', heat: 5 }), liveTheory({ id: 'lt-a', heat: 5 })];
    const theoriesReversed = [...theoriesAsc].reverse();
    const winnerAsc = pickBannerCandidate([], theoriesAsc, NOW);
    const winnerReversed = pickBannerCandidate([], theoriesReversed, NOW);
    expect(winnerAsc?.kind === 'theory' ? winnerAsc.theory.id : null).toBe('lt-a');
    expect(winnerReversed?.kind === 'theory' ? winnerReversed.theory.id : null).toBe('lt-a');
  });

  it('never picks a debunked/faded theory even at very high heat', () => {
    const theories = [liveTheory({ id: 'lt1', heat: 999, status: 'debunked' })];
    expect(pickBannerCandidate([], theories, NOW)).toBeUndefined();
  });
});
