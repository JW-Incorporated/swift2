import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLOCK_ALERT_TITLE, CLOCK_RUN_TITLE, clockRunsPath, clockState, newestClockRun, watchClock } from './lib/clock-watch.mjs';

const NOW = Date.parse('2026-09-14T18:00:00Z');
const SINCE = '2026-09-14T12:00:00Z'; // the clock went live 6 h ago
const REPO = 'JW-Incorporated/swift2';
const run = (minutesAgo: number, over: Record<string, unknown> = {}) => ({
  event: 'workflow_dispatch', display_title: CLOCK_RUN_TITLE, head_branch: 'main',
  created_at: new Date(NOW - minutesAgo * 60_000).toISOString(), html_url: `https://github.com/run/${minutesAgo}`, ...over,
});

function gh({ runs = [] as unknown[], open = [] as unknown[], failApi = false } = {}) {
  const calls: string[][] = [];
  const execImpl = vi.fn((_cmd: string, args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      if (failApi) throw new Error('HTTP 403');
      return JSON.stringify({ workflow_runs: runs });
    }
    return args[0] === 'issue' ? JSON.stringify(open) : '';
  });
  const alarms = () => calls.filter((a) => a[0] === 'workflow' && a[2] === 'bot-chat-alarm.yml');
  return { calls, execImpl, alarms };
}
const watch = (g: ReturnType<typeof gh>, over: Record<string, unknown> = {}) => watchClock({ repo: REPO, execImpl: g.execImpl, now: NOW, since: SINCE, ...over });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('watchClock', () => {
  it('raises clock-silent once the newest clock run is over 20 minutes old', () => {
    const g = gh({ runs: [run(25), run(30)] });
    expect(watch(g)).toBe(0);
    expect(g.alarms()).toHaveLength(1);
    expect(g.alarms()[0]).toContain('stage=clock-silent');
  });

  it('does nothing while the clock started the poll within 20 minutes', () => {
    const g = gh({ runs: [run(4)] });
    watch(g);
    expect(g.calls.map((a) => a[0])).toEqual(['api']);
  });

  it('counts only clock-named runs on main since the clock went live (Codex R1 #6, #7)', () => {
    const runs = [run(2, { display_title: 'bot-chat-poll' }), run(3, { head_branch: 'feature/test' }), run(400), run(40)];
    expect(newestClockRun(runs, SINCE)?.html_url).toBe('https://github.com/run/40');
  });

  it('treats no clock run at all, once past the grace, as silent (Codex R1 #5)', () => {
    const g = gh({ runs: [] });
    watch(g);
    expect(g.alarms()).toHaveLength(1);
  });

  it('raises no alarm in the first 30 minutes after the clock goes live (Codex R1 #6)', () => {
    const since = new Date(NOW - 10 * 60_000).toISOString();
    expect(clockState(null, NOW, since)).toBe('starting');
    const g = gh({ runs: [run(90)] });
    watch(g, { since });
    expect(g.calls.map((a) => a[0])).toEqual(['api']);
  });

  it('raises nothing while its alert is open, on a dry run, or when GitHub fails', () => {
    for (const g of [gh({ runs: [run(40)], open: [{ title: CLOCK_ALERT_TITLE }] }), gh({ failApi: true })]) {
      expect(watch(g)).toBe(0);
      expect(g.alarms()).toEqual([]);
    }
    const dry = gh({ runs: [run(40)] });
    watch(dry, { dryRun: true });
    expect(dry.alarms()).toEqual([]);
  });

  it("reads the poll's main-branch dispatches since the clock went live, at most 24 h back", () => {
    expect(clockRunsPath(REPO, NOW, SINCE)).toBe('repos/JW-Incorporated/swift2/actions/workflows/bot-chat-poll.yml/runs?event=workflow_dispatch&branch=main&per_page=50&created=%3E%3D2026-09-14T12%3A00%3A00Z');
    expect(clockRunsPath(REPO, NOW, '2026-09-01T00:00:00Z')).toContain('created=%3E%3D2026-09-13T18%3A00%3A00Z');
  });
});
