import { describe, expect, it } from 'vitest';
import {
  OUTCOME,
  hasBlockingFailure,
  groupOutcomes,
  summarizeRun,
  formatReportMarkdown,
  formatAnnotations,
} from './run-report.mjs';

const failedX = {
  kind: OUTCOME.FAILED,
  file: '2026-08-04-mine-rush-release-x.json',
  platform: 'x',
  attempts: 3,
  error: 'X post failed (403): {"detail":"You are not permitted to perform this action."}',
};
const retryingX = {
  kind: OUTCOME.RETRYING,
  file: 'b-x.json',
  platform: 'x',
  attempts: 1,
  error: 'X post failed (429): rate limited',
};
const postedIg = {
  kind: OUTCOME.POSTED,
  file: 'c-ig.json',
  platform: 'instagram',
  url: 'https://instagram.com/p/1',
};
const skippedIg = {
  kind: OUTCOME.SKIPPED,
  file: 'd-ig.json',
  platform: 'instagram',
  error: 'generic era art',
};

describe('hasBlockingFailure', () => {
  it('is true when any item permanently failed', () => {
    expect(hasBlockingFailure([postedIg, failedX])).toBe(true);
  });

  it('is false for a clean run', () => {
    expect(hasBlockingFailure([postedIg])).toBe(false);
    expect(hasBlockingFailure([])).toBe(false);
  });

  it('is false for a mid-retry attempt — the item is still queued', () => {
    expect(hasBlockingFailure([retryingX])).toBe(false);
  });

  it('is false for a deliberately skipped item', () => {
    expect(hasBlockingFailure([skippedIg])).toBe(false);
  });
});

describe('groupOutcomes', () => {
  it('buckets by kind and ignores unknown kinds', () => {
    const groups = groupOutcomes([postedIg, failedX, retryingX, skippedIg, { kind: 'weird' }]);
    expect(groups.posted).toEqual([postedIg]);
    expect(groups.failed).toEqual([failedX]);
    expect(groups.retrying).toEqual([retryingX]);
    expect(groups.skipped).toEqual([skippedIg]);
  });
});

describe('summarizeRun', () => {
  it('reads "nothing due" for an empty run', () => {
    expect(summarizeRun([])).toBe('nothing due');
  });

  it('leads with successes then shouts about permanent failures', () => {
    expect(summarizeRun([postedIg, failedX, retryingX])).toBe(
      '1 posted (instagram 1) · 1 PERMANENTLY FAILED (x 1) · 1 retrying (x 1)',
    );
  });

  it('omits zero-count segments', () => {
    expect(summarizeRun([postedIg])).toBe('1 posted (instagram 1)');
  });

  it('breaks counts down per platform so a dark X is visible', () => {
    expect(
      summarizeRun([
        failedX,
        { ...failedX, file: 'e-x.json' },
        { ...failedX, file: 'f-ig.json', platform: 'instagram' },
      ]),
    ).toBe('3 PERMANENTLY FAILED (instagram 1, x 2)');
  });
});

describe('formatReportMarkdown', () => {
  it('puts the permanent failure above the successes, with the platform error text', () => {
    const md = formatReportMarkdown([postedIg, failedX]);
    expect(md.indexOf('⛔')).toBeLessThan(md.indexOf('✅'));
    expect(md).toContain('2026-08-04-mine-rush-release-x.json');
    expect(md).toContain('You are not permitted to perform this action.');
    expect(md).toContain('NOT published');
  });

  it('names the retry attempt number', () => {
    expect(formatReportMarkdown([retryingX])).toContain('attempt 1');
  });

  it('links the run when the Actions context is present', () => {
    expect(formatReportMarkdown([postedIg], { runUrl: 'https://example.test/run/1' })).toContain(
      'https://example.test/run/1',
    );
  });

  it('says so plainly when nothing was due', () => {
    expect(formatReportMarkdown([])).toContain('Nothing was due this run.');
  });
});

describe('formatAnnotations', () => {
  it('emits an ::error:: for a permanent failure so the run page shows it', () => {
    const [annotation] = formatAnnotations([failedX]);
    expect(annotation).toMatch(/^::error title=social-poster: x post permanently failed::/);
    expect(annotation).toContain('2026-08-04-mine-rush-release-x.json');
    expect(annotation).toContain('403');
  });

  it('emits only warnings for retries and skips', () => {
    expect(formatAnnotations([retryingX, skippedIg]).every((a) => a.startsWith('::warning'))).toBe(
      true,
    );
  });

  it('emits nothing for a clean run', () => {
    expect(formatAnnotations([postedIg])).toEqual([]);
  });
});
