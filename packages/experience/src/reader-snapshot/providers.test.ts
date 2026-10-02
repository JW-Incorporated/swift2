import { describe, expect, it } from 'vitest';
import { getContentItemLookup, setContentItemLookup } from '../content-item-provider';
import {
  getEraSecretsRawProvider,
  getSongTargetResolver,
  getTheoriesRawProvider,
  getThreadContentProvider,
  setEraSecretsRawProvider,
  setSongTargetResolver,
  setTheoriesRawProvider,
  setThreadContentProvider,
} from '../thread-content-provider';
import { withProviders } from './build';
import type { ReaderSnapshotInputs } from './types';

const inputs = {
  eras: [],
  content: [],
  milestones: [],
  tracks: {},
  theories: {},
  videos: {},
  eraSecrets: {},
  songMoods: [],
} as unknown as ReaderSnapshotInputs;

const refs = () => [
  getContentItemLookup(),
  getThreadContentProvider(),
  getTheoriesRawProvider(),
  getEraSecretsRawProvider(),
  getSongTargetResolver(),
];

describe('withProviders', () => {
  it('restores the original provider function references, not data', () => {
    let calls = 0;
    const counter = () => {
      calls += 1;
      return [];
    };
    setThreadContentProvider(counter);
    setTheoriesRawProvider(() => ({}));
    setEraSecretsRawProvider(() => ({}));
    setSongTargetResolver(() => null);
    setContentItemLookup(() => undefined);
    const before = refs();

    withProviders(inputs, () => 1);

    refs().forEach((r, i) => expect(r).toBe(before[i]));
    expect(getThreadContentProvider()).toBe(counter);
    getThreadContentProvider()();
    expect(calls).toBe(1);
    getThreadContentProvider()();
    expect(calls).toBe(2);
  });

  it('throws on an async callback and still restores the providers', () => {
    const before = refs();
    const run = () => withProviders(inputs, (() => Promise.resolve(1)) as never);
    expect(run).toThrow(/synchronous/);
    refs().forEach((r, i) => expect(r).toBe(before[i]));
  });
});
