import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { todayLA } from '../marjorie/lib/brief-sections.mjs';
// @ts-expect-error plain .mjs module
import { MUST_RUN_REFRESH_MS, NEEDS_ACTION_THRESHOLD, buildOpsSignals, collectOpsSnapshot, main, runPrecheck } from './marjorie-ops-precheck.mjs';

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

  it('collects a complete fixture through stubbed gh and keeps only trusted ops-fix candidates', async () => {
    const gh = vi.fn(async (args: string[]) => {
      if (args[0] === 'run') return { stdout: JSON.stringify([{ databaseId: 10, workflowName: 'routine-x', headBranch: 'main' }]) };
      if (args[0] === 'pr') return { stdout: '[]' };
      if (args[0] === 'api') {
        if (args[1].includes('/joey/')) return { stdout: 'write\n' };
        throw new Error('not a collaborator');
      }
      if (args.includes('watchdog-alert')) return { stdout: JSON.stringify([{ number: 7, title: 'Watchdog: x' }]) };
      return { stdout: JSON.stringify([
        { number: 40, title: 'bot fix', author: { login: 'github-actions[bot]' }, labels: [{ name: 'routine-failure' }] },
        { number: 41, title: 'member fix', author: { login: 'joey' }, labels: [{ name: 'marjorie-filed' }] },
        { number: 42, title: 'outsider fix', author: { login: 'rando' }, labels: [{ name: 'marjorie-filed' }] },
      ]) };
    });
    const chaseState = vi.fn(async () => ({ now: empty.now }));
    const snapshot = await collectOpsSnapshot({ gh, repo: 'o/r', now: empty.now, chaseState });
    expect(snapshot).toMatchObject({
      alerts: [{ number: 7 }], runs: [{ databaseId: 10 }], prs: [],
      opsFixes: [{ number: 40 }, { number: 41 }],
    });
    const runCall = gh.mock.calls.find(([args]) => args[0] === 'run')?.[0];
    expect(runCall).toEqual(expect.arrayContaining(['--branch', 'main']));
    expect(runCall?.[runCall.indexOf('--json') + 1]).toContain('headBranch');
    expect(chaseState).toHaveBeenCalledWith('o/r', { now: empty.now });
  });
});

describe('bot-authored ledger markers', () => {
  const alert = (comments: unknown[]) => buildOpsSignals({ ...empty, alerts: [{ number: 9, title: "Watchdog: no Founders' Brief", createdAt: '2026-10-15T11:00:00Z', comments }] })[0].context;
  const bot = { login: 'claude[bot]', type: 'Bot' };
  const marker = (action: string) => `<!-- marjorie-ops-handled date=${todayLA()} action=${action} -->`;
  it('treats a claude Bot handled marker as handled', () => {
    expect(alert([{ body: marker('comment-only'), author: bot }])).toContain('ledger state handled-awaiting-watchdog');
  });
  it('treats a claude Bot escalated marker as escalated', () => {
    expect(alert([{ body: marker('escalate'), author: bot }])).toContain('ledger state escalated');
  });
  it('ignores an outsider-authored marker', () => {
    expect(alert([{ body: marker('escalate'), author: { login: 'rando', type: 'User' } }])).toContain('ledger state unhandled');
    expect(alert([{ body: marker('escalate'), author: { login: 'claude', type: 'User' } }])).toContain('ledger state unhandled');
  });
});

