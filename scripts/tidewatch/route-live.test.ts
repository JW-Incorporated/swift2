import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { createSiteAction, requestLiveRevalidation } from './actions/site.mjs';
// @ts-expect-error plain .mjs module
import { main, routeDecisions } from './route.mjs';
// @ts-expect-error plain .mjs module
import { routerStore } from './router-store.mjs';
// @ts-expect-error plain .mjs module
import { validate } from '../ops/set-switch.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const config = JSON.parse(await readFile(path.join(ROOT, 'config/tidewatch.json'), 'utf8'));
const timeline = { verified_at: '2026-10-15T12:00:00.000Z' };

function criticalDecision(id = 'decision-1') {
  return { id, class: 'critical_breaking', confidence: 1, answers: {},
    watch_item: { story_id: `story-${id}` } };
}

function recordingStore(writes: Array<Record<string, unknown>> = []) {
  return {
    record: vi.fn(async (id: string, actionRef: string) => {
      writes.push({ table: 'watch_decision', id, values: { action_ref: actionRef } });
      return true;
    }),
    replace: vi.fn(async (id: string, _expectedRef: string, actionRef: string) => {
      writes.push({ table: 'watch_decision', id, values: { action_ref: actionRef } });
      return true;
    }),
  };
}

function retryingStore() {
  const refs = new Map<string, string>();
  const base = criticalDecision();
  return {
    refs,
    loadPending: vi.fn(async () => {
      const actionRef = refs.get(base.id) ?? null;
      let retryable = actionRef === null;
      if (actionRef) {
        try { retryable = JSON.parse(actionRef).routerStatus === 'retryable'; } catch { retryable = false; }
      }
      return { decisions: retryable ? [{ ...base, action_ref: actionRef }] : [],
        timelines: new Map([[base.watch_item.story_id, timeline]]) };
    }),
    record: vi.fn(async (id: string, actionRef: string, expectedRef: string | null) => {
      if ((refs.get(id) ?? null) !== expectedRef) return false;
      refs.set(id, actionRef);
      return true;
    }),
    replace: vi.fn(async (id: string, expectedRef: string, actionRef: string) => {
      if (refs.get(id) !== expectedRef) return false;
      refs.set(id, actionRef);
      return true;
    }),
  };
}

function liveConfig() {
  const enabled = structuredClone(config);
  enabled.classes.critical_breaking.enabled = true;
  return enabled;
}

async function runLive(store: ReturnType<typeof retryingStore>, handler: ReturnType<typeof vi.fn>) {
  return main([], { config: liveConfig(), store, env: { TIDEWATCH_ROUTER_LIVE: 'true' },
    actionHandlers: { critical_fast_path: handler }, actionRunners: {}, log: vi.fn(), warn: vi.fn() });
}

