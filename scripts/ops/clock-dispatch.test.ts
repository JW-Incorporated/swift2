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
const run = (createdAt: string, event = 'schedule') => ({ createdAt, event });
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
});

describe('clock-table.json', () => {
  const root = path.resolve(__dirname, '../..');
  it('names only real, dispatchable workflows, never a social-* one', () => {
    expect(TABLE.map((e: { workflow: string }) => e.workflow)).toEqual([
      'bot-failure-triage.yml', 'watchdog.yml', 'routine-marjorie-ops.yml', 'marjorie-status.yml', 'auto-merge-keepup.yml',
    ]);
    for (const e of TABLE) {
      const f = path.join(root, '.github/workflows', e.workflow);
      expect(existsSync(f)).toBe(true);
      expect(readFileSync(f, 'utf8')).toMatch(/^ {2}workflow_dispatch:/m);
      expect(e.workflow).not.toMatch(/social/);
      expect(e.minGapMinutes).toBeGreaterThan(0);
    }
  });
});
