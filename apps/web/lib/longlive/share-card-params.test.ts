import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter, emptyProgress, readStoredProgress } from '@swift2/experience';
import {
  COUNT_BUCKETS,
  bucketCount,
  bucketLabel,
  hasShareableProgress,
  parseBucketParam,
  parseShareCardSize,
  shareCardPath,
  summarizeProgress,
} from './share-card-params';

describe('bucketCount', () => {
  it('rounds down to a fixed bucket and never exceeds the top one', () => {
    expect(bucketCount(0)).toBe(0);
    expect(bucketCount(2)).toBe(1);
    expect(bucketCount(37)).toBe(25);
    expect(bucketCount(10 ** 9)).toBe(COUNT_BUCKETS[COUNT_BUCKETS.length - 1]);
  });

  it('is idempotent and treats junk as zero', () => {
    for (const n of [0, 1, 4, 9, 99, 777]) expect(bucketCount(bucketCount(n))).toBe(bucketCount(n));
    for (const n of [-5, NaN, Infinity]) expect(bucketCount(n)).toBe(0);
  });

  it('parses query values strictly', () => {
    expect(parseBucketParam('37')).toBe(25);
    for (const raw of [null, undefined, '', 'abc', '-3', '1e9', '3.5', '99999999']) {
      expect(parseBucketParam(raw), String(raw)).toBe(0);
    }
  });

  it('labels buckets for the card', () => {
    expect(bucketLabel(0)).toBe('0');
    expect(bucketLabel(1)).toBe('1');
    expect(bucketLabel(25)).toBe('25+');
  });
});

describe('shareCardPath', () => {
  it('builds each card URL with bucketed counts and the size', () => {
    expect(shareCardPath({ item: 'a b' }, 'story')).toBe('/api/share-card?item=a+b&size=story');
    expect(shareCardPath({ era: 'red' }, 'portrait')).toBe('/api/share-card?era=red&size=portrait');
    expect(
      shareCardPath(
        { eras: ['red', 'lover', '1989', 'debut'], moments: 37, eggs: 4, favorites: 0 },
        'portrait',
      ),
    ).toBe('/api/share-card?eras=red%2Clover%2C1989&m=25&e=3&f=0&size=portrait');
  });

  it('falls back to a bare sized URL when there is no source', () => {
    expect(shareCardPath({}, 'story')).toBe('/api/share-card?size=story');
  });
});

describe('parseShareCardSize', () => {
  it('only accepts story, everything else is portrait', () => {
    expect(parseShareCardSize('story')).toBe('story');
    for (const raw of [null, undefined, '', 'portrait', 'STORY', 'huge']) {
      expect(parseShareCardSize(raw)).toBe('portrait');
    }
  });
});

describe('summarizeProgress', () => {
  const lookups = {
    itemEra: (id: string) =>
      ({ m1: 'red', m2: 'red', m3: 'lover', m4: 'debut', f1: 'lover' })[id] as never,
    eggEra: (id: string) => ({ e1: 'red', e2: 'midnights' })[id] as never,
  };

  it('has nothing to share on empty progress', () => {
    expect(hasShareableProgress(emptyProgress())).toBe(false);
    expect(summarizeProgress(emptyProgress(), lookups).eras).toEqual([]);
  });

  it('ranks the top three eras by touches, newest era first on ties, and totals the counts', () => {
    const progress = {
      moments: new Set(['m1', 'm2', 'm3', 'm4', 'unknown']),
      eggs: new Set(['e1', 'e2']),
      trails: new Set<string>(),
      favorites: new Set(['f1']),
    };
    expect(hasShareableProgress(progress)).toBe(true);
    expect(summarizeProgress(progress, lookups)).toEqual({
      eras: ['red', 'lover', 'midnights'],
      moments: 5,
      eggs: 2,
      favorites: 1,
    });
  });

  it('reads the persisted ll-progress-v1 blob', () => {
    const storage = createMemoryStorageAdapter();
    storage.setItem(
      'll-progress-v1',
      JSON.stringify({ v: 1, moments: ['m1'], eggs: [], trails: [], favorites: [] }),
    );
    expect(summarizeProgress(readStoredProgress(storage), lookups).eras).toEqual(['red']);
  });
});
