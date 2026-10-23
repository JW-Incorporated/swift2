import { describe, expect, it } from 'vitest';
import { gnewsResolutionWarning, type NewsRunStats } from './run-stats';

const stats = (resolved: number, unresolved: number): NewsRunStats => ({
  gnewsResolved: resolved,
  gnewsUnresolved: unresolved,
  imageResolved: 0,
  imageGnewsUnresolved: 0,
  imageFetchFailed: 0,
  imageNoOg: 0,
  imageHostNotAllowlisted: 0,
});

describe('gnewsResolutionWarning', () => {
  it('warns when more than half of >=5 attempts failed', () => {
    expect(gnewsResolutionWarning(stats(2, 4))).toMatch(/4\/6 Google News/);
  });
  it('stays quiet under 5 attempts or at/below 50% failures', () => {
    expect(gnewsResolutionWarning(stats(0, 4))).toBeNull();
    expect(gnewsResolutionWarning(stats(3, 3))).toBeNull();
  });
});
