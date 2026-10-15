import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs modules
import { ROUTE_BY_CLASS, encodePlan, planActions } from './actions/plan.mjs';
// @ts-expect-error plain .mjs module
import { OUTBOUND_ADAPTER_NAMES, disagreementMetric, main, planReplay, routeDecisions,
  summaryMarkdown } from './route.mjs';
// @ts-expect-error plain .mjs module
import { validate } from '../ops/set-switch.mjs';
// @ts-expect-error plain .mjs module
import { routerStore } from './router-store.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const config = JSON.parse(await readFile(path.join(ROOT, 'config/tidewatch.json'), 'utf8'));
const verified = { verified_at: '2026-10-15T12:00:00.000Z' };

const decision = (overrides = {}) => ({
  id: 'decision-1', class: 'normal_news', confidence: 1, answers: {},
  watch_item: { story_id: 'story-1' }, ...overrides,
});

function memoryStore() {
  const refs = new Map<string, string>();
  return {
    refs,
    loadPending: vi.fn(async () => ({ decisions: [], timelines: new Map() })),
    record: vi.fn(async (id: string, ref: string) => {
      if (refs.has(id)) return false;
      refs.set(id, ref);
      return true;
    }),
  };
}

describe('Tidewatch shadow action router', () => {
  it.each(Object.entries(ROUTE_BY_CLASS))('routes %s through the approved %s path', (classId, route) => {
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

  it('keeps switch-off shadow routing free of all outbound side effects', async () => {
    const outbound = Object.fromEntries(OUTBOUND_ADAPTER_NAMES.map((name) => [name, vi.fn()]));
    const store = memoryStore();
    await routeDecisions({ decisions: [decision()], timelines: new Map([['story-1', verified]]),
      store, config, outbound, live: false });
    for (const adapter of Object.values(outbound)) expect(adapter).not.toHaveBeenCalled();
    expect(store.refs.get('decision-1')).toContain('normal_flow');
  });

  it('refuses the reserved live switch and keeps it owner-only', async () => {
    await expect(routeDecisions({ decisions: [], store: memoryStore(), config, live: true }))
      .rejects.toThrow(/shadow-write only/);
    expect(validate('TIDEWATCH_ROUTER_LIVE', 'true', 'test')).toMatch(/founder-only/);
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
    expect(update).toHaveBeenCalledWith({ action: 'shadow_route_planned', action_ref: 'plan' });
  });

  it('reports classifier/router disagreement counts and the >10% stop signal', () => {
    const disagreeing = planActions('normal_news', { jev: { q_class: {
      type: 'choice', optionId: 'rumor_or_unconfirmed', probabilities: { rumor_or_unconfirmed: 0.9 },
    } } }, 1, null, config);
    const metric = disagreementMetric([disagreeing, disagreeing, disagreeing,
      ...Array.from({ length: 17 }, () => planActions('normal_news', {}, 1, null, config))]);
    expect(metric).toEqual({ count: 3, total: 20, rate: 0.15, stop: true });
    expect(summaryMarkdown({ read: 20, recorded: 20, disagreement: metric }))
      .toContain('3/20 (15.0%) — STOP');
  });

  it('plans the first 600 replay labels without an unexpected route', async () => {
    const replay = JSON.parse(await readFile(path.join(ROOT,
      'docs/projects/tidewatch/replay/replay.json'), 'utf8'));
    const result = planReplay(replay, config, 600);
    expect(result.read).toBe(600);
    expect(result.plans).toHaveLength(600);
    expect(result.plans.every((plan: { state: string }) => plan.state === 'planned')).toBe(true);
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
    expect(workflow).toContain('TIDEWATCH_ROUTER_LIVE: ${{ vars.TIDEWATCH_ROUTER_LIVE }}');
    expect(workflow).toContain('TIDEWATCH_FREEZE: ${{ vars.TIDEWATCH_FREEZE }}');
    expect(router).toContain('GITHUB_STEP_SUMMARY');
  });
});
