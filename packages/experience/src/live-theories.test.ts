import { describe, expect, it } from 'vitest';
import type { FanSignal, LiveTheory } from '@swift2/shared';
import { fansAreSayingLine, matchFanSignal, sortByHeatDesc } from './live-theories';

const theory = (overrides: Partial<LiveTheory> & { id: string; heat: number }): LiveTheory => ({
  name: 'A theory',
  claim: 'Something is happening.',
  firstSeenOn: '2026-08-01',
  lastSeenOn: '2026-08-20',
  origin: 'fan',
  status: 'rumor',
  outcome: 'pending',
  evidenceIds: [],
  symbols: [],
  expiresAt: '2026-10-19T00:00:00.000Z',
  ...overrides,
});

const signal = (overrides: Partial<FanSignal> & { id: string; heat: number }): FanSignal => ({
  windowStart: '2026-08-19T00:00:00.000Z',
  windowEnd: '2026-08-20T00:00:00.000Z',
  platform: 'bluesky',
  community: 'swifties',
  topic: 'A theory',
  summary: 'a popular thread',
  volume: 42,
  stanceMix: {},
  symbols: [],
  theoryIds: [],
  currentItemIds: [],
  sampleUrls: [],
  expiresAt: '2026-09-19T00:00:00.000Z',
  redlineOk: true,
  ...overrides,
});

describe('sortByHeatDesc', () => {
  it('sorts hottest first', () => {
    const items = [theory({ id: 'a', heat: 1 }), theory({ id: 'b', heat: 9 }), theory({ id: 'c', heat: 5 })];
    expect(sortByHeatDesc(items).map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('is empty for an empty input', () => {
    expect(sortByHeatDesc<LiveTheory>([])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const items = [theory({ id: 'a', heat: 1 }), theory({ id: 'b', heat: 9 })];
    sortByHeatDesc(items);
    expect(items.map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('matchFanSignal', () => {
  it('prefers a signal that names the theory id', () => {
    const t = theory({ id: 't1', heat: 1, symbols: ['red'] });
    const signals = [
      signal({ id: 's1', heat: 2, symbols: ['red'] }),
      signal({ id: 's2', heat: 1, theoryIds: ['t1'] }),
    ];
    expect(matchFanSignal(t, signals)?.id).toBe('s2');
  });

  it('falls back to the highest-heat signal sharing a symbol', () => {
    const t = theory({ id: 't1', heat: 1, symbols: ['red', 'thirteen'] });
    const signals = [
      signal({ id: 's1', heat: 3, symbols: ['thirteen'] }),
      signal({ id: 's2', heat: 9, symbols: ['red'] }),
      signal({ id: 's3', heat: 5, symbols: ['unrelated'] }),
    ];
    expect(matchFanSignal(t, signals)?.id).toBe('s2');
  });

  it('is undefined when nothing matches', () => {
    const t = theory({ id: 't1', heat: 1, symbols: ['red'] });
    const signals = [signal({ id: 's1', heat: 9, symbols: ['unrelated'], theoryIds: ['other'] })];
    expect(matchFanSignal(t, signals)).toBeUndefined();
  });

  it('is undefined with no signals at all', () => {
    const t = theory({ id: 't1', heat: 1, symbols: ['red'] });
    expect(matchFanSignal(t, [])).toBeUndefined();
  });
});

describe('fansAreSayingLine', () => {
  it('prefixes the signal summary', () => {
    expect(fansAreSayingLine(signal({ id: 's1', heat: 1, summary: 'dozens of posts' }))).toBe(
      'Fans are saying: dozens of posts',
    );
  });
});
