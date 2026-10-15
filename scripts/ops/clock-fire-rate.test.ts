import { describe, expect, it, vi } from 'vitest';
import { buildFireRates, main, measureActual, parseArgs } from './clock-fire-rate.mjs';

describe('clock fire rate', () => {
  it('calculates expected fires and counts clock-dispatched runs by actor', () => {
    const table = [{ workflow: 'worker.yml', minGapMinutes: 25 }];
    const rows = buildFireRates({
      hours: 48,
      pollRuns: [{ event: 'schedule' }, { event: 'workflow_dispatch' }, { event: 'workflow_dispatch' }],
      tableRuns: new Map([
        [
          'worker.yml',
          [
            { event: 'workflow_dispatch', actor: { login: 'github-actions[bot]' } },
            { event: 'workflow_dispatch', actor: { login: 'person' } },
            { event: 'schedule', actor: { login: 'github-actions[bot]' } },
          ],
        ],
      ]),
      table,
    });
    expect(rows).toEqual([
      expect.objectContaining({ workflow: 'bot-chat-poll.yml', expected: 576, actual: 3, breakdown: 'schedule=1, workflow_dispatch=2' }),
      expect.objectContaining({ workflow: 'worker.yml', expected: 115.2, actual: 1, method: 'workflow_dispatch by github-actions[bot]', breakdown: 'workflow_dispatch=1' }),
    ]);
  });

  it('falls back to all runs when fixture data cannot distinguish actor or event', () => {
    expect(measureActual([{ id: 1 }, { id: 2 }], 'clock')).toEqual({ actual: 2, method: 'all runs (actor/event unavailable)', breakdown: 'unknown=2' });
  });

  it('counts a mostly redispatched poll as real clock fires', () => {
    const runs = [{ event: 'schedule' }, ...Array.from({ length: 574 }, () => ({ event: 'workflow_dispatch' }))];
    expect(measureActual(runs, 'poll')).toMatchObject({ actual: 575, breakdown: 'schedule=1, workflow_dispatch=574' });
  });

  it('reads paginated fixture API responses without network access', async () => {
    const ghImpl = vi.fn(async (args: string[]) => ({
      stdout: args[1].includes('bot-chat-poll')
        ? JSON.stringify([
            { workflow_runs: [{ event: 'schedule', actor: { login: 'github-actions[bot]' } }] },
            { workflow_runs: [{ event: 'schedule', actor: { login: 'github-actions[bot]' } }] },
          ])
        : JSON.stringify([{ workflow_runs: [{ id: 1 }, { id: 2 }] }]),
    }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const rows = await main(['--hours', '1'], {
      now: new Date('2026-10-14T12:00:00Z'),
      ghImpl,
      repo: 'owner/repo',
      table: [{ workflow: 'worker.yml', minGapMinutes: 30 }],
    });
    log.mockRestore();
    expect(rows[0]).toMatchObject({ expected: 12, actual: 2, breakdown: 'schedule=2' });
    expect(rows[1]).toMatchObject({ expected: 2, actual: 2, method: 'all runs (actor/event unavailable)', breakdown: 'unknown=2' });
    expect(ghImpl).toHaveBeenCalledTimes(2);
  });

  it('parses default hours and rejects invalid values', () => {
    expect(parseArgs([])).toEqual({ hours: 48 });
    expect(() => parseArgs(['--hours', '-1'])).toThrow('positive');
  });
});
