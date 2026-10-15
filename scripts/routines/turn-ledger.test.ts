import { describe, expect, it, vi } from 'vitest';
import { aggregateUsage, fetchUsageRecords, parseArgs } from './turn-ledger.mjs';

describe('turn ledger', () => {
  it('aggregates turns, models, recorded pools, and plan-limit failures', () => {
    expect(
      aggregateUsage([
        { routineName: 'Ops', model: 'sonnet', numTurns: 10, usage: { token_pool: 'weekly' } },
        { routineName: 'Ops', model: 'sonnet', numTurns: 20, diagnostic: { assistantError: 'rate_limit' } },
        { routineName: 'Desk', model: 'haiku', numTurns: null },
      ]),
    ).toEqual([
      { routine: 'Desk', runs: 1, totalTurns: 0, meanTurns: null, model: 'haiku', limitFailures: 0, tokenPools: [] },
      { routine: 'Ops', runs: 2, totalTurns: 30, meanTurns: 15, model: 'sonnet', limitFailures: 1, tokenPools: ['weekly'] },
    ]);
  });

  it('uses paginated fixture API responses and tolerates expired artifacts', async () => {
    const ghImpl = vi.fn(async (args: string[]) => {
      const endpoint = args[1];
      if (endpoint.includes('/actions/artifacts')) {
        return {
          stdout: JSON.stringify([
            { artifacts: [{ name: 'routine-usage', created_at: '2026-10-02T00:00:00Z', workflow_run: { id: 10 } }] },
            {
              artifacts: [
                { name: 'routine-usage', created_at: '2026-10-02T00:00:00Z', expired: true, workflow_run: { id: 11 } },
                { name: 'routine-usage', created_at: '2026-09-01T00:00:00Z', workflow_run: { id: 12 } },
              ],
            },
          ]),
        };
      }
      throw new Error(`unexpected endpoint ${endpoint}`);
    });
    const readArtifact = vi.fn(async () => ({ routineName: 'Ops', model: 'sonnet', numTurns: 12 }));

    await expect(fetchUsageRecords({ since: '2026-10-01T00:00:00Z', ghImpl, repo: 'owner/repo', readArtifact })).resolves.toEqual([
      { routineName: 'Ops', model: 'sonnet', numTurns: 12 },
    ]);
    expect(readArtifact).toHaveBeenCalledTimes(1);
    expect(ghImpl).toHaveBeenCalledTimes(1);
  });

  it('parses the default window and rejects invalid windows', () => {
    expect(parseArgs(['--dry-run'])).toEqual({ days: 7, dryRun: true });
    expect(() => parseArgs(['--days', '0'])).toThrow('positive');
  });
});
