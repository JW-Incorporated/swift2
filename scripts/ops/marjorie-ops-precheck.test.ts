import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { NEEDS_ACTION_THRESHOLD, buildOpsSignals, main, runPrecheck } from './marjorie-ops-precheck.mjs';

const empty = { alerts: [], runs: [], prs: [], opsFixes: [], chasePlan: {}, now: Date.parse('2026-10-15T12:00:00Z') };
const noul = (...probabilities: number[]) => {
  let index = 0;
  return { ask: vi.fn(async () => ({ answers: { needs_action: { type: 'noul', probability: probabilities[index++] ?? 0 } } })) };
};

describe('marjorie ops signal collector', () => {
  it('deterministically finds the prompt mechanical checks', () => {
    const signals = buildOpsSignals({ ...empty,
      alerts: [{ number: 7, title: 'Watchdog: prod smoke check failing', createdAt: '2026-10-15T10:00:00Z' }],
      runs: [{ databaseId: 10, workflowName: 'worker', status: 'completed', conclusion: 'failure', event: 'schedule', createdAt: '2026-10-15T11:00:00Z' }],
      prs: [
        { number: 20, title: 'old red', createdAt: '2026-10-14T00:00:00Z', updatedAt: '2026-10-15T01:00:00Z', statusCheckRollup: [{ name: 'build', conclusion: 'FAILURE', completedAt: '2026-10-15T01:00:00Z' }] },
        { number: 21, title: 'held content', headRefName: 'vault/day', labels: [{ name: 'hold' }], createdAt: '2026-10-15T11:00:00Z', statusCheckRollup: [] },
      ],
      chasePlan: { nudges: [{ issue: 30 }], humanActions: [], pendingHumanActions: [], brief: { held: [] } },
      opsFixes: [{ number: 40, title: 'repair routine' }],
    });
    expect(signals.map((signal: { kind: string }) => signal.kind)).toEqual([
      'watchdog-alert', 'red-workflow', 'stuck-pr', 'held-content', 'chase-work', 'ops-fix',
    ]);
    expect(signals[0].context).toContain('ledger state unhandled');
    expect(NEEDS_ACTION_THRESHOLD).toBe(0.7);
  });
});

describe('marjorie ops precheck acceptance fixtures', () => {
  it('skips the agent when there are no signals', async () => {
    const client = noul();
    await expect(runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect: async () => empty, clientFactory: () => client }))
      .resolves.toMatchObject({ mode: 'skip', signals: [], flagged: [] });
    expect(client.ask).not.toHaveBeenCalled();
  });

  it('runs the agent with only the item at or above the raw probability threshold', async () => {
    const collect = async () => ({ ...empty, alerts: [
      { number: 1, title: 'Watchdog: first', createdAt: '2026-10-15T11:00:00Z' },
      { number: 2, title: 'Watchdog: second', createdAt: '2026-10-15T11:00:00Z' },
    ] });
    const result = await runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect, clientFactory: () => noul(0.69, 0.7) });
    expect(result.mode).toBe('flagged');
    expect(result.flagged.map((signal: { id: string }) => signal.id)).toEqual(['watchdog-alert:#2']);
    expect(result.signals.map((signal: { probability: number }) => signal.probability)).toEqual([0.69, 0.7]);
  });

  it('runs the full agent prompt when Jev is missing', async () => {
    const clientFactory = vi.fn();
    await expect(runPrecheck({ env: {}, collect: async () => ({ ...empty, alerts: [{ number: 1, title: 'Watchdog: x' }] }), clientFactory }))
      .resolves.toMatchObject({ mode: 'fail-open', reason: 'TYPESAFE_API_KEY missing', flagged: [] });
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it('writes the filtered artifact, outputs, and measurable summary', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ops-precheck-'));
    try {
      const output = path.join(dir, 'output');
      const summary = path.join(dir, 'summary');
      const artifact = path.join(dir, 'precheck.json');
      await main([artifact], {
        env: { TYPESAFE_API_KEY: 'fixture', GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary },
        collect: async () => ({ ...empty, alerts: [{ number: 9, title: 'Watchdog: act', createdAt: '2026-10-15T11:00:00Z' }] }),
        clientFactory: () => noul(0.9),
      });
      expect(JSON.parse(readFileSync(artifact, 'utf8')).flagged).toHaveLength(1);
      expect(readFileSync(output, 'utf8')).toContain('handled=false\nflagged=1');
      expect(readFileSync(summary, 'utf8')).toContain('agent: ran(1 flagged)');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('fails open on a data read or Jev error', async () => {
    await expect(runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect: async () => { throw new Error('offline'); } }))
      .resolves.toMatchObject({ mode: 'fail-open', reason: 'data read failed: offline' });
    await expect(runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect: async () => ({ ...empty, alerts: [{ number: 1 }] }), clientFactory: () => ({ ask: async () => { throw new Error('timeout'); } }) }))
      .resolves.toMatchObject({ mode: 'fail-open', reason: 'Jev failed: timeout' });
  });
});
