import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain mjs
import { CLOCK_TITLE, clockRecoveryBody, gapVerdict, readVerdict, watchClock } from './lib/clock-watch.mjs';
// @ts-expect-error plain mjs
import { alert, checkClock } from './chat-alarm.mjs';
// @ts-expect-error plain mjs
import { poll } from './chat-poll.mjs';
import { baseRoutes, discord, env, sleepImpl } from './chat-poll.fixtures';
// @ts-expect-error plain mjs
import { CLOCK_LIVE, CLOCK_LIVE_SINCE } from './lib/chat-inbox.mjs';

const NOW = Date.parse('2026-09-14T15:00:00Z');
const SINCE = '2026-09-14T12:00:00Z';
const REPO = 'JW-Incorporated/swift2';
const runs = Array.from({ length: 13 }, (_, i) => ({ id: i + 1, head_branch: 'main', event: 'schedule', created_at: new Date(NOW - 3600_000 + i * 300_000).toISOString() }));
const gh = (history: unknown[], rest: unknown[] = []) => vi.fn((_cmd: string, args: string[]) => {
  if (args[0] === 'workflow') return '';
  return JSON.stringify(args.some((s) => s.includes('/runs?')) ? { total_count: history.length, workflow_runs: history } : rest);
});
function readOutputs(file: string) {
  const text = readFileSync(file, 'utf8');
  const outputs: Record<string, string> = {};
  for (const m of text.matchAll(/^(\w+)<<(\S+)\n([\s\S]*?)\n\2$/gm)) outputs[m[1]] = m[3];
  for (const m of text.matchAll(/^(\w+)=(.*)$/gm)) outputs[m[1]] = m[2];
  return outputs;
}
afterEach(() => vi.restoreAllMocks());

