import { describe, expect, it } from 'vitest';
import {
  buildPlan,
  cieKey,
  collectPrRefs,
  workflowFileFromTitle,
} from './issue-sweeper-rules.mjs';

const NOW = new Date('2026-10-08T00:00:00Z');
let n = 100;
const issue = (over: Record<string, unknown> = {}) => ({
  number: ++n,
  title: 'a ticket',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  author: { login: 'app/claude' },
  assignees: [],
  labels: [],
  ...over,
});
const lbl = (...names: string[]) => names.map((name) => ({ name }));
const plan = (issues: unknown[], extra: Record<string, unknown> = {}) =>
  buildPlan({ issues, now: NOW, ...extra }) as {
    plan: { number: number; rule: string; comment: string }[];
    skipped: { number: number; reason: string }[];
  };

describe('hard guard', () => {
  const stale = { labels: lbl('intake'), updatedAt: '2026-09-01T00:00:00Z' };

  it('closes an eligible bot intake (control)', () => {
    expect(plan([issue(stale)]).plan).toHaveLength(1);
  });
  it('accepts [bot] logins and the founder account', () => {
    expect(plan([issue({ ...stale, author: { login: 'x[bot]' } })]).plan).toHaveLength(1);
    expect(plan([issue({ ...stale, author: { login: 'sffan15-sys' } })]).plan).toHaveLength(1);
  });
  it('skips a human author', () => {
    const r = plan([issue({ ...stale, author: { login: 'wjduvall-cmd' } })]);
    expect(r.plan).toHaveLength(0);
    expect(r.skipped[0].reason).toMatch(/human/);
  });
  it.each(['founder-task', 'hold', 'founder-decision', 'founder-assigned', 'needs-human-review', 'claimed', 'in-progress', 'status-page', 'weekly-plan'])(
    'skips protected label %s',
    (label) => {
      expect(plan([issue({ ...stale, labels: lbl('intake', label) })]).plan).toHaveLength(0);
    },
  );
  it('skips an assigned issue', () => {
    expect(plan([issue({ ...stale, assignees: [{ login: 'x' }] })]).plan).toHaveLength(0);
  });
  it('skips an issue referenced by an open PR', () => {
    const i = issue(stale);
    const prRefs = collectPrRefs([{ title: 't', body: `Fixes #${i.number}` }]);
    expect(plan([i], { prRefs }).plan).toHaveLength(0);
  });
  it('guard runs before supersede: a protected newest does not shield, a protected old is kept', () => {
    const a = issue({ labels: lbl('kevin-radar'), createdAt: '2026-10-01T00:00:00Z' });
    const b = issue({ labels: lbl('kevin-radar', 'hold'), createdAt: '2026-10-02T00:00:00Z' });
    expect(plan([a, b]).plan).toHaveLength(0);
  });
});

describe('supersede-report', () => {
  it('keeps exactly the newest per label and closes the rest', () => {
    const a = issue({ labels: lbl('kevin-digest'), createdAt: '2026-10-01T00:00:00Z' });
    const b = issue({ labels: lbl('kevin-digest'), createdAt: '2026-10-03T00:00:00Z' });
    const c = issue({ labels: lbl('kevin-digest'), createdAt: '2026-10-02T00:00:00Z' });
    const r = plan([a, b, c]);
    expect(r.plan.map((p) => p.number).sort()).toEqual([a.number, c.number].sort());
    expect(r.plan.every((p) => p.rule === 'supersede-report')).toBe(true);
    expect(r.plan[0].comment).toBe(
      `Superseded by #${b.number} (newer report of the same kind). Reopen if still needed.`,
    );
  });
  it('leaves a single report alone and keeps labels separate', () => {
    const a = issue({ labels: lbl('kevin-radar') });
    const b = issue({ labels: lbl('routine-audit') });
    expect(plan([a, b]).plan).toHaveLength(0);
  });
});

describe('intake-ttl', () => {
  it('expires at 14 days, not before', () => {
    const old = issue({ labels: lbl('intake', 'tree-event-dispatched'), updatedAt: '2026-09-24T00:00:00Z' });
    const fresh = issue({ labels: lbl('intake'), updatedAt: '2026-09-25T00:00:00Z' });
    const r = plan([old, fresh]);
    expect(r.plan.map((p) => p.number)).toEqual([old.number]);
    expect(r.plan[0].rule).toBe('intake-ttl');
  });
});

describe('watchdog-recovered', () => {
  const alert = (title: string) =>
    issue({ labels: lbl('watchdog-alert'), title, createdAt: '2026-10-05T00:00:00Z' });
  const run = (over: Record<string, unknown> = {}) => ({
    conclusion: 'success',
    createdAt: '2026-10-06T00:00:00Z',
    url: 'https://example/run/1',
    ...over,
  });

  it('parses the workflow file from the title', () => {
    expect(workflowFileFromTitle('Watchdog: link-sweep.yml failed 3x')).toBe('link-sweep.yml');
    expect(workflowFileFromTitle('Watchdog: work is going unowned')).toBeNull();
  });
  it('closes when the latest completed run is green and newer than the issue', () => {
    const r = plan([alert('Watchdog: link-sweep.yml failed')], { latestRun: () => run() });
    expect(r.plan).toHaveLength(1);
    expect(r.plan[0].comment).toContain('https://example/run/1');
  });
  it('keeps it when the run is red, older than the issue, or missing', () => {
    const i = alert('Watchdog: link-sweep.yml failed');
    expect(plan([i], { latestRun: () => run({ conclusion: 'failure' }) }).plan).toHaveLength(0);
    expect(plan([i], { latestRun: () => run({ createdAt: '2026-10-04T00:00:00Z' }) }).plan).toHaveLength(0);
    expect(plan([i], { latestRun: () => null }).plan).toHaveLength(0);
  });
  it('skips titles with no workflow file', () => {
    const r = plan([alert('Watchdog: work is going unowned')], { latestRun: () => run() });
    expect(r.plan).toHaveLength(0);
  });
});

describe('cie-duplicate', () => {
  const cie = (page: string, createdAt: string, p = 'cie:P1') =>
    issue({
      labels: lbl('cie', p),
      createdAt,
      title: `[CIE P1] Page banner still says "not confirmed" and has not been re-checked: "${page}"`,
    });

  it('extracts the outer-quoted page name', () => {
    expect(cieKey('[CIE P1] banner says "not confirmed": "The "TS" logos"')).toBe('the "ts" logos');
  });
  it('keeps the newest per page and closes older duplicates', () => {
    const a = cie('Page A', '2026-10-01T00:00:00Z');
    const b = cie('Page A', '2026-10-03T00:00:00Z', 'cie:P2');
    const c = cie('Page B', '2026-10-02T00:00:00Z');
    const r = plan([a, b, c]);
    expect(r.plan.map((p) => p.number)).toEqual([a.number]);
    expect(r.plan[0].rule).toBe('cie-duplicate');
    expect(r.plan[0].comment).toContain(`#${b.number}`);
  });
  it('ignores cie issues without a priority label', () => {
    const a = issue({ labels: lbl('cie'), title: 'x: "Page A"', createdAt: '2026-10-01T00:00:00Z' });
    const b = issue({ labels: lbl('cie'), title: 'x: "Page A"', createdAt: '2026-10-02T00:00:00Z' });
    expect(plan([a, b]).plan).toHaveLength(0);
  });
});
