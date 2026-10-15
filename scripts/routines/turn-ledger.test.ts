import { describe, expect, it, vi } from 'vitest';
import { aggregateUsage, fetchUsageRecords, isUsageArtifactName, parseArgs } from './turn-ledger.mjs';

describe('turn ledger', () => {
  it('aggregates turns, models, recorded pools, and plan-limit failures', () => {
    expect(
      aggregateUsage([
        { routineName: 'Ops', model: 'sonnet', numTurns: 10, usage: { token_pool: 'weekly' } },
        { routineName: 'Ops', model: 'sonnet', numTurns: 20, diagnostic: { assistantError: 'rate_limit' } },
        { routineName: 'Ops', model: 'sonnet', numTurns: 5, result: 'Claude weekly limit reached' },
        { routineName: 'Desk', model: 'haiku', numTurns: null },
      ]),
    ).toEqual([
      { routine: 'Desk', runs: 1, totalTurns: 0, meanTurns: null, model: 'haiku', limitFailures: 0, tokenPools: [] },
      { routine: 'Ops', runs: 3, totalTurns: 35, meanTurns: 35 / 3, model: 'sonnet', limitFailures: 2, tokenPools: ['weekly'] },
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

  it('counts a run with two usage artifacts once per artifact and still reads a legacy one', async () => {
    const ghImpl = vi.fn(async () => ({
      stdout: JSON.stringify([
        {
          artifacts: [
            { name: 'routine-usage-judgment', created_at: '2026-10-02T00:00:00Z', workflow_run: { id: 20 } },
            { name: 'routine-usage-craft', created_at: '2026-10-02T00:00:00Z', workflow_run: { id: 20 } },
            { name: 'routine-usage', created_at: '2026-10-02T00:00:00Z', workflow_run: { id: 21 } },
            { name: 'some-other-artifact', created_at: '2026-10-02T00:00:00Z', workflow_run: { id: 20 } },
            { name: 'routine-usages', created_at: '2026-10-02T00:00:00Z', workflow_run: { id: 22 } },
          ],
        },
      ]),
    }));
    const turns: Record<string, number> = { 'routine-usage-judgment': 40, 'routine-usage-craft': 60, 'routine-usage': 7 };
    const readArtifact = vi.fn(async (_run: number, artifact: { name: string }) => ({
      routineName: artifact.name === 'routine-usage' ? 'Ops' : `Vault ${artifact.name}`,
      numTurns: turns[artifact.name],
    }));
    const records = await fetchUsageRecords({ since: '2026-10-01T00:00:00Z', ghImpl, repo: 'owner/repo', readArtifact });
    expect(readArtifact).toHaveBeenCalledTimes(3);
    expect(records.map((r: { numTurns: number }) => r.numTurns)).toEqual([40, 60, 7]);
    const rows = aggregateUsage(records);
    expect(rows.reduce((n, r) => n + r.runs, 0)).toBe(3);
    expect(rows.reduce((n, r) => n + r.totalTurns, 0)).toBe(107);
  });

  it('matches the usage artifact name by exact name or routine-usage- prefix only', () => {
    expect(isUsageArtifactName('routine-usage')).toBe(true);
    expect(isUsageArtifactName('routine-usage-craft')).toBe(true);
    expect(isUsageArtifactName('routine-usages')).toBe(false);
    expect(isUsageArtifactName(undefined)).toBe(false);
  });

  it('parses the default window and rejects invalid windows', () => {
    expect(parseArgs(['--dry-run'])).toEqual({ days: 7, dryRun: true });
    expect(() => parseArgs(['--days', '0'])).toThrow('positive');
  });
});
