import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { createSiteAction, requestLiveRevalidation } from './actions/site.mjs';
// @ts-expect-error plain .mjs module
import { routeDecisions } from './route.mjs';
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
  };
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

  it('uses only the explicitly supplied preview origin for acceptance revalidation', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    await requestLiveRevalidation({ origin: 'https://preview.example', secret: 'fixture-secret',
      eraId: 'tloas', fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(new URL('https://preview.example/api/revalidate-live'),
      expect.objectContaining({ method: 'POST' }));
  });
});
