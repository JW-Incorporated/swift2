import { describe, expect, it } from 'vitest';
import {
  classify,
  ownersOf,
  signatureOf,
  summarizeFailed,
  renderReport,
  PARKED_LABEL,
  MANUAL_A11Y_LABEL,
  TRIAGE_LABEL,
} from './unowned-sweep.mjs';

// These tests pin the ACTUAL fleet filters, not the ones we wish were running.
// If someone widens or narrows a scanner's queue, `ownersOf` has to move with
// it or the sweep quietly under-reports — which is the exact failure class this
// script exists to end.

const NOW = new Date('2026-08-11T00:00:00Z');
const issue = (over: Record<string, unknown> = {}) => ({
  number: 1,
  title: 'a ticket',
  createdAt: '2026-07-10T00:00:00Z',
  author: { login: 'sffan15-sys' },
  labels: [],
  ...over,
});

describe('ownersOf — the union of every scanner filter', () => {
  it('gives a zero-label Wyatt-authored issue NO owner (the 16-issue blind spot)', () => {
    expect(ownersOf(issue({ author: { login: 'wjduvall-cmd' }, labels: [] }))).toEqual([]);
  });

  it('DOES route a zero-label Joey-authored issue to Kevin S3 (author fence lets it through)', () => {
    expect(ownersOf(issue({ author: { login: 'sffan15-sys' } }))).toContain(
      'Kevin S3 triage (author-independent)',
    );
  });

  it(`${TRIAGE_LABEL} overrides the author fence — this is what closes the hole`, () => {
    const owners = ownersOf(
      issue({ author: { login: 'wjduvall-cmd' }, labels: [{ name: TRIAGE_LABEL }] }),
    );
    expect(owners).toContain('Kevin S3 triage (author-independent)');
  });

  it('routes a plain cie ticket to Kevin S1', () => {
    expect(ownersOf(issue({ labels: [{ name: 'cie' }] }))).toContain(
      'Kevin S1 — Karen ticket solver',
    );
  });

  it('does NOT route cie:safety to Kevin S1 — safety findings are never auto-fixed', () => {
    const owners = ownersOf(issue({ labels: [{ name: 'cie' }, { name: 'cie:safety' }] }));
    expect(owners).not.toContain('Kevin S1 — Karen ticket solver');
  });

  it('does NOT route a parked ticket to Kevin S1, but still reports it as owned-by-park', () => {
    const owners = ownersOf(issue({ labels: [{ name: 'cie' }, { name: PARKED_LABEL }] }));
    expect(owners).not.toContain('Kevin S1 — Karen ticket solver');
    expect(owners.length).toBeGreaterThan(0); // parked is a *documented* home, not a void
  });

  it('does NOT let a descriptive label fake an owner for a Wyatt-authored ticket', () => {
    // `bug` says what the ticket is, not who reads it. Kevin S3's author fence
    // still refuses it, so it must report as unowned until `needs-triage` lands.
    const owners = ownersOf(
      issue({ author: { login: 'wjduvall-cmd' }, labels: [{ name: 'bug' }] }),
    );
    expect(owners).toEqual([]);
  });

  it('leaves cie tickets out of Kevin S3 (streams stay separate)', () => {
    expect(ownersOf(issue({ labels: [{ name: 'cie' }] }))).not.toContain(
      'Kevin S3 triage (author-independent)',
    );
  });
});

describe('classify', () => {
  const issues = [
    issue({ number: 1869, author: { login: 'wjduvall-cmd' }, labels: [] }),
    issue({ number: 434, author: { login: 'sffan15-sys' }, labels: [] }),
    issue({ number: 138, labels: [{ name: 'cie' }, { name: PARKED_LABEL }] }),
    issue({ number: 660, labels: [{ name: 'a11y' }, { name: MANUAL_A11Y_LABEL }] }),
    issue({ number: 1882, labels: [{ name: 'founders-brief' }] }),
  ];

  it('reports only the genuinely unreachable issue as unowned', () => {
    expect(classify(issues, NOW).unowned.map((r) => r.number)).toEqual([1869]);
  });

  it('counts every zero-label issue, including ones a scanner still reaches', () => {
    expect(
      classify(issues, NOW)
        .unlabeled.map((r) => r.number)
        .sort((a, b) => a - b),
    ).toEqual([434, 1869]);
  });

  it('skips agent ledger issues — they are output, not work', () => {
    const all = classify(issues, NOW);
    for (const bucket of [all.unowned, all.unlabeled, all.parked, all.manualA11y]) {
      expect(bucket.map((r) => r.number)).not.toContain(1882);
    }
  });

  it('surfaces parked and manual-a11y every run, with age', () => {
    const { parked, manualA11y } = classify(issues, NOW);
    expect(parked.map((r) => r.number)).toEqual([138]);
    expect(manualA11y.map((r) => r.number)).toEqual([660]);
    expect(parked[0].age).toBe(32);
  });
});

describe('summarizeFailed — one fault, not N incidents', () => {
  const x403 =
    'X post failed (403): {"detail":"You are not permitted to perform this action.","status":403}';
  const ig =
    'Instagram publish failed: {"error":{"message":"Media ID is not available","code":9007}}';

  it('collapses eleven identical X 403s into a single group', () => {
    const items = Array.from({ length: 11 }, (_, i) => ({
      file: `p${i}.json`,
      platform: 'x',
      scheduledAt: '2026-07-21T12:00:00Z',
      error: x403,
    }));
    const groups = summarizeFailed(items, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(11);
    expect(groups[0].oldestDays).toBe(20);
  });

  it('keeps a different root cause in its own group', () => {
    const groups = summarizeFailed(
      [
        { file: 'a.json', platform: 'x', scheduledAt: '2026-08-01T00:00:00Z', error: x403 },
        { file: 'b.json', platform: 'instagram', scheduledAt: '2026-08-01T00:00:00Z', error: ig },
      ],
      NOW,
    );
    expect(groups).toHaveLength(2);
  });

  it('signature keys on provider + status + detail, not the post', () => {
    expect(signatureOf(x403)).toContain('403');
    expect(signatureOf(x403)).toContain('not permitted');
    expect(signatureOf(ig)).toContain('Instagram');
  });
});

describe('renderReport', () => {
  it('leads with counts and names the unowned issues', () => {
    const md = renderReport(
      {
        ...classify([issue({ number: 1869, author: { login: 'wjduvall-cmd' } })], NOW),
        failed: [],
      },
      NOW,
    );
    expect(md).toContain('Unowned open issues | **1**');
    expect(md).toContain('#1869');
  });

  it('says so plainly when nothing is unowned', () => {
    const md = renderReport(
      { unowned: [], unlabeled: [], parked: [], manualA11y: [], failed: [] },
      NOW,
    );
    expect(md).toContain('Every open issue is reachable by at least one scanner');
  });
});
