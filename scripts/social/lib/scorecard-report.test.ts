import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPerformanceReport,
  familyOf,
  isoWeekWindow,
  renderPerformanceReport,
  summarizeReasons,
  // @ts-expect-error — plain .mjs module, no type declarations
} from './scorecard-report.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { runScorecard } from '../weekly-scorecard.mjs';

const WEEK = isoWeekWindow('2026-W40'); // Mon 2026-09-28 .. Mon 2026-10-05
let seq = 0;
const draft = (action: string, pillar: string, reason: string | null, ts = '2026-09-30T10:00:00Z') => {
  seq += 1;
  return { ts, file: `social/queue/draft-${seq}.json`, action, campaign: `${pillar}:2026-09`, pillar, reason, critiqueTotal: 20 };
};

describe('isoWeekWindow', () => {
  it('maps an ISO week label to its Monday-to-Monday UTC window', () => {
    expect(new Date(WEEK.startMs).toISOString()).toBe('2026-09-28T00:00:00.000Z');
    expect(new Date(WEEK.endMs).toISOString()).toBe('2026-10-05T00:00:00.000Z');
    expect(new Date(isoWeekWindow('2026-W01').startMs).toISOString()).toBe('2025-12-29T00:00:00.000Z');
  });
  it('rejects a malformed label', () => {
    expect(() => isoWeekWindow('2026-40')).toThrow(/bad --week/);
    expect(() => isoWeekWindow('2026-W54')).toThrow(/bad --week/);
  });
});

describe('familyOf / summarizeReasons', () => {
  it('uses the first campaign segment when it is a known family, else (unrecognized)', () => {
    expect(familyOf('thread:fashion:quiz')).toBe('thread');
    expect(familyOf('era-deep-cut:x')).toBe('(unrecognized)');
    expect(familyOf(undefined)).toBe('(unrecognized)');
  });
  it('groups reasons case-insensitively and counts "none given" separately', () => {
    expect(summarizeReasons(['Repeat photos', 'repeat PHOTOS ', 'none given', null, 'too long'])).toEqual({
      top: [{ reason: 'Repeat photos', count: 2 }, { reason: 'too long', count: 1 }],
      noneGiven: 2,
    });
  });
});

describe('buildPerformanceReport', () => {
  const quiz = 'thread:love-story:quiz-poll';
  const posted = [
    { platform: 'instagram', postedAt: '2026-09-29T12:00:00Z', campaign: `${quiz}:2026-09` },
    { platform: 'x', postedAt: '2026-09-30T12:00:00Z', campaign: `${quiz}:2026-09` },
    { platform: 'instagram', postedAt: '2026-09-20T12:00:00Z', campaign: `${quiz}:2026-09` }, // outside window
    { platform: 'instagram', postedAt: '2026-10-01T12:00:00Z', campaign: 'mood:chip-poll' },
  ];
  const postMetrics = [
    { postedAt: '2026-09-29T12:00:00Z', campaign: `${quiz}:2026-09`, like_count: 10, comments_count: 2, reach: 400, saved: 9, shares: 3 },
    { postedAt: '2026-10-01T12:00:00Z', campaign: 'mood:chip-poll', like_count: 1, comments_count: 0, reach: null, saved: null, shares: null },
  ];
  const ledgerRows = [
    draft('approve', quiz, null),
    draft('approve', quiz, null, '2026-09-30T11:00:00Z'),
    draft('reject', quiz, 'repeat photos', '2026-09-30T12:00:00Z'),
    draft('edit', 'mood:chip-poll', 'shorter', '2026-10-01T09:00:00Z'),
    draft('reject', 'mood:chip-poll', 'none given', '2026-10-01T10:00:00Z'),
    draft('reject', 'mood:chip-poll', 'old', '2026-09-01T10:00:00Z'), // outside window
    { ts: '2026-09-30T10:00:00Z', file: 'reddit:abc', action: 'approve', campaign: null },
  ];
  const report = buildPerformanceReport({ posted, postMetrics, ledgerRows, window: WEEK });

  it('counts posts, insights and approval rate per format, in the window only', () => {
    expect(report.byFormat.thread).toMatchObject({ posts: 2, measuredPosts: 1, reach: 400, saved: 9, shares: 3, likes: 10, comments: 2, approve: 2, reject: 1, verdicts: 3, approvalRate: 67 });
    expect(report.byFormat.mood).toMatchObject({ posts: 1, reach: null, saved: null, shares: null, approve: 0, edit: 1, reject: 1, approvalRate: 0 });
  });
  it('buckets per campaign (pillar) and ignores non-draft ledger rows', () => {
    expect(Object.keys(report.byCampaign).sort()).toEqual(['mood:chip-poll', quiz]);
    expect(report.byCampaign[quiz].approvalRate).toBe(67);
    expect(report.overall).toMatchObject({ posts: 3, verdicts: 5, approve: 2, edit: 1, reject: 2, approvalRate: 40 });
  });
  it('summarizes rejection/edit reasons for the window, none-given separate', () => {
    expect(report.overall.rejectionReasons).toEqual({ top: [{ reason: 'repeat photos', count: 1 }, { reason: 'shorter', count: 1 }], noneGiven: 1 });
  });
  it('renders n/a (never 0) for a post with no insights', () => {
    const text = renderPerformanceReport(report);
    expect(text).toContain('thread | 2 | 400 | 9 | 3 | 10/2 | 67% (2/3)');
    expect(text).toContain('mood | 1 | n/a | n/a | n/a | 1/0 | 0% (0/2)');
    expect(text).toContain('Rejection/edit reasons: "repeat photos" x1; "shorter" x1; no reason given x1');
  });
  it('is honest about an empty window', () => {
    const text = renderPerformanceReport(buildPerformanceReport({ posted: [], postMetrics: [], ledgerRows: [], window: WEEK }));
    expect(text).toContain('(no activity this window)');
    expect(text).toContain('Rejection/edit reasons: none this window');
  });
});

