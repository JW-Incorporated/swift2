import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXCLUDE, listScheduledWorkflows, verdict } from './scheduled-failures.mjs';

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

describe('watchdog.yml wiring', () => {
  it('derives targets from scheduled-failures.mjs, not a fixed list', () => {
    const yml = readFileSync('.github/workflows/watchdog.yml', 'utf8');
    expect(yml).toContain('scripts/watchdog/scheduled-failures.mjs list');
    expect(yml).toContain('failed its last 2 scheduled runs');
  });
});