describe('shared clock gap verdict', () => {
  it('cron-only runs cover every slot, irrespective of actor and conclusion', () => {
    expect(gapVerdict({ runs, now: NOW, since: SINCE })).toMatchObject({ alert: false, checked: 11, missed: [] });
    expect(gapVerdict({ runs: runs.map((r) => ({ ...r, event: 'workflow_dispatch', actor: { login: 'manual' }, conclusion: 'failure' })), now: NOW, since: SINCE }).alert).toBe(false);
  });
  it('one run cannot cover two slots; two misses alert but one does not', () => {
    const belowThreshold = gapVerdict({ runs: runs.slice(1), now: NOW, since: SINCE });
    expect(belowThreshold.alert).toBe(false);
    expect(clockRecoveryBody(belowThreshold, NOW)).toContain('2026-09-14T14:00:00.000Z');
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
  it('closes a recovered standing alert and a later gap opens and notifies again', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    let history: typeof runs = [];
    let open = false;
    let dispatches = 0;
    let notifications = 0;
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      if (args[0] === 'workflow') { dispatches += 1; return ''; }
      if (args.some((s) => s.includes('/runs?'))) return JSON.stringify({ total_count: history.length, workflow_runs: history });
      return JSON.stringify(open ? [{ title: CLOCK_TITLE }] : []);
    });
    const apply = (expected: 'open' | 'close') => {
      const file = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
      expect(checkClock({ env: { REPO, GITHUB_OUTPUT: file }, execImpl, now: NOW, since: SINCE, live: true })).toBe(0);
      const outputs = readOutputs(file);
      expect(outputs.action).toBe(expected);
      const transition = vi.fn((cmd: string, args: string[]) => {
        if (cmd === 'bash') {
          expect(args.slice(0, 4)).toEqual(['scripts/watchdog/upsert-alert.sh', expected, CLOCK_TITLE, expect.any(String)]);
          if (expected === 'open' && !open) notifications += 1;
          open = expected === 'open';
        }
        return '';
      });
      expect(alert({ env: { ACTION: expected, TITLE: outputs.title, BODY: outputs.body, REPO }, execImpl: transition })).toBe(0);
      return outputs;
    };

    expect(watchClock({ execImpl, repo: REPO, now: NOW, since: SINCE, log: () => {} }).alert).toBe(true);
    expect(dispatches).toBe(1);
    apply('open');
    expect(open).toBe(true);
    expect(notifications).toBe(1);
    watchClock({ execImpl, repo: REPO, now: NOW, since: SINCE, log: () => {} });
    expect(dispatches).toBe(1);

    history = runs;
    expect(watchClock({ execImpl, repo: REPO, now: NOW, since: SINCE, log: () => {} }).alert).toBe(false);
    expect(dispatches).toBe(2);
    expect(apply('close').body).toContain('Poll coverage recovered below the alert threshold on main.');
    expect(open).toBe(false);

    history = [];
    watchClock({ execImpl, repo: REPO, now: NOW, since: SINCE, log: () => {} });
    expect(dispatches).toBe(3);
    apply('open');
    expect(notifications).toBe(2);
  });
  it('a queued clock alarm rechecks paginated issue state before emitting another open', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const unrelated = Array.from({ length: 100 }, (_, i) => ({ title: `Watchdog alert ${i}` }));
    let open = false;
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      if (args.some((s) => s.includes('/runs?'))) return JSON.stringify({ total_count: 0, workflow_runs: [] });
      if (!open) return JSON.stringify([]);
      if (args.some((s) => s.includes('&page=1'))) return JSON.stringify(unrelated);
      if (args.some((s) => s.includes('&page=2'))) return JSON.stringify([{ title: CLOCK_TITLE }]);
      throw new Error('unexpected gh call');
    });
    const first = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
    const second = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');

    expect(checkClock({ env: { REPO, GITHUB_OUTPUT: first }, execImpl, now: NOW, since: SINCE, live: true })).toBe(0);
    expect(readOutputs(first)).toMatchObject({ alert: 'true', action: 'open' });
    open = true; // The first serialized alarm completed while this one waited.
    expect(checkClock({ env: { REPO, GITHUB_OUTPUT: second }, execImpl, now: NOW, since: SINCE, live: true })).toBe(0);
    expect(readOutputs(second)).toMatchObject({ alert: 'true', action: '' });
    expect(execImpl.mock.calls.some(([, args]) => args.some((s) => s.includes('page=2')))).toBe(true);
  });
  it('fails closed when the serialized alarm cannot read exact issue state', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const file = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      if (args.some((s) => s.includes('/runs?'))) return JSON.stringify({ total_count: 0, workflow_runs: [] });
      throw new Error('private issue API error');
    });

    expect(checkClock({ env: { REPO, GITHUB_OUTPUT: file }, execImpl, now: NOW, since: SINCE, live: true })).toBe(1);
    expect(readOutputs(file)).toMatchObject({ alert: 'false', action: '' });
  });
  it('keeps the disabled clock false flag without reading or transitioning state', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
    const execImpl = vi.fn();

    expect(checkClock({ env: { REPO, GITHUB_OUTPUT: file }, execImpl, now: NOW, since: SINCE, live: false })).toBe(0);
    expect(readOutputs(file)).toEqual({ alert: 'false', action: '' });
    expect(execImpl).not.toHaveBeenCalled();
  });
  it('checkClock and the watch give the same decision for misses and grace', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const since of [SINCE, '2026-09-14T14:40:00Z']) {
      const file = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
      const execImpl = gh([]);
      const expected = watchClock({ execImpl, repo: REPO, now: NOW, since, dryRun: true, log: () => {} });
      expect(checkClock({ env: { REPO, GITHUB_OUTPUT: file }, execImpl, now: NOW, since, live: true })).toBe(0);
      const outputs = readOutputs(file);
      expect(outputs.alert).toBe(String(expected.alert));
      expect(outputs.action).toBe(expected.alert ? 'open' : '');
    }
  });
  it('dry-run prints the canonical body even when coverage is healthy and cannot dispatch', () => {
    const logged = vi.spyOn(console, 'log').mockImplementation(() => {});
    const execImpl = gh(runs);
    const file = join(mkdtempSync(join(tmpdir(), 'clock-')), 'out');
    expect(checkClock({ env: { REPO, DRY_RUN: 'true', GITHUB_OUTPUT: file }, execImpl, now: NOW, since: SINCE, live: true })).toBe(0);
    expect(readOutputs(file)).toMatchObject({ alert: 'false', action: 'close', dispatch_poll: 'false' });
    expect(logged.mock.calls.flat().join('\n')).toContain('Clock is not firing');
    expect(logged.mock.calls.flat().join('\n')).toContain('Poll coverage recovered below the alert threshold on main.');
    expect(logged.mock.calls.flat().join('\n')).toContain('later coverage gap will open a new incident');
    expect(execImpl.mock.calls.every(([, args]) => args[0] === 'api')).toBe(true);
    expect(execImpl).toHaveBeenCalledTimes(1);
  });
  it('the deployed poll path invokes the watch when live, preserves dry-run, and fails on unreadable history', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const dryRun of [false, true]) {
      const execImpl = gh([]);
      const { fetchImpl } = discord(baseRoutes([]));
      expect(await poll({ env: { ...env, DRY_RUN: dryRun ? '1' : '' }, fetchImpl, sleepImpl, execImpl, now: NOW, clockLive: true, clockSince: SINCE })).toBe(0);
      expect(execImpl.mock.calls.some(([, args]) => args[0] === 'workflow')).toBe(!dryRun);
    }
    const { fetchImpl } = discord(baseRoutes([]));
    expect(await poll({ env, fetchImpl, sleepImpl, execImpl: () => { throw new Error('unreadable'); }, now: NOW, clockLive: true, clockSince: SINCE })).toBe(1);
  });
  it('the deployed clock flag controls the default poll path', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const execImpl = gh([]);
    const { fetchImpl } = discord(baseRoutes([]));
    const now = Date.parse(CLOCK_LIVE_SINCE) + 5 * 60_000;

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now })).toBe(0);
    expect(execImpl.mock.calls.some(([, args]) => args.some((arg) => arg.includes('bot-chat-poll.yml/runs?')))).toBe(CLOCK_LIVE);
  });
});