describe('weekly-scorecard CLI (issue #4297)', () => {
  let root: string;
  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  function fixture() {
    root = mkdtempSync(path.join(tmpdir(), 'scorecard-'));
    const dirs = {
      postedDir: path.join(root, 'posted'),
      failedDir: path.join(root, 'failed'),
      metricsDir: path.join(root, 'metrics'),
      feedbackDir: path.join(root, 'feedback'),
      postsMetricsDir: path.join(root, 'metrics', 'posts'),
    };
    for (const d of [dirs.postedDir, dirs.failedDir, dirs.metricsDir, dirs.feedbackDir, path.join(dirs.postsMetricsDir, '2026-09')]) mkdirSync(d, { recursive: true });
    const campaign = 'thread:love-story:quiz-poll:2026-09';
    writeFileSync(path.join(dirs.postedDir, 'a.json'), JSON.stringify({ platform: 'instagram', postedAt: '2026-09-29T12:00:00Z', campaign, platformPostId: '1' }));
    writeFileSync(path.join(dirs.postsMetricsDir, '2026-09', '1.json'), JSON.stringify({ postId: '1', platform: 'instagram', campaign, postedAt: '2026-09-29T12:00:00Z', like_count: 5, comments_count: 1, reach: 300, saved: 8, shares: 2 }));
    const rows = [draft('approve', 'thread:love-story:quiz-poll', null), draft('reject', 'thread:love-story:quiz-poll', 'repeat photos', '2026-09-30T12:00:00Z')];
    writeFileSync(path.join(dirs.feedbackDir, '2026-W40.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
    return dirs;
  }

  it('runScorecard returns the scorecard and the per-format report for the requested week', () => {
    const { card, performance } = runScorecard({ week: '2026-W40', dirs: fixture() });
    expect(card.posts.instagram).toBe(1);
    expect(performance.window.label).toBe('2026-W40');
    expect(performance.byFormat.thread).toMatchObject({ posts: 1, reach: 300, saved: 8, shares: 2, approvalRate: 50 });
    expect(performance.calibration).toMatchObject({ verdict: 'insufficient' });
  });

  it('the real entry point prints a table, supports --json, and rejects a bad --week', () => {
    const script = path.resolve(__dirname, '..', 'weekly-scorecard.mjs');
    const run = (args: string[]) => execFileSync('node', [script, ...args], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    const text = run(['--week', '2026-W40']);
    expect(text).toContain('**Posts this week:**');
    expect(text).toContain('By format');
    expect(text).toContain('founder approval');
    const json = JSON.parse(run(['--week', '2026-W40', '--json']));
    expect(json.performance.window.label).toBe('2026-W40');
    expect(json.scorecard.posts).toBeDefined();
    expect(() => run(['--week', 'bogus'])).toThrow();
  });
});
