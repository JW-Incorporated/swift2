import * as childProcess from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { init, parse } from 'es-module-lexer';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs modules
import { ROUTE_BY_CLASS, encodePlan, planActions } from './actions/plan.mjs';
// @ts-expect-error plain .mjs module
import { ACTION_HANDLERS, ACTION_RUNNERS, disagreementMetric, main, planReplay, routeDecisions, summaryMarkdown } from './route.mjs';
// @ts-expect-error plain .mjs module
import { routerStore } from './router-store.mjs';

vi.mock('node:child_process', { spy: true });
afterEach(() => vi.restoreAllMocks());

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const config = JSON.parse(await readFile(path.join(ROOT, 'config/tidewatch.json'), 'utf8'));
const verified = { verified_at: '2026-10-15T12:00:00.000Z' };

const decision = (overrides = {}) => ({
  id: 'decision-1', class: 'normal_news', confidence: 1, answers: {},
  watch_item: { story_id: 'story-1' }, ...overrides,
});

function memoryStore(pending: { decisions: ReturnType<typeof decision>[],
  timelines: Map<string, unknown> } = { decisions: [], timelines: new Map() }) {
  const refs = new Map<string, string>();
  return {
    refs,
    loadPending: vi.fn(async () => pending),
    record: vi.fn(async (id: string, ref: string) => {
      if (refs.has(id)) return false;
      refs.set(id, ref);
      return true;
    }),
  };
}

function guardedClient(row = decision({ action: 'shadow_hold_injection', answers: { injection: true } })) {
  const operations: Array<Record<string, unknown>> = [];
  const client = {
    from(table: string) {
      if (table === 'watch_decision') return {
        select(columns: string) {
          operations.push({ table, operation: 'select', columns });
          return { eq: () => ({ is: () => ({ order: () => ({
            limit: async () => ({ data: [row], error: null }),
          }) }) }) };
        },
        update(values: Record<string, unknown>) {
          operations.push({ table, operation: 'update', values });
          Object.assign(row, values);
          return { eq: () => ({ is: () => ({
            select: async () => ({ data: [{ id: row.id }], error: null }),
          }) }) };
        },
      };
      if (table === 'story_timeline') return {
        select(columns: string) {
          operations.push({ table, operation: 'select', columns });
          return { in: async () => ({ data: [{ story_id: 'story-1', ...verified }], error: null }) };
        },
      };
      throw new Error(`unexpected table: ${table}`);
    },
  };
  return { client, operations, row };
}

