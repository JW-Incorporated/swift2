import { describe, expect, it } from 'vitest';
import { getAdapter, PRIMARY_SOURCES } from './registry';

describe('primary source registry', () => {
  it('contains the six keyless fast-lane sources and no GNews calls', () => {
    expect(PRIMARY_SOURCES.map((source) => source.name)).toEqual([
      'Taylor Swift — official YouTube channel',
      'Taylor Swift — official site',
      'Taylor Swift — official store',
      'Google News — "Taylor Swift" search',
      'Republic Records — press feed',
      'Universal Music Group — press feed',
    ]);
    expect(PRIMARY_SOURCES.map((source) => source.sourceType)).not.toContain('gnews');
  });

  it('has an adapter for every primary source and leaves GDELT unregistered', () => {
    for (const source of PRIMARY_SOURCES) expect(getAdapter(source.sourceType)).toBeDefined();
    expect(getAdapter('gdelt')).toBeUndefined();
  });
});
