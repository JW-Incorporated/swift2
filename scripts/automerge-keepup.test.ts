import { describe, expect, it } from 'vitest';
import { PARKED_LABELS, isRefreshCandidate, selectRefreshCandidates } from './automerge-keepup.mjs';

const basePr = (over = {}) => ({
  number: 1,
  headRefName: 'vault/2026-09-06',
  baseRefName: 'main',
  isDraft: false,
  mergeStateStatus: 'BEHIND',
  labels: [],
  author: { login: 'sffan15-sys' },
  createdAt: '2026-09-06T00:00:00Z',
  ...over,
});

describe('isRefreshCandidate', () => {
  it('accepts a clean content-lane PR that is behind main', () => {
    expect(isRefreshCandidate(basePr())).toBe(true);
  });

  it('rejects a draft PR', () => {
    expect(isRefreshCandidate(basePr({ isDraft: true }))).toBe(false);
  });

  it('rejects a PR not targeting main', () => {
    expect(isRefreshCandidate(basePr({ baseRefName: 'release' }))).toBe(false);
  });

  it('rejects a PR that is not behind (already fresh, or in conflict)', () => {
    expect(isRefreshCandidate(basePr({ mergeStateStatus: 'CLEAN' }))).toBe(false);
    expect(isRefreshCandidate(basePr({ mergeStateStatus: 'DIRTY' }))).toBe(false);
  });

  it('rejects every parked label', () => {
    for (const label of PARKED_LABELS) {
      expect(isRefreshCandidate(basePr({ labels: [{ name: label }] }))).toBe(false);
      // string-shaped labels (some gh outputs) are also honoured
      expect(isRefreshCandidate(basePr({ labels: [label] }))).toBe(false);
    }
  });

  it('rejects a branch/author that does not pass the content-lane gate', () => {
    expect(isRefreshCandidate(basePr({ headRefName: 'feature/looks-like-content' }))).toBe(false);
    expect(isRefreshCandidate(basePr({ author: { login: 'some-random-user' } }))).toBe(false);
  });
});

describe('selectRefreshCandidates', () => {
  it('returns only eligible PRs, oldest first', () => {
    const prs = [
      basePr({ number: 3, createdAt: '2026-09-06T12:00:00Z' }),
      basePr({ number: 1, createdAt: '2026-09-04T00:00:00Z' }),
      basePr({ number: 2, isDraft: true, createdAt: '2026-09-05T00:00:00Z' }), // excluded
    ];
    expect(selectRefreshCandidates(prs)).toEqual([
      { number: 1, headRefName: 'vault/2026-09-06' },
      { number: 3, headRefName: 'vault/2026-09-06' },
    ]);
  });

  it('bounds the result to maxCount', () => {
    const prs = Array.from({ length: 20 }, (_, i) =>
      basePr({ number: i, createdAt: `2026-09-06T00:${String(i).padStart(2, '0')}:00Z` }),
    );
    expect(selectRefreshCandidates(prs, { maxCount: 5 })).toHaveLength(5);
  });

  it('defaults maxCount to 8', () => {
    const prs = Array.from({ length: 20 }, (_, i) =>
      basePr({ number: i, createdAt: `2026-09-06T00:${String(i).padStart(2, '0')}:00Z` }),
    );
    expect(selectRefreshCandidates(prs)).toHaveLength(8);
  });

  it('handles an empty/missing list', () => {
    expect(selectRefreshCandidates([])).toEqual([]);
    expect(selectRefreshCandidates(undefined)).toEqual([]);
  });
});