async function transitiveLocalImports(entry: string) {
  const visited = new Set<string>();
  async function resolveSource(base: string) {
    const candidates = [base, ...['.ts', '.tsx', '.js', '.mjs'].map((extension) => `${base}${extension}`),
      ...['index.ts', 'index.tsx', 'index.js', 'index.mjs'].map((name) => path.join(base, name))];
    for (const candidate of candidates) {
      try {
        await readFile(candidate, 'utf8');
        return candidate;
      } catch (error) {
        if (!['ENOENT', 'EISDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      }
    }
    throw new Error(`Cannot resolve source import: ${base}`);
  }
  async function resolveImport(specifier: string, importer: string) {
    if (specifier.startsWith('.')) return resolveSource(path.resolve(path.dirname(importer), specifier));
    const workspace = specifier.match(/^@swift2\/([^/]+)(?:\/(.+))?$/);
    if (!workspace) return null;
    return resolveSource(path.join(ROOT, 'packages', workspace[1], 'src', workspace[2] || 'index'));
  }
  async function walk(file: string) {
    const relative = path.relative(ROOT, file).replaceAll('\\', '/');
    if (visited.has(relative)) return;
    visited.add(relative);
    const source = await readFile(file, 'utf8');
    await init;
    const [imports] = parse(source);
    for (const imported of imports) {
      if (!imported.n || imported.d !== -1) continue;
      const resolved = await resolveImport(imported.n, file);
      if (resolved) await walk(resolved);
    }
  }
  await walk(entry);
  return [...visited];
}

describe('Tidewatch shadow action router', () => {
  it.each(Object.entries(ROUTE_BY_CLASS).filter(([classId]) => classId !== 'privacy_redline'))('routes %s through the approved %s path', (classId, route) => {
    const plan = planActions(classId, {}, 1, verified, config);
    expect(plan).toMatchObject({ classId, impliedClass: classId, state: 'planned' });
    expect(plan.actions).toEqual([route]);
  });

  it('plans approved prerequisites and the normal-news outfit side route', () => {
    expect(planActions('critical_breaking', {}, 1, null, config).actions)
      .toEqual(['fact_check', 'verify', 'critical_fast_path']);
    expect(planActions('correction_debunk', {}, 1, null, config).actions)
      .toEqual(['verify', 'retraction_path']);
    const answers = { jev: { q_outfit: { type: 'noul', probability: 0.9 } } };
    expect(planActions('normal_news', answers, 1, null, config).actions)
      .toEqual(['normal_flow', 'outfit_matcher_queue']);
  });

  it('holds injection and below-threshold decisions without changing thresholds', () => {
    expect(planActions('normal_news', { injection: true }, 1, null, config).actions)
      .toEqual(['hold_injection']);
    expect(planActions('normal_news', {}, 0.79, null, config).actions)
      .toEqual(['hold_below_threshold']);
  });

  it('keeps shadow routing free of network, process, and non-store side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const processSpies = ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'].map((name) =>
      vi.spyOn(childProcess, name as 'spawn'));
    const guarded = guardedClient(decision({
      class: 'merch_outfit', action: 'shadow_outfit_matcher_queue',
    }));
    await main([], { config, client: guarded.client, env: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const spy of processSpies) expect(spy).not.toHaveBeenCalled();
    expect(guarded.operations).toEqual([
      { table: 'watch_decision', operation: 'select', columns: '*, watch_item(story_id)' },
      { table: 'story_timeline', operation: 'select', columns: '*' },
      { table: 'watch_decision', operation: 'update', values: {
        action_ref: expect.stringContaining('outfit_matcher_queue'),
      } },
    ]);
    expect(guarded.row.action).toBe('shadow_outfit_matcher_queue');
  });

  it('keeps publisher-capable modules out of the static route import graph', async () => {
    const imports = await transitiveLocalImports(path.join(ROOT, 'scripts/tidewatch/route.mjs'));
    expect(ACTION_HANDLERS).toMatchObject({ critical_fast_path: expect.any(Function) });
    expect(imports).not.toContain('scripts/tidewatch/actions/site.mjs');
    expect(imports).not.toContain('scripts/tidewatch/actions/merch.mjs');
    expect(Object.keys(ACTION_RUNNERS)).toEqual(['store_drop_draft', 'fan_merch_curation',
      'outfit_matcher_queue']);
    const loadStoreDropDraft = vi.fn();
    const emitOfficial = vi.fn();
    const recordAction = vi.fn();
    for (const [action, runner] of Object.entries(ACTION_RUNNERS)) {
      await runner(decision({ class: action === 'store_drop_draft' ? 'merch_official'
        : action === 'fan_merch_curation' ? 'merch_fan' : 'merch_outfit' }), {
        live: false, loadStoreDropDraft, emitOfficial, recordAction,
      });
    }
    expect(loadStoreDropDraft).not.toHaveBeenCalled();
    expect(emitOfficial).not.toHaveBeenCalled();
    expect(recordAction).not.toHaveBeenCalled();

    const forbidden = imports.filter((file) => [
      /^scripts\/social\//,
      /(^|\/)(push|notifications?)(\/|[-.])/,
      /(^|\/)(site|revalidate)(\/|[-.])/,
      /(^|\/)(gh|github|issues?)(\/|[-.])/,
    ].some((pattern) => pattern.test(file)));
    expect(forbidden).toEqual([]);
  });

  it('does not execute any registered runner or handler when live is unset or false', async () => {
    const runners = Object.fromEntries(Object.keys(ACTION_RUNNERS)
      .map((action) => [action, vi.fn()]));
    const handlers = Object.fromEntries(Object.keys(ACTION_HANDLERS)
      .map((action) => [action, vi.fn()]));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const decisions = [
      decision({ id: 'critical', class: 'critical_breaking' }),
      decision({ id: 'official', class: 'merch_official' }),
      decision({ id: 'fan', class: 'merch_fan' }),
      decision({ id: 'outfit', class: 'merch_outfit' }),
    ];
    for (const env of [{}, { TIDEWATCH_ROUTER_LIVE: 'false' }]) {
      await main([], { config, store: memoryStore({ decisions, timelines: new Map() }), env,
        actionHandlers: handlers, actionRunners: runners, log: vi.fn() });
    }
    for (const effect of [...Object.values(runners), ...Object.values(handlers)]) {
      expect(effect).not.toHaveBeenCalled();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('holds shadow_hold decisions with no live action even above the act threshold', async () => {
    const enabledConfig = structuredClone(config);
    enabledConfig.classes.critical_breaking.enabled = true;
    const handler = vi.fn(async () => true);
    const store = memoryStore();
    const result = await routeDecisions({
      decisions: [decision({ class: 'critical_breaking', confidence: 1, action: 'shadow_hold_budget' })],
      store, config: enabledConfig, live: true,
      actionHandlers: { critical_fast_path: handler }, actionRunners: {} });
    expect(result.plans[0]).toMatchObject({ state: 'held', actions: ['hold_shadow'] });
    expect(handler).not.toHaveBeenCalled();
    expect(result.failures).toEqual([]);
  });

  it('vetoes publish for a redline-hinted item or a privacy_redline class even when enabled at high confidence', async () => {
    const enabledConfig = structuredClone(config);
    enabledConfig.classes.critical_personal.enabled = true;
    enabledConfig.classes.privacy_redline.enabled = true;
    const personal = vi.fn(async () => true);
    const drop = vi.fn(async () => true);
    const store = memoryStore();
    const result = await routeDecisions({
      decisions: [
        decision({ id: 'hinted', class: 'critical_personal', confidence: 1, answers: { redline_hint: 'body' } }),
        decision({ id: 'redline', class: 'privacy_redline', confidence: 1, answers: {} }),
      ],
      store, config: enabledConfig, live: true,
      actionHandlers: { critical_personal_path: personal, drop_hash_only: drop }, actionRunners: {} });
    expect(result.plans.map((plan) => plan.actions)).toEqual([['hold_redline'], ['hold_redline']]);
    expect(result.plans.every((plan) => plan.state === 'held')).toBe(true);
    expect(personal).not.toHaveBeenCalled();
    expect(drop).not.toHaveBeenCalled();
  });

  it('records a stable action_ref once when the same decision is rerun', async () => {
    const store = memoryStore();
    const first = await routeDecisions({ decisions: [decision()], store, config });
    const ref = store.refs.get('decision-1');
    const second = await routeDecisions({ decisions: [decision()], store, config });
    expect(first.recorded).toBe(1);
    expect(second.recorded).toBe(0);
    expect(store.refs.get('decision-1')).toBe(ref);
    expect(ref).toBe(encodePlan(first.plans[0]));
  });

  it('makes the real recorder conditional on an empty action_ref', async () => {
    const refs = new Map<string, string>();
    const update = vi.fn((values: { action_ref: string }) => ({
      eq: (_column: string, id: string) => ({
        is: (_refColumn: string, expected: null) => ({
          select: async () => {
            expect(expected).toBeNull();
            if (refs.has(id)) return { data: [], error: null };
            refs.set(id, values.action_ref);
            return { data: [{ id }], error: null };
          },
        }),
      }),
    }));
    const store = routerStore({ from: () => ({ update }) });
    expect(await store.record('decision-1', 'plan')).toBe(true);
    expect(await store.record('decision-1', 'different-plan')).toBe(false);
    expect(refs.get('decision-1')).toBe('plan');
    expect(update).toHaveBeenCalledWith({ action_ref: 'plan' });
  });

  it('measures threshold-qualified answer routes against final-class routes', () => {
    const rumorConflict = planActions('normal_news', { jev: { q_class: {
      type: 'choice', optionId: 'rumor_or_unconfirmed', probabilities: { rumor_or_unconfirmed: 0.9 },
    } } }, 1, null, config);
    const redlineConflict = planActions('normal_news', { jev: { q_speculation: {
      type: 'noul', probability: 0.9,
    } } }, 1, null, config);
    const lowConfidenceHaikuEscalation = planActions('normal_news', { jev: { q_class: {
      type: 'choice', optionId: 'rumor_or_unconfirmed', probabilities: { rumor_or_unconfirmed: 0.4 },
    } }, haiku: { class: 'normal_news' } }, 1, null, config);
    const agreements = Array.from({ length: 18 }, () => planActions('normal_news', { jev: { q_class: {
      type: 'choice', optionId: 'general_news', probabilities: { general_news: 0.9 },
    } } }, 1, null, config));
    const metric = disagreementMetric([rumorConflict, redlineConflict,
      lowConfidenceHaikuEscalation, ...agreements]);
    expect(metric).toEqual({ count: 2, total: 20, rate: 0.1, stop: false });
    const stopped = disagreementMetric([rumorConflict, redlineConflict, rumorConflict, ...agreements]);
    expect(stopped).toEqual({ count: 3, total: 21, rate: 3 / 21, stop: true });
    expect(summaryMarkdown({ mode: 'shadow-router', read: 21, recorded: 21, disagreement: stopped }))
      .toContain('3/21 (14.3%) — STOP');
  });

  it('labels the 600-item labelled corpus as a route-table smoke test', async () => {
    const replay = JSON.parse(await readFile(path.join(ROOT,
      'docs/projects/tidewatch/replay/replay.json'), 'utf8'));
    const result = planReplay(replay, config, 600);
    expect(result.read).toBe(600);
    expect(result.mode).toBe('route-table-smoke-test');
    expect(result.recordedInputs).toBe(0);
    expect(result.plans).toHaveLength(600);
    expect(result.plans.every((plan: { state: string; classId: string }) =>
      plan.state === (plan.classId === 'privacy_redline' ? 'held' : 'planned'))).toBe(true);
    expect(summaryMarkdown(result)).toContain('Tidewatch route-table smoke test');
  });

  it('replays recorded classifier answers and confidence when present', () => {
    const result = planReplay({ items: [{ class: 'normal_news', confidence: 0.5,
      answers: { jev: { q_class: { type: 'choice', optionId: 'general_news',
        probabilities: { general_news: 0.9 } } } } }] }, config, 1);
    expect(result.mode).toBe('classifier-replay');
    expect(result.recordedInputs).toBe(1);
    expect(result.plans[0].actions).toEqual(['hold_below_threshold']);
  });

  it('respects TIDEWATCH_FREEZE before reading or writing decisions', async () => {
    const store = memoryStore();
    const result = await main([], { config, store, env: { TIDEWATCH_FREEZE: 'true' } });
    expect(result.frozen).toBe(true);
    expect(store.loadPending).not.toHaveBeenCalled();
    expect(store.record).not.toHaveBeenCalled();
  });

  it('runs after classification in the gated sweep and prints aggregates only', async () => {
    const workflow = await readFile(path.join(ROOT, '.github/workflows/tidewatch.yml'), 'utf8');
    const router = await readFile(path.join(ROOT, 'scripts/tidewatch/route.mjs'), 'utf8');
    expect(workflow.indexOf('node scripts/tidewatch/route.mjs'))
      .toBeGreaterThan(workflow.indexOf('node scripts/tidewatch/classify.mjs'));
    expect(workflow).toContain('name: Plan and route decisions');
    expect(workflow).toContain('TIDEWATCH_ROUTER_LIVE: ${{ vars.TIDEWATCH_ROUTER_LIVE }}');
    expect(workflow).toContain('TIDEWATCH_FREEZE: ${{ vars.TIDEWATCH_FREEZE }}');
    expect(router).toContain('GITHUB_STEP_SUMMARY');
  });
});
