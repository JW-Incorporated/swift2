import { describe, expect, it } from 'vitest';
import {
  FOUNDER_TASK_LABEL,
  MAILED_LABEL,
  buildDigest,
  isTreeWeekly,
  needsMail,
} from './build-founder-digest.mjs';

// The builder is plain `.mjs`; mirror its issue shape so the contract the
// tests rely on is explicit (same convention as check-work-ownership.test.ts).
type Issue = {
  number: number;
  title: string;
  body?: string;
  url: string;
  labels?: { name: string }[];
};

const REPO = 'JW-Incorporated/swift2';

const issue = (n: number, title: string, extra: Partial<Issue> = {}): Issue => ({
  number: n,
  title,
  body: `body of #${n}`,
  url: `https://github.com/${REPO}/issues/${n}`,
  labels: [{ name: FOUNDER_TASK_LABEL }],
  ...extra,
});

describe('needsMail', () => {
  it('wants a founder-task issue that has not been mailed', () => {
    expect(needsMail(issue(1, 'x'))).toBe(true);
  });

  it('skips an issue already marked founder-mailed', () => {
    expect(
      needsMail(issue(1, 'x', { labels: [{ name: FOUNDER_TASK_LABEL }, { name: MAILED_LABEL }] })),
    ).toBe(false);
  });

  it('skips an issue without the founder-task label at all', () => {
    expect(needsMail(issue(1, 'x', { labels: [{ name: 'content' }] }))).toBe(false);
  });
});

describe('isTreeWeekly', () => {
  it('recognises the charter title convention, case-insensitively', () => {
    expect(isTreeWeekly(issue(1, 'founder-task: social reach week of 2026-08-13'))).toBe(true);
    expect(isTreeWeekly(issue(1, 'Founder-task: Social Reach week of 2026-08-13'))).toBe(true);
  });

  it('does not attribute anything else to Tree', () => {
    expect(isTreeWeekly(issue(1, 'J3.5 gate: Midnights + TTPD timeline depth'))).toBe(false);
  });
});

describe('buildDigest', () => {
  it('returns null when there is nothing to mail', () => {
    expect(buildDigest([], REPO)).toBeNull();
    expect(
      buildDigest(
        [issue(1, 'x', { labels: [{ name: FOUNDER_TASK_LABEL }, { name: MAILED_LABEL }] })],
        REPO,
      ),
    ).toBeNull();
  });

  it('gives a single non-Tree issue a neutral subject and its own url', () => {
    const d = buildDigest([issue(1955, 'J3.5 gate: unblock path')], REPO);
    expect(d?.payload.subject).toBe('Founder action needed: J3.5 gate: unblock path');
    expect(d?.payload.url).toBe(`https://github.com/${REPO}/issues/1955`);
    expect(d?.numbers).toEqual([1955]);
  });

  it("gives Tree's own weekly issue a Tree subject", () => {
    const d = buildDigest([issue(7, 'founder-task: social reach week of 2026-08-13')], REPO);
    expect(d?.payload.subject).toBe(
      'Tree needs ~15 min of founder time: founder-task: social reach week of 2026-08-13',
    );
  });

  it('batches a burst into ONE payload — the 2026-08-11 four-email incident', () => {
    const burst = [
      issue(1958, 'J3.5b: reputation + fearless'),
      issue(1955, 'J3.5 gate: BLOCKED'),
      issue(1957, 'CLEAN NOW: theories'),
      issue(1956, 'CLEAN NOW: track guide'),
    ];
    const d = buildDigest(burst, REPO);
    expect(d?.payload.subject).toBe('Founder action needed: 4 tasks waiting');
    // Ordered, every issue present exactly once, with title, url, and body.
    expect(d?.numbers).toEqual([1955, 1956, 1957, 1958]);
    for (const i of burst) {
      expect(d?.payload.body).toContain(`## ${i.title}`);
      expect(d?.payload.body).toContain(i.url);
      expect(d?.payload.body).toContain(`body of #${i.number}`);
    }
    // A Tree issue inside a burst never claims the subject line.
    expect(d?.payload.subject).not.toContain('Tree');
    // Multi-issue url points at the open founder-task list, not one issue.
    expect(d?.payload.url).toContain('label%3Afounder-task');
  });

  it('mixes mailed and unmailed correctly: only the unmailed one goes out', () => {
    const d = buildDigest(
      [
        issue(10, 'already mailed', {
          labels: [{ name: FOUNDER_TASK_LABEL }, { name: MAILED_LABEL }],
        }),
        issue(11, 'fresh task'),
      ],
      REPO,
    );
    expect(d?.numbers).toEqual([11]);
    expect(d?.payload.subject).toBe('Founder action needed: fresh task');
  });

  it('survives a missing body', () => {
    const d = buildDigest([issue(12, 'no body', { body: undefined })], REPO);
    expect(d?.payload.body).toContain('(no issue body)');
  });
});
