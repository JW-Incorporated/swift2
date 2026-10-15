import { describe, expect, it } from 'vitest';
import { liveSources, LOOKUP_PAGE, runCollector, supabaseStore } from './collect.mjs';
import { watchCandidate } from './fingerprint.mjs';

const candidate = watchCandidate({
  itemKey: 'issue:1',
  source: 'intake',
  sourceRef: '1',
  title: 'Test issue',
  detectedAt: '2026-10-15T18:00:00.000Z',
});

function fakeStore() {
  const keys = new Set<string>();
  const items = new Map<string, Record<string, unknown>>();
  const cursors = new Map<string, { at: string; key: string }>();
  const timelines: unknown[] = [];
  let failTimeline = false;
  return {
    keys,
    items,
    cursors,
    timelines,
    set failTimeline(value: boolean) { failTimeline = value; },
    getCursor: async (source: string) => cursors.get(source) ?? null,
    existingKeys: async (wanted: string[]) => new Set(wanted.filter((key) => keys.has(key))),
    sourceHasItems: async (source: string) => [...items.values()].some((row) => row.source === source),
    upsertItems: async (rows: Array<{ item_key: string } & Record<string, unknown>>) => rows.forEach((row) => { keys.add(row.item_key); items.set(row.item_key, row); }),
    upsertTimelines: async (rows: unknown[]) => { if (failTimeline) throw new Error('timeline failed'); timelines.push(...rows); },
    setCursor: async (source: string, cursor: { at: string; key: string }) => { cursors.set(source, cursor); },
  };
}

