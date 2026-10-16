import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module
import { clockDispatch, TABLE } from './clock-dispatch.mjs';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const T = [{ workflow: 'a.yml', minGapMinutes: 25 }, { workflow: 'b.yml', minGapMinutes: 55, inputs: { hourly: 'true' } }];

type Runs = Record<string, object[] | Error>;
const fakeGh = (runs: Runs) => {
  const calls: string[][] = [];
  const gh = (args: string[]) => {
    calls.push(args);
    const wf = args[args.indexOf('--workflow') + 1] ?? args[2];
    const r = runs[wf];
    if (r instanceof Error) throw r;
    return args[0] === 'run' ? JSON.stringify(r ?? []) : '';
  };
  const dispatched = () => calls.filter((c) => c[0] === 'workflow').map((c) => c[2]);
  return { gh, calls, dispatched };
};
const run = (createdAt: string, event = 'schedule', displayTitle?: string) => ({ createdAt, event, displayTitle });
const go = (gh: (a: string[]) => string, table = T, logs: string[] = []) =>
  clockDispatch({ gh, repo: 'o/r', now: NOW, log: (m: string) => logs.push(m), table });

describe('clockDispatch', () => {
  it('throttles per entry using each entry own gap', () => {
    const { gh, dispatched } = fakeGh({ 'a.yml': [run('2026-10-06T11:40:00Z')], 'b.yml': [run('2026-10-06T11:40:00Z')] });
    expect(go(gh).map((r: { result: string }) => r.result)).toEqual(['skipped', 'skipped']);
    expect(dispatched()).toEqual([]);
    const f = fakeGh({ 'a.yml': [run('2026-10-06T11:30:00Z')], 'b.yml': [run('2026-10-06T11:30:00Z', 'workflow_dispatch')] });
    expect(go(f.gh).map((r: { result: string }) => r.result)).toEqual(['dispatched', 'skipped']);
    expect(f.dispatched()).toEqual(['a.yml']);
  });
  it('dispatches on main, passing table inputs, and when there is no run at all', () => {
    const { gh, calls } = fakeGh({});
    expect(go(gh).map((r: { result: string }) => r.result)).toEqual(['dispatched', 'dispatched']);
    const w = calls.filter((c) => c[0] === 'workflow');
    expect(w[0]).toEqual(['workflow', 'run', 'a.yml', '--repo', 'o/r', '--ref', 'main']);
    expect(w[1]).toEqual(['workflow', 'run', 'b.yml', '--repo', 'o/r', '--ref', 'main', '-f', 'hourly=true']);
  });
  it('ignores workflow_run entries, whether or not an older real start exists', () => {
    const wr = run('2026-10-06T11:55:00Z', 'workflow_run');
    const { gh, dispatched } = fakeGh({ 'a.yml': [wr, run('2026-10-06T11:00:00Z')], 'b.yml': [wr] });
    expect(go(gh).map((r: { result: string }) => r.result)).toEqual(['dispatched', 'dispatched']);
    expect(dispatched()).toEqual(['a.yml', 'b.yml']);
  });
  it('isolates errors: a failing entry does not stop the next', () => {
    const { gh, dispatched } = fakeGh({ 'a.yml': new Error('HTTP 403: forbidden') });
    const logs: string[] = [];
    expect(go(gh, T, logs).map((r: { result: string }) => r.result)).toEqual(['error', 'dispatched']);
    expect(dispatched()).toEqual(['b.yml']);
    expect(logs[0]).toMatch(/^::warning::.*a\.yml.*403/);
  });
  it('turns a gh timeout into a warning, never a throw', () => {
    const gh = () => { throw Object.assign(new Error('spawnSync gh ETIMEDOUT'), { code: 'ETIMEDOUT' }); };
    const logs: string[] = [];
    expect(go(gh, T, logs).map((r: { result: string }) => r.result)).toEqual(['error', 'error']);
    expect(logs[0]).toMatch(/^::warning::.*ETIMEDOUT/);
  });
  it('flags an unknown workflow as a warning', () => {
    const { gh } = fakeGh({ 'a.yml': new Error('HTTP 404: Not Found (https://api.github.com/x)') });
    const logs: string[] = [];
    expect(go(gh, [T[0]], logs)[0].result).toBe('error');
    expect(logs[0]).toMatch(/^::warning::.*unknown workflow/);
  });

  it('keeps disabled rows inert and throttles named modes independently', () => {
    const table = [
      { workflow: 'tidewatch.yml', minGapMinutes: 9, runName: 'tidewatch (fast)', disabled: true },
      { workflow: 'tidewatch.yml', minGapMinutes: 55, runName: 'tidewatch (sweep)', inputs: { mode: 'sweep' } },
    ];
    const { gh, dispatched } = fakeGh({
      'tidewatch.yml': [run('2026-10-06T11:55:00Z', 'workflow_dispatch', 'tidewatch (fast)'), run('2026-10-06T10:00:00Z', 'workflow_dispatch', 'tidewatch (sweep)')],
    });
    expect(go(gh, table).map((r: { result: string }) => r.result)).toEqual(['disabled', 'dispatched']);
    expect(dispatched()).toEqual(['tidewatch.yml']);
  });
});

