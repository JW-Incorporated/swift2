import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module
import { dispatchSweep } from './dispatch-triage-sweep.mjs';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const fakeGh = (lastCreatedAt: string | null, fail = false, extra: object[] = []) => {
  const calls: string[][] = [];
  const gh = (args: string[]) => {
    calls.push(args);
    if (fail) throw new Error('HTTP 403: forbidden');
    return args[0] === 'run' ? JSON.stringify([...extra, ...(lastCreatedAt ? [{ createdAt: lastCreatedAt, event: 'workflow_dispatch' }] : [])]) : '';
  };
  return { gh, calls };
};

describe('dispatchSweep', () => {
  it('skips when the latest triage run is under 25 minutes old', () => {
    const { gh, calls } = fakeGh('2026-10-06T11:40:00Z');
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: () => {} })).toBe('skipped');
    expect(calls.some((c) => c[0] === 'workflow')).toBe(false);
  });
  it('dispatches on main when the latest run is old', () => {
    const { gh, calls } = fakeGh('2026-10-06T11:30:00Z');
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: () => {} })).toBe('dispatched');
    expect(calls.find((c) => c[0] === 'workflow')).toEqual(['workflow', 'run', 'bot-failure-triage.yml', '--repo', 'o/r', '--ref', 'main']);
  });
  it('dispatches when there is no run at all', () => {
    const { gh, calls } = fakeGh(null);
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: () => {} })).toBe('dispatched');
    expect(calls.some((c) => c[0] === 'workflow')).toBe(true);
  });
  it('ignores recent workflow_run entries and dispatches off an old sweep start', () => {
    const { gh, calls } = fakeGh('2026-10-06T11:00:00Z', false, [{ createdAt: '2026-10-06T11:55:00Z', event: 'workflow_run' }]);
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: () => {} })).toBe('dispatched');
    expect(calls.some((c) => c[0] === 'workflow')).toBe(true);
  });
  it('dispatches when only workflow_run entries exist', () => {
    const { gh } = fakeGh(null, false, [{ createdAt: '2026-10-06T11:59:00Z', event: 'workflow_run' }]);
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: () => {} })).toBe('dispatched');
  });
  it('turns a gh timeout into a warning', () => {
    const gh = () => { throw Object.assign(new Error('spawnSync gh ETIMEDOUT'), { code: 'ETIMEDOUT' }); };
    const logs: string[] = [];
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: (m: string) => logs.push(m) })).toBe('error');
    expect(logs[0]).toMatch(/^::warning::.*ETIMEDOUT/);
  });
  it('turns a gh error into a warning, never a throw', () => {
    const { gh } = fakeGh(null, true);
    const logs: string[] = [];
    expect(dispatchSweep({ gh, repo: 'o/r', now: NOW, log: (m: string) => logs.push(m) })).toBe('error');
    expect(logs[0]).toMatch(/^::warning::/);
  });
});
