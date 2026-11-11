import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXCLUDE, activeFiles, failureReason, listScheduledWorkflows, verdict } from './scheduled-failures.mjs';

const SCHEDULED = 'on:\n  schedule:\n    - cron: "0 5 * * *"\n  workflow_dispatch:\n';
const NOT_SCHEDULED = 'on:\n  push:\n  workflow_dispatch:\n';

function makeDir(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'wd-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

describe('listScheduledWorkflows', () => {
  it('covers a newly added scheduled workflow without any list edit', () => {
    const dir = makeDir({ 'a.yml': SCHEDULED, 'brand-new.yml': SCHEDULED, 'ci.yml': NOT_SCHEDULED });
    expect(listScheduledWorkflows(dir, {})).toEqual(['a.yml', 'brand-new.yml']);
  });

  it('skips excluded workflows', () => {
    const dir = makeDir({ 'a.yml': SCHEDULED, 'mobile-parity.yml': SCHEDULED });
    expect(listScheduledWorkflows(dir, EXCLUDE)).toEqual(['a.yml']);
  });

  it('ignores a commented-out schedule block', () => {
    const dir = makeDir({ 'a.yml': 'on:\n  # schedule:\n  #   - cron: "0 5 * * *"\n  push:\n' });
    expect(listScheduledWorkflows(dir, {})).toEqual([]);
  });

  it('gives every EXCLUDE entry a reason', () => {
    for (const reason of Object.values(EXCLUDE)) expect(reason.length).toBeGreaterThan(10);
  });

  it('finds the repo workflows that are known to be scheduled', () => {
    const found = listScheduledWorkflows('.github/workflows');
    expect(found).toContain('link-sweep.yml');
    expect(found).toContain('watchdog.yml');
    expect(found).not.toContain('mobile-parity.yml');
  });
});

const run = (event: string, conclusion: string | null) => ({ event, conclusion });

describe('verdict', () => {
  it('alerts on two consecutive failures', () => {
    expect(verdict([run('schedule', 'failure'), run('schedule', 'failure')])).toBe('alert');
  });

  it('counts timed_out as failing', () => {
    expect(verdict([run('schedule', 'timed_out'), run('schedule', 'failure')])).toBe('alert');
  });

  it('does not alert on a single failure', () => {
    expect(verdict([run('schedule', 'failure')])).toBe('ok');
  });

  it('self-closes when the newest run succeeded (schedule)', () => {
    expect(verdict([run('schedule', 'success'), run('schedule', 'failure'), run('schedule', 'failure')])).toBe('ok');
  });

  it('self-closes on a clock-dispatched success', () => {
    expect(verdict([run('workflow_dispatch', 'success'), run('schedule', 'failure'), run('schedule', 'failure')])).toBe('ok');
  });

  it('ignores in-progress, cancelled and non-clock events', () => {
    const runs = [run('schedule', null), run('push', 'success'), run('schedule', 'cancelled'), run('schedule', 'failure'), run('schedule', 'failure')];
    expect(verdict(runs)).toBe('alert');
  });
});

// Issue #4475 item D: routine-vault-run.yml went fail 09-14 / success 09-15 /
// fail 09-16 and the consecutive-only rule never alerted.
describe('verdict — intermittent failures (every other run)', () => {
  it('alerts on fail / success / fail, newest red', () => {
    expect(verdict([run('schedule', 'failure'), run('schedule', 'success'), run('schedule', 'failure')])).toBe('alert');
  });

  it('names the intermittent rule in the body, not the consecutive one', () => {
    const reason = failureReason([run('schedule', 'failure'), run('schedule', 'success'), run('schedule', 'failure')]);
    expect(reason).toContain('2 of its last 3 scheduled runs failed');
    expect(reason).toContain('not consecutive');
  });

  it('still names the consecutive rule when that is what fired', () => {
    expect(failureReason([run('schedule', 'failure'), run('schedule', 'failure')])).toBe('its last 2 scheduled runs both failed');
  });

  it('stays ok on one isolated red among four greens', () => {
    const runs = [run('schedule', 'failure'), ...Array.from({ length: 4 }, () => run('schedule', 'success'))];
    expect(verdict(runs)).toBe('ok');
  });

  it('self-closes the moment the newest run is green, even mid-flap', () => {
    const runs = [run('schedule', 'success'), run('schedule', 'failure'), run('schedule', 'success'), run('schedule', 'failure')];
    expect(verdict(runs)).toBe('ok');
    expect(failureReason(runs)).toBeNull();
  });

  it('does not look past the 5-run window', () => {
    const runs = [run('schedule', 'failure'), ...Array.from({ length: 4 }, () => run('schedule', 'success')), run('schedule', 'failure')];
    expect(verdict(runs)).toBe('ok');
  });

  it('is ok with no settled runs at all', () => {
    expect(verdict([])).toBe('ok');
    expect(verdict([run('schedule', null)])).toBe('ok');
  });
});

describe('verdict with merged per-event lists', () => {
  it('still alerts when 10 pull_request runs sit between older failed schedule runs', () => {
    const prs = Array.from({ length: 10 }, (_, i) => ({ event: 'pull_request', conclusion: 'success', createdAt: `2026-10-06T0${i}:00:00Z` }));
    const failed = [
      { event: 'schedule', conclusion: 'failure', createdAt: '2026-10-04T00:00:00Z' },
      { event: 'schedule', conclusion: 'failure', createdAt: '2026-10-03T00:00:00Z' },
    ];
    expect(verdict([...prs, ...failed])).toBe('alert');
  });

  it('sorts concatenated lists by createdAt so a newer dispatch success wins', () => {
    const sched = [
      { event: 'schedule', conclusion: 'failure', createdAt: '2026-10-04T00:00:00Z' },
      { event: 'schedule', conclusion: 'failure', createdAt: '2026-10-03T00:00:00Z' },
    ];
    const disp = [{ event: 'workflow_dispatch', conclusion: 'success', createdAt: '2026-10-05T00:00:00Z' }];
    expect(verdict([...sched, ...disp])).toBe('ok');
  });
});

describe('activeFiles', () => {
  it('keeps only enabled workflows, by file name', () => {
    const list = [
      { path: '.github/workflows/a.yml', state: 'active' },
      { path: '.github/workflows/b.yml', state: 'disabled_manually' },
      { path: '.github/workflows/c.yml', state: 'disabled_inactivity' },
    ];
    expect(activeFiles(list)).toEqual(['a.yml']);
  });
});

describe('watchdog.yml wiring', () => {
  it('derives targets from scheduled-failures.mjs, not a fixed list', () => {
    const yml = readFileSync('.github/workflows/watchdog.yml', 'utf8');
    expect(yml).toContain('scripts/watchdog/scheduled-failures.mjs list');
    expect(yml).toContain('failed its last 2 scheduled runs');
  });

  // The alert title is the dedupe identity and a cross-script contract:
  // alert-router.mjs keys `workflow-failed-last-2-runs` off it verbatim, so the
  // widened rule must put its reason in the BODY and leave the title alone.
  it('keeps the title verbatim and sources the body from `reason`', () => {
    const yml = readFileSync('.github/workflows/watchdog.yml', 'utf8');
    const router = readFileSync('scripts/marjorie/lib/alert-router.mjs', 'utf8');
    const title = 'Watchdog: ${WF} failed its last 2 scheduled runs';
    expect(yml).toContain(`ALERT_TITLE="${title}"`);
    const re = router.match(/\{ key: 'workflow-failed-last-2-runs', re: (\/.+\/) \}/)?.[1];
    expect(re).toBeTruthy();
    expect(title.replace('${WF}', 'link-sweep.yml')).toMatch(new RegExp(re!.slice(1, -1)));
    expect(yml).toContain('scheduled-failures.mjs reason');
  });
});
