import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLOCK_ALERT_TITLE, clockRunsPath, newestClockRun, watchClock } from './lib/clock-watch.mjs';

const NOW = Date.parse('2026-09-14T18:00:00Z');
const REPO = 'JW-Incorporated/swift2';
const run = (minutesAgo: number, type = 'User') => ({
  event: 'workflow_dispatch', created_at: new Date(NOW - minutesAgo * 60_000).toISOString(),
  html_url: `https://github.com/run/${minutesAgo}`, triggering_actor: { login: type === 'Bot' ? 'github-actions[bot]' : 'key-owner', type },
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

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('watchClock', () => {
  it('raises clock-silent once the newest clock-started poll run is over 20 minutes old', () => {
    const g = gh({ runs: [run(25), run(30)] });
    expect(watchClock({ repo: REPO, execImpl: g.execImpl, now: NOW })).toBe(0);
    expect(g.alarms()).toHaveLength(1);
    expect(g.alarms()[0]).toContain('stage=clock-silent');
  });

  it('does nothing while the clock started the poll within 20 minutes', () => {
    const g = gh({ runs: [run(4)] });
    watchClock({ repo: REPO, execImpl: g.execImpl, now: NOW });
    expect(g.calls.map((a) => a[0])).toEqual(['api']);
  });

  it("ignores the alarm's own bot-started poll runs", () => {
    const g = gh({ runs: [run(2, 'Bot'), run(40)] });
    expect(newestClockRun([run(2, 'Bot'), run(40)])?.html_url).toBe('https://github.com/run/40');
    watchClock({ repo: REPO, execImpl: g.execImpl, now: NOW });
    expect(g.alarms()).toHaveLength(1);
  });

  it('raises nothing while its alert is open, with no clock run in 24 h, on a dry run, or when GitHub fails', () => {
    for (const g of [gh({ runs: [run(40)], open: [{ title: CLOCK_ALERT_TITLE }] }), gh({ runs: [] }), gh({ failApi: true })]) {
      expect(watchClock({ repo: REPO, execImpl: g.execImpl, now: NOW })).toBe(0);
      expect(g.alarms()).toEqual([]);
    }
    const dry = gh({ runs: [run(40)] });
    watchClock({ repo: REPO, execImpl: dry.execImpl, now: NOW, dryRun: true });
    expect(dry.alarms()).toEqual([]);
  });

  it("reads only the poll's dispatches of the last 24 h", () => {
    expect(clockRunsPath(REPO, NOW)).toBe('repos/JW-Incorporated/swift2/actions/workflows/bot-chat-poll.yml/runs?event=workflow_dispatch&per_page=50&created=%3E%3D2026-09-13T18%3A00%3A00Z');
  });
});