describe('Tidewatch live site action gates', () => {
  it('reaches the worker current_item write only with the live switch and class enabled', async () => {
    const writeCurrentItem = vi.fn(async () => ({ id: 'current-1', redlineOk: true }));
    const requestRevalidation = vi.fn(async () => ({ revalidated: true }));
    const siteAction = createSiteAction({
      loadSiteStory: vi.fn(async () => ({
        eraId: 'tloas', imageUrl: 'https://preview.example/image.jpg', sources: [],
        item: { statusHint: 'confirmed' },
      })),
      writeCurrentItem,
      requestRevalidation,
    });
    const actionContext = { db: {}, env: {
      REVALIDATE_ORIGIN: 'https://preview.example', REVALIDATE_SECRET: 'fixture-secret',
    } };
    const timelines = new Map([['story-decision-1', timeline]]);
    const enabledConfig = structuredClone(config);
    enabledConfig.classes.critical_breaking.enabled = true;

    await routeDecisions({ decisions: [criticalDecision()], timelines,
      store: recordingStore(), config: enabledConfig, live: false,
      actionHandlers: { critical_fast_path: siteAction }, actionContext });
    await routeDecisions({ decisions: [criticalDecision()], timelines,
      store: recordingStore(), config, live: true,
      actionHandlers: { critical_fast_path: siteAction }, actionContext });
    expect(writeCurrentItem).not.toHaveBeenCalled();

    await routeDecisions({ decisions: [criticalDecision()], timelines,
      store: recordingStore(), config: enabledConfig, live: true,
      actionHandlers: { critical_fast_path: siteAction }, actionContext });
    expect(writeCurrentItem).toHaveBeenCalledOnce();
    expect(requestRevalidation).toHaveBeenCalledWith(expect.objectContaining({
      origin: 'https://preview.example', eraId: 'tloas',
    }));
    expect(validate('TIDEWATCH_ROUTER_LIVE', 'true', 'test')).toMatch(/founder-only/);
  });

  it('records only action_ref during the registered 600-item replay', async () => {
    const replay = JSON.parse(await readFile(path.join(ROOT,
      'docs/projects/tidewatch/replay/replay.json'), 'utf8'));
    const decisions = replay.items.slice(0, 600).map((item: Record<string, unknown>, index: number) => ({
      id: `replay-${index}`, class: item.class ?? item.expectedClass, confidence: 1, answers: {},
      watch_item: { story_id: `replay-story-${index}` },
    }));
    const writes: Array<Record<string, unknown>> = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await routeDecisions({ decisions, store: recordingStore(writes), config });
    expect(result).toMatchObject({ read: 600, recorded: 600 });
    expect(writes).toHaveLength(600);
    expect(writes.every((write) => write.table === 'watch_decision'
      && Object.keys(write.values as object).join(',') === 'action_ref')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps shadow action_ref writes byte-identical with the router off', async () => {
    const writes: Array<Record<string, unknown>> = [];
    await routeDecisions({ decisions: [
      criticalDecision('shadow-critical'),
      { ...criticalDecision('shadow-merch'), class: 'merch_outfit' },
      { ...criticalDecision('shadow-news'), class: 'normal_news' },
    ], store: recordingStore(writes), config, live: false });
    expect(writes).toMatchInlineSnapshot(`
      [
        {
          "id": "shadow-critical",
          "table": "watch_decision",
          "values": {
            "action_ref": "{"version":1,"class":"critical_breaking","impliedClass":"critical_breaking","state":"planned","actions":["fact_check","verify","critical_fast_path"]}",
          },
        },
        {
          "id": "shadow-merch",
          "table": "watch_decision",
          "values": {
            "action_ref": "{"version":1,"class":"merch_outfit","impliedClass":"merch_outfit","state":"planned","actions":["outfit_matcher_queue"]}",
          },
        },
        {
          "id": "shadow-news",
          "table": "watch_decision",
          "values": {
            "action_ref": "{"version":1,"class":"normal_news","impliedClass":"normal_news","state":"planned","actions":["normal_flow"]}",
          },
        },
      ]
    `);
  });

  it('finishes a live sweep before reporting a per-decision action failure', async () => {
    const decisions = ['decision-1', 'decision-2', 'decision-3'].map(criticalDecision);
    const refs = new Map<string, string>();
    const store = {
      loadPending: vi.fn(async () => ({ decisions,
        timelines: new Map(decisions.map((item) => [item.watch_item.story_id, timeline])) })),
      record: vi.fn(async (id: string, actionRef: string) => {
        refs.set(id, actionRef);
        return true;
      }),
      replace: vi.fn(async (id: string, _expectedRef: string, actionRef: string) => {
        refs.set(id, actionRef);
        return true;
      }),
    };
    const handler = vi.fn(async ({ decision }: { decision: { id: string } }) => {
      if (decision.id === 'decision-2') throw new Error('isolated failure');
      return { published: true };
    });
    const warn = vi.fn();
    await expect(main([], { config: liveConfig(), store,
      env: { TIDEWATCH_ROUTER_LIVE: 'true' },
      actionHandlers: { critical_fast_path: handler }, actionRunners: {},
      log: vi.fn(), warn })).rejects.toThrow('1 Tidewatch decision action(s) failed');

    expect(handler.mock.calls.map(([input]) => input.decision.id))
      .toEqual(['decision-1', 'decision-2', 'decision-3']);
    expect(JSON.parse(refs.get('decision-1') ?? '')).toMatchObject({ routerStatus: 'succeeded' });
    expect(JSON.parse(refs.get('decision-2') ?? '')).toMatchObject({
      routerStatus: 'retryable', attempts: 1,
    });
    expect(JSON.parse(refs.get('decision-3') ?? '')).toMatchObject({ routerStatus: 'succeeded' });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(
      /^\[tidewatch-route] warning: decision decision-2 .* retryable attempt 1\/3$/));
  });

  it('releases a thrown action as retryable and retries it on the next run', async () => {
    const store = retryingStore();
    const handler = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ published: true });
    await expect(runLive(store, handler)).rejects
      .toThrow('1 Tidewatch decision action(s) failed');
    expect(JSON.parse(store.refs.get('decision-1') ?? '')).toMatchObject({
      routerStatus: 'retryable', attempts: 1,
      reason: 'critical_fast_path:threw:Error',
    });

    await runLive(store, handler);
    expect(JSON.parse(store.refs.get('decision-1') ?? '')).toMatchObject({
      routerStatus: 'succeeded', attempts: 2,
    });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not retry a successful action on a later run', async () => {
    const store = retryingStore();
    const handler = vi.fn(async () => ({ published: true }));
    await runLive(store, handler);
    const second = await runLive(store, handler);
    expect(second.read).toBe(0);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('parks repeated action failures at the attempt cap with a reason', async () => {
    const store = retryingStore();
    const handler = vi.fn(async () => ({ published: false, reason: 'not_configured' }));
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await expect(runLive(store, handler)).rejects
        .toThrow('1 Tidewatch decision action(s) failed');
    }
    expect(JSON.parse(store.refs.get('decision-1') ?? '')).toMatchObject({
      routerStatus: 'parked', attempts: 3,
      reason: 'critical_fast_path:not_configured',
    });
    const parked = await runLive(store, handler);
    expect(parked.read).toBe(0);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('loads retryable action_ref rows before fresh decisions in live mode', async () => {
    const filters: Array<{ column: string; pattern: string }> = [];
    const retry = { ...criticalDecision('retry'), action_ref: '{"routerStatus":"retryable"}' };
    const fresh = { ...criticalDecision('fresh'), action_ref: null };
    const client = { from: (table: string) => {
      if (table === 'story_timeline') return { select: () => ({
        in: async () => ({ data: [], error: null }),
      }) };
      let mode = '';
      const query = {
        select: () => query,
        eq: () => query,
        like: (column: string, pattern: string) => {
          filters.push({ column, pattern }); mode = 'retry'; return query;
        },
        is: () => { mode = 'fresh'; return query; },
        order: () => query,
        limit: async (limit: number) => ({
          data: (mode === 'retry' ? [retry] : [fresh]).slice(0, limit), error: null,
        }),
      };
      return query;
    } };
    const pending = await routerStore(client, { includeRetries: true }).loadPending(2);
    expect(pending.decisions.map((row: { id: string }) => row.id)).toEqual(['retry', 'fresh']);
    expect(filters).toEqual([{ column: 'action_ref',
      pattern: '{"routerStatus":"retryable"%' }]);
  });

  it('uses only the explicitly supplied preview origin for acceptance revalidation', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    await requestLiveRevalidation({ origin: 'https://preview.example', secret: 'fixture-secret',
      eraId: 'tloas', fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(new URL('https://preview.example/api/revalidate-live'),
      expect.objectContaining({ method: 'POST' }));
  });
});