describe('shadow report entries', () => {
  const rows = TABLE.filter((e: { workflow: string }) => e.workflow === 'tidewatch-shadow-report.yml');
  const W = 'tidewatch-shadow-report.yml';
  const alertTitle = 'tidewatch-shadow-report (alert)';
  const fullTitle = 'tidewatch-shadow-report (full)';
  const at = (iso: string, table = rows, runs: object[] = []) => {
    const f = fakeGh({ [W]: runs });
    const res = clockDispatch({ gh: f.gh, repo: 'o/r', now: Date.parse(iso), log: () => {}, table });
    return { res: res.map((r: { result: string }) => r.result), calls: f.calls.filter((c) => c[0] === 'workflow') };
  };
  it('sends boolean inputs the workflow declares, keyed by run-name', () => {
    expect(rows.map((e: { runName: string; inputs: object }) => [e.runName, e.inputs])).toEqual([
      [alertTitle, { alert: 'true' }], [fullTitle, { alert: 'false' }],
    ]);
    const src = readFileSync(path.join(path.resolve(__dirname, '../..'), '.github/workflows', W), 'utf8');
    expect(src).toMatch(/^ {6}alert:\n[\s\S]*?type: boolean/m);
    expect(src).toContain("run-name: tidewatch-shadow-report (${{ inputs.alert && 'alert' || 'full' }})");
    expect(src).not.toMatch(/^ {2}schedule:/m);
  });
  it('hourly alert runs do not throttle the daily full report', () => {
    const runs = [run('2026-10-06T14:40:00Z', 'workflow_dispatch', alertTitle)];
    const { res, calls } = at('2026-10-06T15:20:00Z', rows, runs);
    expect(res).toEqual(['skipped', 'dispatched']);
    expect(calls[0].slice(-2)).toEqual(['-f', 'alert=false']);
  });
  it('alert re-dispatches after 55m and the full report waits for 15:07 UTC and 23h', () => {
    const full = run('2026-10-05T15:10:00Z', 'workflow_dispatch', fullTitle);
    expect(at('2026-10-06T15:00:00Z', rows, [full]).res).toEqual(['dispatched', 'skipped']);
    expect(at('2026-10-06T15:08:00Z', rows, [full]).res).toEqual(['dispatched', 'dispatched']);
    const today = run('2026-10-06T15:10:00Z', 'workflow_dispatch', fullTitle);
    expect(at('2026-10-06T22:00:00Z', rows, [today]).res).toEqual(['dispatched', 'skipped']);
  });
});

describe('clock-table.json', () => {
  const root = path.resolve(__dirname, '../..');
  it('names only real, dispatchable workflows', () => {
    expect(TABLE.map((e: { workflow: string }) => e.workflow)).toEqual([
      'bot-failure-triage.yml', 'watchdog.yml', 'routine-marjorie-ops.yml', 'news-worker.yml',
      'tidewatch.yml', 'tidewatch.yml', 'marjorie-status.yml', 'auto-merge-keepup.yml',
      'social-approval-poll.yml', 'social-poster.yml', 'concert-photo-sourcing.yml',
      'tidewatch-shadow-report.yml', 'tidewatch-shadow-report.yml',
    ]);
    for (const e of TABLE) {
      const f = path.join(root, '.github/workflows', e.workflow);
      expect(existsSync(f)).toBe(true);
      expect(readFileSync(f, 'utf8')).toMatch(/^ {2}workflow_dispatch:/m);
      expect(e.minGapMinutes).toBeGreaterThan(0);
    }
  });

  it('gates scheduled Tidewatch before setup and scopes classifier credentials', () => {
    const src = readFileSync(path.join(root, '.github/workflows/tidewatch.yml'), 'utf8');
    expect(src).toContain('TYPESAFE_API_KEY not set; scheduled classification skipped');
    expect(src.indexOf('name: Preflight')).toBeLessThan(src.indexOf('uses: actions/checkout@'));
    expect(src).toMatch(/permissions:\n {2}contents: read\n {2}issues: write/);
    expect(src).toMatch(/- name: Classify[\s\S]*?CLAUDE_CODE_OAUTH_TOKEN:/);
    expect(src.match(/CLAUDE_CODE_OAUTH_TOKEN:/g)).toHaveLength(1);
  });

  it('serialises the social workflows (cancel-in-progress false) and gives them no dispatch inputs', () => {
    for (const w of ['social-approval-poll.yml', 'social-poster.yml']) {
      const src = readFileSync(path.join(root, '.github/workflows', w), 'utf8');
      expect(src).toMatch(/^concurrency:\n {2}group: \S+\n {2}cancel-in-progress: false$/m);
      expect(TABLE.find((e: { workflow: string }) => e.workflow === w).inputs).toBeUndefined();
    }
  });
});
