import { describe, expect, it } from 'vitest';
import { runCollector } from './collect.mjs';
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
  const cursors = new Map<string, { at: string; key: string }>();
  let failTimeline = false;
  return {
    keys,
    cursors,
    set failTimeline(value: boolean) { failTimeline = value; },
    getCursor: async (source: string) => cursors.get(source) ?? null,
    existingKeys: async (wanted: string[]) => new Set(wanted.filter((key) => keys.has(key))),
    upsertItems: async (rows: Array<{ item_key: string }>) => rows.forEach((row) => keys.add(row.item_key)),
    upsertTimelines: async () => { if (failTimeline) throw new Error('timeline failed'); },
    setCursor: async (source: string, cursor: { at: string; key: string }) => { cursors.set(source, cursor); },
  };
}

describe('Tidewatch collector', () => {
  it('does not advance a cursor when an upsert fails midway', async () => {
    const store = fakeStore();
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
});