describe('collectOpsSnapshot comment re-read', () => {
  const marker = `<!-- marjorie-ops-handled date=${todayLA()} action=comment-only -->`;
  const make = (rest: () => unknown) => vi.fn(async (args: string[]) => {
    if (args[0] === 'api') return rest();
    if (args[0] === 'run' || args[0] === 'pr') return { stdout: '[]' };
    if (args.includes('watchdog-alert')) return { stdout: JSON.stringify([{ number: 7, title: "Watchdog: no Founders' Brief", createdAt: '2026-10-15T11:00:00Z', comments: [{ body: marker, author: { login: 'claude' }, viewerDidAuthor: false }] }]) };
    return { stdout: '[]' };
  });
  it('treats a REST-read Bot handled marker as handled', async () => {
    const gh = make(() => ({ stdout: JSON.stringify([[{ body: marker, user: { login: 'claude[bot]', type: 'Bot' } }]]) }));
    const snapshot = await collectOpsSnapshot({ gh, repo: 'o/r', now: empty.now, chaseState: async () => ({ now: empty.now }) });
    expect(buildOpsSignals(snapshot)[0].context).toContain('ledger state handled-awaiting-watchdog');
  });
  it('keeps list data, warns, and stays unhandled when the REST read throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const gh = make(() => { throw new Error('boom'); });
    const snapshot = await collectOpsSnapshot({ gh, repo: 'o/r', now: empty.now, chaseState: async () => ({ now: empty.now }) });
    expect(buildOpsSignals(snapshot)[0].context).toContain('ledger state unhandled');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('REST comment re-read failed for #7'));
    warn.mockRestore();
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
      { number: 1, title: "Watchdog: no Founders' Brief", createdAt: '2026-10-15T11:00:00Z' },
      { number: 2, title: 'Watchdog: Karen scanned but filed no tickets', createdAt: '2026-10-15T11:00:00Z' },
    ] });
    const result = await runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect, clientFactory: () => noul(0.69, 0.7) });
    expect(result.mode).toBe('flagged');
    expect(result.flagged.map((signal: { id: string }) => signal.id)).toEqual(['watchdog-alert:#2']);
    expect(result.signals.map((signal: { probability: number }) => signal.probability)).toEqual([0.69, 0.7]);
  });

  it('must-runs an unhandled watchdog alert open more than 12 hours without asking Jev', async () => {
    const client = noul(0.6);
    const collect = async () => ({ ...empty, alerts: [{
      number: 3, title: "Watchdog: no Founders' Brief", createdAt: '2026-10-14T00:00:00Z', comments: [],
    }] });
    const result = await runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect, clientFactory: () => client });
    expect(result).toMatchObject({ mode: 'flagged', flagged: [{ id: 'watchdog-alert:#3', mustRun: true }] });
    expect(client.ask).not.toHaveBeenCalled();
  });

  it('must-runs red main routine and deploy workflows while Jev alone decides other runs', async () => {
    const client = noul(0.6);
    const collect = async () => ({ ...empty, runs: [
      { databaseId: 10, workflowName: 'routine-vault-run', headBranch: 'main', status: 'completed', conclusion: 'failure', createdAt: '2026-10-15T11:00:00Z' },
      { databaseId: 11, workflowName: 'production-deploy', headBranch: 'main', status: 'completed', conclusion: 'timed_out', createdAt: '2026-10-15T11:00:00Z' },
      { databaseId: 12, workflowName: 'routine-feature', headBranch: 'feature/x', status: 'completed', conclusion: 'failure', createdAt: '2026-10-15T11:00:00Z' },
      { databaseId: 13, workflowName: 'worker', headBranch: 'main', status: 'completed', conclusion: 'failure', createdAt: '2026-10-15T11:00:00Z' },
    ] });
    const result = await runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect, clientFactory: () => client });
    expect(result.flagged.map((signal: { id: string }) => signal.id)).toEqual(['red-workflow:10', 'red-workflow:11']);
    expect(result.signals.map((signal: { id: string }) => signal.id)).not.toContain('red-workflow:12');
    expect(client.ask).toHaveBeenCalledTimes(1);
  });

  it('must-runs prod-smoke and every founder-facing watchdog handler', async () => {
    const client = noul(0.6);
    const collect = async () => ({ ...empty, alerts: [
      { number: 4, title: 'Watchdog: prod smoke check failing', createdAt: '2026-10-15T11:00:00Z' },
      { number: 5, title: 'Watchdog: no FB group export closed in 9 days', createdAt: '2026-10-15T11:00:00Z' },
    ] });
    const result = await runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect, clientFactory: () => client });
    expect(result.flagged).toEqual(result.signals);
    expect(result.flagged.every((signal: { mustRun?: boolean }) => signal.mustRun)).toBe(true);
    expect(client.ask).not.toHaveBeenCalled();
  });

  it('must-runs chase work and pre-filtered trusted ops-fix candidates', async () => {
    const client = noul(0.23, 0.24);
    const collect = async () => ({ ...empty,
      chasePlan: { nudges: [{ issue: 30 }], humanActions: [], pendingHumanActions: [], brief: { held: [] } },
      opsFixes: [{ number: 40, title: 'trusted repair' }],
    });
    const result = await runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect, clientFactory: () => client });
    expect(result.flagged.map((signal: { id: string }) => signal.id)).toEqual(['chase-work', 'ops-fix:#40']);
    expect(client.ask).not.toHaveBeenCalled();
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
        collect: async () => ({ ...empty, alerts: [{ number: 9, title: "Watchdog: no Founders' Brief", createdAt: '2026-10-14T00:00:00Z' }] }),
        clientFactory: () => noul(0.9),
      });
      expect(JSON.parse(readFileSync(artifact, 'utf8')).flagged).toHaveLength(1);
      expect(readFileSync(output, 'utf8')).toContain('handled=false\nflagged=1');
      expect(readFileSync(summary, 'utf8')).toContain('agent: ran(1 flagged)');
      expect(readFileSync(summary, 'utf8')).toContain('| watchdog-alert:#9 | must-run |');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('fails open on a data read or Jev error', async () => {
    await expect(runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect: async () => { throw new Error('offline'); } }))
      .resolves.toMatchObject({ mode: 'fail-open', reason: 'data read failed: offline' });
    await expect(runPrecheck({ env: { TYPESAFE_API_KEY: 'fixture' }, collect: async () => ({ ...empty, alerts: [{ number: 1, title: "Watchdog: no Founders' Brief", createdAt: '2026-10-15T11:00:00Z' }] }), clientFactory: () => ({ ask: async () => { throw new Error('timeout'); } }) }))
      .resolves.toMatchObject({ mode: 'fail-open', reason: 'Jev failed: timeout' });
  });
});

