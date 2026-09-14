import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain mjs
import { briefDecision, guard } from './lib/brief-guard.mjs';

const CURRENT = { id: 20, head_branch: 'main', event: 'workflow_dispatch', created_at: '2026-09-14T12:00:10Z' };
const BASIC = { ref: 'refs/heads/main', event: 'workflow_dispatch', current: CURRENT };
const ENV = { GITHUB_REF: BASIC.ref, GITHUB_EVENT_NAME: BASIC.event, GITHUB_REPOSITORY: 'JW-Incorporated/swift2', GITHUB_RUN_ID: '20', GITHUB_RUN_ATTEMPT: '1' };
const run = (over: Record<string, unknown> = {}) => ({ ...CURRENT, id: 10, created_at: '2026-09-14T12:00:00Z', ...over });

describe('brief first-job guard', () => {
  it('ends a second ordinary run that UTC day, including after a failed/cancelled first run', () => {
    for (const conclusion of ['success', 'failure', 'cancelled']) expect(briefDecision({ ...BASIC, runs: [run({ conclusion })] })).toEqual({ proceed: false, reason: 'earlier-run' });
    expect(briefDecision({ ...BASIC, runs: [run({ created_at: '2026-09-13T23:59:59Z' })] }).proceed).toBe(true);
    expect(briefDecision({ ...BASIC, runs: [run({ id: 21, created_at: CURRENT.created_at })] }).proceed).toBe(true);
    expect(briefDecision({ ...BASIC, runs: [run({ created_at: CURRENT.created_at })] }).proceed).toBe(false);
  });
  it('rejects every rerun before allowing a new boolean main manual force', () => {
    expect(briefDecision({ ...BASIC, delivered: true }).proceed).toBe(false);
    expect(briefDecision({ ...BASIC, attempt: 2 }).proceed).toBe(false);
    expect(briefDecision({ ...BASIC, force: true, attempt: 2, delivered: true })).toEqual({ proceed: false, reason: 'rerun' });
    expect(briefDecision({ ...BASIC, force: true, attempt: 1, delivered: true })).toEqual({ proceed: true, reason: 'forced' });
    expect(briefDecision({ ...BASIC, force: 'true', delivered: true }).proceed).toBe(false);
    expect(briefDecision({ ...BASIC, event: 'schedule', force: true, delivered: true }).proceed).toBe(false);
    expect(briefDecision({ ...BASIC, ref: 'refs/heads/feature', force: true }).proceed).toBe(false);
  });
  it('ignores feature runs and future runs and reads closed-issue comment markers', () => {
    expect(briefDecision({ ...BASIC, runs: [run({ head_branch: 'feature' }), run({ created_at: '2026-09-14T12:01:00Z' })] }).proceed).toBe(true);
    const log = vi.fn();
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      const endpoint = args.at(-1)!;
      if (endpoint.endsWith('/runs/20')) return JSON.stringify(CURRENT);
      if (endpoint.includes('/runs?')) return JSON.stringify({ total_count: 1, workflow_runs: [CURRENT] });
      if (endpoint.includes('/comments?')) return JSON.stringify([{ body: '<!-- discord-message-id: 123456789012345678 -->' }]);
      return JSON.stringify([{ number: 1, state: 'closed', title: "Founders' Brief — 2026-09-14", created_at: '2026-09-14T12:00:00Z', body: 'private fixture' }]);
    });
    expect(guard({ env: ENV, execImpl, log })).toBe(0);
    expect(log).toHaveBeenCalledWith('brief guard: already-delivered');
    expect(log.mock.calls.flat().join('')).not.toContain('private fixture');
    expect(execImpl.mock.calls.some(([, args]) => args.at(-1)?.includes('state=all'))).toBe(true);
  });
  it('finds a prior-UTC-day marker for the current LA date without matching unrelated older issues', () => {
    const current = { ...CURRENT, created_at: '2026-09-14T01:00:00Z' };
    const issue = (title: string) => ({ number: 1, title, created_at: '2026-09-13T08:00:00Z', body: '<!-- discord-message-id: 123 -->' });
    const runGuard = (issues: ReturnType<typeof issue>[]) => {
      const execImpl = vi.fn((_cmd: string, args: string[]) => {
        const endpoint = args.at(-1)!;
        if (endpoint.endsWith('/runs/20')) return JSON.stringify(current);
        if (endpoint.includes('/runs?')) return JSON.stringify({ total_count: 1, workflow_runs: [current] });
        if (endpoint.includes('/issues?')) {
          const since = new URL(endpoint, 'https://api.github.test/').searchParams.get('since')!;
          return JSON.stringify(issues.filter((candidate) => Date.parse(candidate.created_at) >= Date.parse(since)));
        }
        return JSON.stringify([]);
      });
      const log = vi.fn();
      expect(guard({ env: ENV, execImpl, log })).toBe(0);
      return log;
    };
    expect(runGuard([issue("Founders' Brief \u2014 2026-09-12")])).toHaveBeenCalledWith('brief guard: first-run');
    expect(runGuard([{ ...issue("Founders' Brief \u2014 2026-09-13"), created_at: '2026-09-13T23:59:00Z' }])).toHaveBeenCalledWith('brief guard: already-delivered');
  });
  it('fails closed on an API error, incomplete run list, or pagination cap; force bypass is read-free', () => {
    for (const execImpl of [() => { throw new Error('private error'); }, (_cmd: string, args: string[]) => JSON.stringify(args.at(-1)?.endsWith('/runs/20') ? CURRENT : { total_count: 101, workflow_runs: [CURRENT] })]) {
      const log = vi.fn();
      expect(guard({ env: ENV, execImpl, log })).toBe(1);
      expect(log).toHaveBeenCalledWith('brief guard: unreadable-history');
    }
    const capped = vi.fn((_cmd: string, args: string[]) => JSON.stringify(args.at(-1)?.endsWith('/runs/20') ? CURRENT : args.at(-1)?.includes('/runs?') ? { total_count: 1, workflow_runs: [CURRENT] } : Array(100).fill({})));
    const cappedLog = vi.fn();
    expect(guard({ env: ENV, execImpl: capped, log: cappedLog })).toBe(1);
    expect(cappedLog).toHaveBeenCalledWith('brief guard: unreadable-history');
    const execImpl = vi.fn();
    expect(guard({ env: { ...ENV, FORCE: 'true' }, execImpl, log: () => {} })).toBe(0);
    expect(execImpl).not.toHaveBeenCalled();

    const rerunLog = vi.fn();
    expect(guard({ env: { ...ENV, FORCE: 'true', GITHUB_RUN_ATTEMPT: '2' }, execImpl, log: rerunLog })).toBe(0);
    expect(rerunLog).toHaveBeenCalledWith('brief guard: rerun');
    expect(execImpl).not.toHaveBeenCalled();
  });
  it('workflow serializes guard through delivery, pins main and has an explicit false force default', () => {
    const text = readFileSync('.github/workflows/routine-marjorie-brief.yml', 'utf8').replace(/\r\n/g, '\n');
    expect(text).toMatch(/concurrency:\n {2}group: marjorie-brief-day\n {2}cancel-in-progress: false/);
    expect(text).toMatch(/force:\n {8}description:.*\n {8}type: boolean\n {8}default: false/);
    const guardJob = text.slice(text.indexOf('  guard:'), text.indexOf('\n  run:'));
    expect(guardJob).toContain("if: github.ref == 'refs/heads/main'");
    expect(guardJob).toContain('ref: main');
    expect(guardJob).toContain('actions: read');
    expect(guardJob).toContain('issues: read');
    expect(guardJob).not.toContain('environment:');
    expect(guardJob).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
    expect(text).toMatch(/ {2}run:\n {4}needs: guard\n {4}if: needs.guard.outputs.proceed == 'true'/);
    expect(text).toContain('needs: run');
    expect(text).toContain('cron: "0 12 * * *"');
  });
});