describe('Tidewatch collector', () => {
  it('does not advance a cursor when an upsert fails midway', async () => {
    const store = fakeStore();
    store.items.set('existing', { source: 'intake' });
    store.failTimeline = true;
    const result = await runCollector([{ name: 'intake', load: async () => [candidate] }], store, {
      since: '2026-10-15T00:00:00.000Z',
      log: () => {},
    });
    expect(result[0].errors).toBe(1);
    expect(store.cursors.has('intake')).toBe(false);
    store.failTimeline = false;
    const retry = await runCollector([{ name: 'intake', load: async () => [candidate] }], store, {
      since: '2026-10-15T00:00:00.000Z',
      log: () => {},
    });
    expect(retry[0].errors).toBe(0);
    expect(store.cursors.has('intake')).toBe(true);
  });

  it('inserts no new row when the same window is rerun', async () => {
    const store = fakeStore();
    const source = { name: 'intake', load: async () => [candidate] };
    const first = await runCollector([source], store, { since: '2026-10-15T00:00:00.000Z', log: () => {} });
    const second = await runCollector([source], store, { since: '2026-10-15T00:00:00.000Z', log: () => {} });
    expect(first[0].inserted).toBe(1);
    expect(second[0].inserted).toBe(0);
    expect(store.keys.size).toBe(1);
  });

  it('advances past every event when several events collapse to one item key', async () => {
    const store = fakeStore();
    const later = watchCandidate({
      itemKey: 'issue:1',
      cursorKey: 'event-b',
      source: 'intake',
      title: 'Same issue, seen again',
      detectedAt: '2026-10-15T19:00:00.000Z',
    });
    await runCollector([{ name: 'intake', load: async () => [candidate, later] }], store, {
      since: '2026-10-15T00:00:00.000Z',
      log: () => {},
    });
    expect(store.keys.size).toBe(1);
    expect(store.cursors.get('intake')).toEqual({ at: later.cursorAt, key: 'event-b' });
  });

  it('ignores the since floor when a saved cursor is older than 24 hours', async () => {
    const store = fakeStore();
    store.cursors.set('news', { at: '2026-10-12T00:00:00.000Z', key: 'news:0' });
    const oldItem = watchCandidate({
      itemKey: 'news:old-but-unread',
      source: 'news',
      title: 'Missed during outage',
      detectedAt: '2026-10-13T00:00:00.000Z',
    });
    let loadSince = '';
    const result = await runCollector([{
      name: 'news',
      cursorMode: 'overlap',
      load: async (since: string) => { loadSince = since; return [oldItem]; },
    }], store, {
      since: '2026-10-14T00:00:00.000Z',
      log: () => {},
    });
    expect(loadSince).toBe('2026-10-11T23:45:00.000Z');
    expect(result[0]).toMatchObject({ read: 1, inserted: 1, errors: 0 });
  });

  it('replays a 15-minute overlap for late database rows without regressing the cursor', async () => {
    const store = fakeStore();
    store.cursors.set('theory', { at: '2026-10-15T18:00:00.000Z', key: 'theory:z' });
    const late = watchCandidate({
      itemKey: 'theory:late',
      source: 'theory',
      title: 'Late landed theory',
      detectedAt: '2026-10-15T17:55:00.000Z',
    });
    const result = await runCollector([{
      name: 'theory',
      cursorMode: 'overlap',
      load: async () => [late],
    }], store, { since: '2026-10-15T00:00:00.000Z', log: () => {} });
    expect(result[0].inserted).toBe(1);
    expect(store.cursors.get('theory')).toEqual({ at: '2026-10-15T18:00:00.000Z', key: 'theory:z' });
  });

  it('uses no cursor or time floor for file and GitHub full reloads', async () => {
    const store = fakeStore();
    store.cursors.set('moments', { at: '2026-10-15T00:00:00.000Z', key: 'stale' });
    store.cursors.set('intake', { at: '2026-10-15T00:00:00.000Z', key: 'stale' });
    const fileItem = watchCandidate({ itemKey: 'moment:debut:old', source: 'moment', title: 'Old moment', detectedAt: '2020-01-01T00:00:00.000Z' });
    const issueItem = watchCandidate({ itemKey: 'issue:old', source: 'intake', title: 'Old issue labelled today', detectedAt: '2020-01-01T00:00:00.000Z' });
    const results = await runCollector([
      { name: 'moments', cursorMode: 'none', load: async () => [fileItem] },
      { name: 'intake', cursorMode: 'none', load: async () => [issueItem] },
    ], store, { since: '2026-10-15T00:00:00.000Z', log: () => {} });
    expect(results.map((result) => result.inserted)).toEqual([1, 1]);
    expect(store.cursors.get('moments')?.key).toBe('stale');
    expect(store.cursors.get('intake')?.key).toBe('stale');
  });

  it('orders tied cursor keys by code units', async () => {
    const store = fakeStore();
    const rows = ['Z', 'a'].map((cursorKey) => watchCandidate({
      itemKey: `issue:${cursorKey}`,
      cursorKey,
      source: 'intake',
      title: cursorKey,
      detectedAt: '2026-10-15T18:00:00.000Z',
    }));
    await runCollector([{ name: 'db', cursorMode: 'overlap', load: async () => rows }], store, {
      since: '2026-10-15T00:00:00.000Z',
      log: () => {},
    });
    expect(store.cursors.get('db')?.key).toBe('a');
  });

  it('updates only last_seen_at when an existing item key conflicts', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = {
      from: () => ({
        upsert: async (rows: Array<Record<string, string>>, options: Record<string, unknown>) => {
          calls.push({ action: 'upsert', rows, options });
          return { error: null };
        },
        update: (values: Record<string, string>) => ({
          in: async (column: string, keys: string[]) => {
            calls.push({ action: 'update', values, column, keys });
            return { error: null };
          },
        }),
      }),
    };
    await supabaseStore(client).upsertItems([
      { item_key: 'issue:new', source: 'intake', last_seen_at: '2026-10-15T19:00:00.000Z' },
      { item_key: 'issue:existing', source: 'intake', last_seen_at: '2026-10-15T19:00:00.000Z' },
    ], new Set(['issue:existing']));
    expect(calls[0]).toMatchObject({ action: 'upsert', options: { ignoreDuplicates: true }, rows: [{ item_key: 'issue:new' }] });
    expect(calls[1]).toEqual({
      action: 'update',
      values: { last_seen_at: '2026-10-15T19:00:00.000Z' },
      column: 'item_key',
      keys: ['issue:existing'],
    });
  });

  it('pages updates for existing keys by the lookup limit', async () => {
    const calls: Array<{ values: Record<string, string>; keys: string[] }> = [];
    const client = { from: () => ({
      upsert: async () => ({ error: null }),
      update: (values: Record<string, string>) => ({ in: async (_column: string, keys: string[]) => { calls.push({ values, keys }); return { error: null }; } }),
    }) };
    const rows = Array.from({ length: 1_205 }, (_, index) => ({ item_key: `item:${index}`, source: 'moment', last_seen_at: '2026-10-15T19:00:00.000Z' }));
    await supabaseStore(client).upsertItems(rows, new Set(rows.map((row) => row.item_key)));
    expect(Math.max(...calls.map((call) => call.keys.length))).toBeLessThanOrEqual(LOOKUP_PAGE);
    expect(calls.flatMap((call) => call.keys)).toEqual(rows.map((row) => row.item_key));
    expect(calls.every((call) => Object.keys(call.values).join() === 'last_seen_at')).toBe(true);
  });

  it('baselines the first run without events, then treats new items normally', async () => {
    const store = fakeStore();
    const logs: string[] = [];
    const source = { name: 'intake', watchSource: 'intake', cursorMode: 'none', load: async () => [candidate] };
    await runCollector([source], store, { since: '2026-10-15T00:00:00.000Z', log: (line) => logs.push(line) });
    expect(store.items.get(candidate.item.item_key)?.status).toBe('historical');
    expect(store.timelines).toHaveLength(0);
    expect(logs).toContain('baseline: intake 1');

    const next = watchCandidate({ itemKey: 'issue:2', source: 'intake', title: 'New issue', detectedAt: '2026-10-15T20:00:00.000Z' });
    await runCollector([{ ...source, load: async () => [next] }], store, { since: '2026-10-15T00:00:00.000Z', log: () => {} });
    expect(store.items.get(next.item.item_key)?.status).toBeUndefined();
    expect(store.timelines).toHaveLength(1);
  });

  it('never baselines a source that already has a stored item', async () => {
    const store = fakeStore();
    store.items.set('older', { item_key: 'older', source: 'intake', status: 'historical' });
    const logs: string[] = [];
    await runCollector([{ name: 'intake', watchSource: 'intake', cursorMode: 'none', load: async () => [candidate] }], store, {
      since: '2026-10-15T00:00:00.000Z', log: (line) => logs.push(line),
    });
    expect(store.items.get(candidate.item.item_key)?.status).toBeUndefined();
    expect(store.timelines).toHaveLength(1);
    expect(logs.some((line) => line.startsWith('baseline:'))).toBe(false);
  });

  it('fails git-timestamped sources clearly in a shallow clone and continues', async () => {
    const sources = await liveSources({}, { repositoryIsShallow: async () => true });
    const selected = sources.filter((source) => ['merch-official', 'moments'].includes(source.name));
    const store = fakeStore();
    const results = await runCollector([
      ...selected,
      { name: 'fallback', cursorMode: 'none', load: async () => [candidate] },
    ], store, { since: '2026-10-15T00:00:00.000Z', log: () => {} });
    expect(results.slice(0, 2).map((result) => result.error)).toEqual([
      'merch requires full git history; check out with fetch-depth: 0',
      'moments requires full git history; check out with fetch-depth: 0',
    ]);
    expect(results[2]).toMatchObject({ inserted: 1, errors: 0 });
  });
});