describe("must-run fingerprint gate", () => {
  const now = Date.parse("2026-10-15T12:00:00Z");
  const collect = async () => ({ ...empty, alerts: [{ number: 3, title: "Watchdog: no Founders' Brief", createdAt: "2026-10-14T00:00:00Z", comments: [] }] });
  const env = { TYPESAFE_API_KEY: "fixture" };
  const items = { "watchdog-alert:#3": "unhandled" };
  const flaggedIds = ["watchdog-alert:#3"];
  const at = (ms: number) => new Date(now - ms).toISOString();

  it("skips when the must-run set is unchanged since the last handled run", async () => {
    const result = await runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled: { at: at(3_600_000), items, flaggedIds } });
    expect(result).toMatchObject({ mode: "skip" });
    expect(result.reason).toContain("must-run unchanged since");
  });

  it("skips when the set only shrank to already-handled items", async () => {
    const lastHandled = { at: at(3_600_000), items: { ...items, "watchdog-alert:#99": "unhandled" }, flaggedIds: [...flaggedIds, "watchdog-alert:#99"] };
    await expect(runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled })).resolves.toMatchObject({ mode: "skip" });
  });

  it("runs when an item is new or its state changed", async () => {
    await expect(runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled: { at: at(3_600_000), items: {}, flaggedIds } })).resolves.toMatchObject({ mode: "flagged" });
    await expect(runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled: { at: at(3_600_000), items: { "watchdog-alert:#3": "escalated" }, flaggedIds } })).resolves.toMatchObject({ mode: "flagged" });
  });

  it("runs when the last handled run is 24h old or more", async () => {
    await expect(runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled: { at: at(MUST_RUN_REFRESH_MS), items, flaggedIds } })).resolves.toMatchObject({ mode: "flagged" });
  });

  const withOther = async () => { const base = await collect(); return { ...base, alerts: [...base.alerts, { number: 4, title: "Watchdog: Karen scanned but filed no tickets", createdAt: "2026-10-15T11:00:00Z" }] }; };

  it("runs when a new non-must-run signal is flagged", async () => {
    await expect(runPrecheck({ env, collect: withOther, clientFactory: () => noul(0.9), lastHandled: { at: at(3_600_000), items, flaggedIds } })).resolves.toMatchObject({ mode: "flagged" });
  });

  it("skips when an unchanged non-must-run flagged id sits beside an unchanged must-run state", async () => {
    const first = await runPrecheck({ env, collect: withOther, clientFactory: () => noul(0.9), lastHandled: null });
    const ids = (first.flaggedIds as string[]);
    expect(ids).toHaveLength(2);
    await expect(runPrecheck({ env, collect: withOther, clientFactory: () => noul(0.9), lastHandled: { at: at(3_600_000), items, flaggedIds: ids } })).resolves.toMatchObject({ mode: "skip" });
    await expect(runPrecheck({ env, collect: withOther, clientFactory: () => noul(0.9), lastHandled: { at: at(3_600_000), items: { "watchdog-alert:#3": "escalated" }, flaggedIds: ids } })).resolves.toMatchObject({ mode: "flagged" });
  });

  it("runs on an old-format record and writes the new format", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "ops-handled-"));
    try {
      await main([path.join(dir, "precheck.json")], { env, collect, clientFactory: () => noul(), lastHandled: { at: at(3_600_000), items } });
      expect(JSON.parse(readFileSync(path.join(dir, "marjorie-ops-handled.json"), "utf8"))).toMatchObject({ items, flaggedIds });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("fails open on an error even with an unchanged fingerprint", async () => {
    const lastHandled = { at: at(3_600_000), items, flaggedIds };
    await expect(runPrecheck({ env, collect: async () => { throw new Error("offline"); }, lastHandled })).resolves.toMatchObject({ mode: "fail-open" });
    await expect(runPrecheck({ env: {}, collect, lastHandled })).resolves.toMatchObject({ mode: "fail-open" });
  });

  it("writes the handled-state file only when the agent will run", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "ops-handled-"));
    try {
      const artifact = path.join(dir, "precheck.json");
      await main([artifact], { env, collect, clientFactory: () => noul(), lastHandled: null });
      expect(JSON.parse(readFileSync(path.join(dir, "marjorie-ops-handled.json"), "utf8")).items).toEqual(items);
      rmSync(path.join(dir, "marjorie-ops-handled.json"));
      await main([artifact], { env, collect, clientFactory: () => noul(), lastHandled: { at: at(1000), items, flaggedIds } });
      expect(existsSync(path.join(dir, "marjorie-ops-handled.json"))).toBe(false);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("drops vanished ids from the saved map so a reappearing item counts as new", async () => {
    const lastHandled = { at: at(3_600_000), items: { ...items, "watchdog-alert:#99": "unhandled" }, flaggedIds: [...flaggedIds, "watchdog-alert:#99"] };
    const result = await runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled });
    expect(result.pruned).toEqual({ at: lastHandled.at, items, flaggedIds });
    const gone = await runPrecheck({ env, collect: async () => empty, clientFactory: () => noul(), lastHandled });
    expect(gone).toMatchObject({ mode: "skip", pruned: { at: lastHandled.at, items: {}, flaggedIds: [] } });
    await expect(runPrecheck({ env, collect, clientFactory: () => noul(), lastHandled: gone.pruned })).resolves.toMatchObject({ mode: "flagged" });
  });

  it("workflow never compares an output to an unquoted boolean", () => {
    const wf = readFileSync(".github/workflows/routine-marjorie-ops.yml", "utf8");
    expect(wf.split(/\r?\n/).filter((line) => /\bif:.*(==|!=)\s*(true|false)\b/.test(line))).toEqual([]);
    expect(wf).toContain("steps.stage.outputs.present == 'true'");
  });

  it("workflow uploads hidden files and saves the fingerprint only after a successful run", () => {
    const wf = readFileSync(".github/workflows/routine-marjorie-ops.yml", "utf8").replace(/\r\n/g, "\n");
    expect(wf).toMatch(/path: \.scratch\/\*\.json\n\s+include-hidden-files: true/);
    expect(wf).toMatch(/path: \.scratch\/marjorie-ops-precheck\.json\n\s+include-hidden-files: true/);
    const save = wf.slice(wf.indexOf("  record-handled:"));
    expect(save).toContain("needs.run.result == 'success'");
    expect(save).toContain("actions/cache/save@");
    expect(wf.slice(0, wf.indexOf("  record-handled:")).match(/actions\/cache\/save@/g)).toHaveLength(1);
  });
});

describe('routine-marjorie-ops workflow safeguards', () => {
  const workflow = readFileSync('.github/workflows/routine-marjorie-ops.yml', 'utf8').replace(/\r\n/g, '\n');

  it('restores the trusted auto-defer author on the precheck step', () => {
    const step = workflow.slice(workflow.indexOf('name: Deterministic signal collection'), workflow.indexOf('name: Record a precheck crash'));
    expect(step).toContain('AUTO_DEFER_AUTHOR: sffan15-sys');
    expect(step).toContain('SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}');
  });

  it('uploads a default fail-open artifact before checkout and overwrites it after precheck', () => {
    expect(workflow.indexOf('name: Seed fail-open precheck artifact')).toBeLessThan(workflow.indexOf('uses: actions/checkout@v7'));
    expect(workflow).toMatch(/name: Upload fail-open precheck artifact[\s\S]*?name: marjorie-ops-precheck/);
    expect(workflow).toMatch(/path: \.scratch\/\*\.json\n\s+include-hidden-files: true\n\s+retention-days: 1\n\s+overwrite: true/);
  });
});
