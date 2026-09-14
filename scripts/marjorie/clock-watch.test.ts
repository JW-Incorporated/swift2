import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain mjs
import { gapVerdict, readVerdict, watchClock } from './lib/clock-watch.mjs';
// @ts-expect-error plain mjs
import { checkClock } from './chat-alarm.mjs';

const NOW = Date.parse('2026-09-14T15:00:00Z');
const SINCE = '2026-09-14T12:00:00Z';
const REPO = 'JW-Incorporated/swift2';
const runs = Array.from({ length: 13 }, (_, i) => ({ id: i + 1, head_branch: 'main', event: 'schedule', created_at: new Date(NOW - 3600_000 + i * 300_000).toISOString() }));
const gh = (history: unknown[], rest: unknown[] = []) => vi.fn((_cmd: string, args: string[]) => {
  if (args[0] === 'workflow') return '';
  return JSON.stringify(args.some((s) => s.includes('/runs?')) ? { total_count: history.length, workflow_runs: history } : rest);
});
afterEach(() => vi.restoreAllMocks());

describe('shared clock gap verdict', () => {
  it('cron-only runs cover every slot, irrespective of actor and conclusion', () => {
    expect(gapVerdict({ runs, now: NOW, since: SINCE })).toMatchObject({ alert: false, checked: 11, missed: [] });
    expect(gapVerdict({ runs: runs.map((r) => ({ ...r, event: 'workflow_dispatch', actor: { login: 'manual' }, conclusion: 'failure' })), now: NOW, since: SINCE }).alert).toBe(false);
  });
  it('one run cannot cover two slots; two misses alert but one does not', () => {
    expect(gapVerdict({ runs: runs.slice(1), now: NOW, since: SINCE }).alert).toBe(false);
    expect(gapVerdict({ runs: runs.slice(2), now: NOW, since: SINCE })).toMatchObject({ alert: true, missed: ['2026-09-14T14:00:00.000Z', '2026-09-14T14:05:00.000Z'] });
  });
  it('waits through activation grace and slot settling, and rejects invalid/future since', () => {
    expect(gapVerdict({ runs: [], now: NOW, since: '2026-09-14T14:40:00Z' })).toMatchObject({ checked: 0, alert: false });
    expect(gapVerdict({ runs: [], now: NOW, since: '2026-09-14T14:20:00Z' })).toMatchObject({ checked: 1, alert: false });
    for (const since of ['', 'invalid', '2026-09-14T16:00:00Z']) expect(gapVerdict({ runs: [], now: NOW, since })).toMatchObject({ validSince: false, alert: true });
  });
  it('feature branches and unrelated events never cover a slot', () => {
    for (const over of [{ head_branch: 'feature/x' }, { event: 'push' }]) expect(gapVerdict({ runs: runs.map((r) => ({ ...r, ...over })), now: NOW, since: SINCE }).alert).toBe(true);
  });
  it('readVerdict requires complete, valid history and passes since to the same verdict', () => {
    const execImpl = gh([]);
    expect(readVerdict({ execImpl, repo: REPO, now: NOW, since: '2026-09-14T14:40:00Z' })).toMatchObject({ checked: 0, alert: false });
    expect(execImpl.mock.calls[0][1].join(' ')).toContain('branch=main');
    for (const data of [{ total_count: 101, workflow_runs: [] }, { total_count: 0 }, { total_count: 1, workflow_runs: [{}] }]) {
      expect(readVerdict({ execImpl: () => JSON.stringify(data), repo: REPO, now: NOW, since: SINCE }).ok).toBe(false);
    }
  });
  it('watch dispatches only for a new alert; existing alert, dry run and unreadable history send nothing', () => {
    const execImpl = gh([]);
    expect(watchClock({ execImpl, repo: REPO, now: NOW, since: SINCE, log: () => {} }).alert).toBe(true);
    expect(execImpl.mock.calls.some(([, args]) => args[0] === 'workflow' && args.includes('stage=clock-silent'))).toBe(true);
    for (const [read, dryRun] of [[gh([], [{ title: 'Clock is not firing' }]), false], [gh([]), true], [vi.fn(() => { throw new Error('private error'); }), false]] as const) {
      watchClock({ execImpl: read, repo: REPO, now: NOW, since: SINCE, dryRun, log: () => {} });
      expect(read.mock.calls.some((call: unknown[]) => (call[1] as string[])?.[0] === 'workflow')).toBe(false);
    }
  });
  it('checkClock and the watch give the same decision for misses and grace', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const since of [SINCE, '2026-09-14T14:40:00Z']) {
      const file = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
      const execImpl = gh([]);
      const expected = watchClock({ execImpl, repo: REPO, now: NOW, since, dryRun: true, log: () => {} });
      expect(checkClock({ env: { REPO, GITHUB_OUTPUT: file }, execImpl, now: NOW, since, live: true })).toBe(0);
      expect(readFileSync(file, 'utf8')).toContain(`alert=${expected.alert}`);
    }
  });
  it('dry-run prints the canonical body even when coverage is healthy and cannot dispatch', () => {
    const logged = vi.spyOn(console, 'log').mockImplementation(() => {});
    const execImpl = gh(runs);
    expect(checkClock({ env: { REPO, DRY_RUN: 'true' }, execImpl, now: NOW, since: SINCE, live: true })).toBe(0);
    expect(logged.mock.calls.flat().join('\n')).toContain('Clock is not firing');
    expect(logged.mock.calls.flat().join('\n')).toContain('detection waits for a surviving cron');
    expect(execImpl.mock.calls.every(([, args]) => args[0] === 'api')).toBe(true);
  });
});
