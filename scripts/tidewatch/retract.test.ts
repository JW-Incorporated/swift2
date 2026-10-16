import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { BOOL_SWITCHES, FREEZE_ON_ONLY, INT_SWITCHES, validate } from '../ops/set-switch.mjs';
import { CORRECTIONS_LIVE_SWITCH, createRetractionStore, main } from './retract.mjs';

function fakeStore({ storyId = 'story-1', recipients = ['device-b', 'device-a', 'device-a'],
  provider = vi.fn() } = {}) {
  const state = {
    currentItems: [
      { id: 'card-1', story_id: storyId, headline: 'Wrong report', status: 'confirmed', redline_ok: true },
    ],
    events: [
      { id: 'event-story', story_id: storyId, title: 'Wrong report', killed_at: null, expires_at: null },
      { id: 'event-other', story_id: 'story-2', title: 'Other story', killed_at: null, expires_at: null },
    ],
    recipients,
    hiddenAt: null as string | null,
    retractionLogged: false,
    correctionEnqueued: false,
    corrections: [] as Array<Record<string, unknown>>,
    calls: { hide: 0, kill: 0, log: 0, enqueue: 0 },
  };
  const store = {
    async inspect(id: string) {
      return {
        currentItems: state.currentItems.filter((item) => item.story_id === id)
          .map((item) => ({ ...item, ['retracted' + '_at']: state.hiddenAt })),
        events: state.events.filter((event) => event.story_id === id),
        recipientDeviceIds: id === storyId ? state.recipients : [],
        watchItemId: 'watch-1',
        retractionLogged: state.retractionLogged,
        correctionEnqueued: state.correctionEnqueued,
      };
    },
    async hideCurrentItems(ids: string[], now: Date) {
      state.calls.hide += 1;
      for (const item of state.currentItems) {
        if (ids.includes(item.id)) {
          item.redline_ok = false;
          state.hiddenAt = now.toISOString();
        }
      }
    },
    async killPendingEvents(events: Array<{ id: string }>) {
      state.calls.kill += 1;
      for (const event of state.events) {
        if (events.some((candidate) => candidate.id === event.id)) event.killed_at = '2026-10-15T12:00:00.000Z';
      }
    },
    async logRetraction() {
      state.calls.log += 1;
      state.retractionLogged = true;
    },
    async enqueueCorrection(event: Record<string, unknown>) {
      state.calls.enqueue += 1;
      state.correctionEnqueued = true;
      state.corrections.push(event);
      await provider(event);
    },
  };
  return { store, state, provider };
}

function fakeRetractionDb() {
  const tables: Record<string, Record<string, unknown>[]> = {
    current_item: [
      { id: 'card-1', story_id: 'story-1', headline: 'Wrong report', status: 'confirmed', redline_ok: true, retracted_at: null, merged_into: null },
      { id: 'card-2', story_id: 'story-2', headline: 'Other report', status: 'reported', redline_ok: true, retracted_at: null, merged_into: null },
    ],
    knowledge_doc: [
      { id: 'current:card-1', redline_ok: true, updated_at: '2026-10-14T12:00:00.000Z' },
      { id: 'current:card-2', redline_ok: true, updated_at: '2026-10-14T12:00:00.000Z' },
    ],
    events: [
      { id: 'event-1', dedupe_key: 'album_news:current_item:card-1', title: 'Wrong report', killed_at: null, expires_at: null },
      { id: 'event-2', dedupe_key: 'album_news:current_item:card-2', title: 'Other report', killed_at: null, expires_at: null },
    ],
    deliveries: [
      { id: 'delivery-1', event_id: 'event-1', device_id: 'device-instant', kind: 'instant' },
      { id: 'delivery-2', event_id: 'event-1', device_id: 'device-fun', kind: 'fun' },
      { id: 'delivery-3', event_id: 'event-2', device_id: 'device-other', kind: 'instant' },
    ],
    watch_item: [
      { id: 'watch-1', story_id: 'story-1', first_seen_at: '2026-10-15T00:00:00.000Z' },
      { id: 'watch-2', story_id: 'story-2', first_seen_at: '2026-10-15T00:00:00.000Z' },
    ],
    watch_decision: [],
  };
  const likePatterns: string[] = [];
  const db = {
    from(table: string) {
      const source = tables[table] ?? [];
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      let rowLimit = Number.POSITIVE_INFINITY;
      let patch: Record<string, unknown> | null = null;
      let inserted: Record<string, unknown> | null = null;
      const matching = () => source.filter((row) => filters.every((filter) => filter(row))).slice(0, rowLimit);
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.push((row) => row[column] === value);
          return query;
        },
        is: (column: string, value: unknown) => {
          filters.push((row) => row[column] === value);
          return query;
        },
        in: (column: string, values: unknown[]) => {
          filters.push((row) => values.includes(row[column]));
          return query;
        },
        like: (column: string, pattern: string) => {
          likePatterns.push(pattern);
          const regex = new RegExp(`^${pattern.split('%').map((part) => (
            part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          )).join('.*')}$`);
          filters.push((row) => regex.test(String(row[column] ?? '')));
          return query;
        },
        order: () => query,
        limit: (limit: number) => {
          rowLimit = limit;
          return query;
        },
        update: (row: Record<string, unknown>) => {
          patch = row;
          return query;
        },
        insert: (row: Record<string, unknown>) => {
          inserted = row;
          return query;
        },
        maybeSingle: async () => ({ data: matching()[0] ?? null, error: null }),
        then: (resolve: (result: { data: Record<string, unknown>[]; error: null }) => void) => {
          const matched = matching();
          if (patch) for (const row of matched) Object.assign(row, patch);
          if (inserted) source.push({ id: `inserted-${source.length + 1}`, ...inserted });
          resolve({ data: matched, error: null });
        },
      };
      return query;
    },
  };
  return { db, tables, likePatterns };
}

const NOW = new Date('2026-10-15T12:00:00.000Z');

describe('Tidewatch retraction', () => {
  it('plan mode mutates nothing', async () => {
    const fake = fakeStore();
    const log = vi.fn();

    const result = await main(['--story-id', 'story-1', '--mode', 'plan'], {
      store: fake.store, now: NOW, log, env: {},
    });

    expect(result.mutated).toBe(false);
    expect(fake.state.calls).toEqual({ hide: 0, kill: 0, log: 0, enqueue: 0 });
    expect(fake.state.currentItems[0]).toMatchObject({ status: 'confirmed', redline_ok: true });
    expect(fake.state.events.every((event) => event.killed_at === null)).toBe(true);
    expect(log.mock.calls.flat().join('\n')).toContain('prior-recipient: device-a');
  });

  it('apply hides the card, kills only that story, and logs once across reruns', async () => {
    const fake = fakeStore();
    const args = ['--story-id', 'story-1', '--mode', 'apply', '--confirm', 'RETRACT-story-1'];
    const deps = { store: fake.store, now: NOW, log: vi.fn(), env: {} };

    await main(args, deps);
    await main(args, deps);

    expect(fake.state.currentItems[0]).toMatchObject({ status: 'confirmed', redline_ok: false });
    expect(fake.state.hiddenAt).toBe(NOW.toISOString());
    expect(fake.state.events.find((event) => event.id === 'event-story')?.killed_at).toBeTruthy();
    expect(fake.state.events.find((event) => event.id === 'event-other')?.killed_at).toBeNull();
    expect(fake.state.calls).toEqual({ hide: 1, kill: 1, log: 1, enqueue: 0 });
  });

  it('correction targets exactly the original prior recipients and switch-off calls no push provider', async () => {
    const off = fakeStore();
    const args = ['--story-id', 'story-1', '--mode', 'apply', '--confirm', 'RETRACT-story-1'];
    await main(args, { store: off.store, now: NOW, log: vi.fn(), env: {} });

    expect(off.state.corrections).toEqual([]);
    expect(off.provider).not.toHaveBeenCalled();

    const live = fakeStore();
    await main(args, {
      store: live.store,
      now: NOW,
      log: vi.fn(),
      env: { [CORRECTIONS_LIVE_SWITCH]: 'true' },
    });

    expect(live.state.corrections).toHaveLength(1);
    expect(live.state.corrections[0]).toMatchObject({
      category: 'correction',
      tier: 1,
      target_device_ids: ['device-a', 'device-b'],
    });
    expect(live.provider).toHaveBeenCalledTimes(1);
  });

  it('uses the real store query to kill only this story and ignores non-instant recipients while switched off', async () => {
    const fake = fakeRetractionDb();
    const store = createRetractionStore(fake.db);
    const provider = vi.fn();
    const enqueueCorrection = store.enqueueCorrection.bind(store);
    store.enqueueCorrection = async (event: Record<string, unknown>) => {
      await provider(event);
      return enqueueCorrection(event);
    };

    const result = await main(
      ['--story-id', 'story-1', '--mode', 'apply', '--confirm', 'RETRACT-story-1'],
      { store, now: NOW, log: vi.fn(), env: {} },
    );

    expect(fake.likePatterns).toEqual(['%:current_item:card-1']);
    expect(result.recipientDeviceIds).toEqual(['device-instant']);
    expect(fake.tables.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'event-1', killed_at: NOW.toISOString() }),
      expect.objectContaining({ id: 'event-2', killed_at: null }),
    ]));
    expect(fake.tables.current_item[0]).toMatchObject({
      status: 'confirmed',
      redline_ok: false,
      retracted_at: NOW.toISOString(),
    });
    expect(fake.tables.knowledge_doc).toEqual([
      { id: 'current:card-1', redline_ok: false, updated_at: NOW.toISOString() },
      { id: 'current:card-2', redline_ok: true, updated_at: '2026-10-14T12:00:00.000Z' },
    ]);
    expect(provider).not.toHaveBeenCalled();
    expect(fake.tables.events.some((event) => event.dedupe_key === 'correction:story:story-1')).toBe(false);
  });

  it('requires the story-bound typed confirmation for apply', async () => {
    const fake = fakeStore();
    await expect(main(['--story-id', 'story-1', '--mode', 'apply'], {
      store: fake.store, now: NOW, log: vi.fn(), env: {},
    })).rejects.toThrow('apply requires --confirm RETRACT-story-1');
    expect(fake.state.calls).toEqual({ hide: 0, kill: 0, log: 0, enqueue: 0 });
  });

  it('keeps the live-corrections switch owner-only and the workflow dispatch-only', async () => {
    expect(validate(CORRECTIONS_LIVE_SWITCH, 'true', 'test')).toContain('founder-only');
    expect(BOOL_SWITCHES.has(CORRECTIONS_LIVE_SWITCH)).toBe(false);
    expect(INT_SWITCHES.has(CORRECTIONS_LIVE_SWITCH)).toBe(false);
    expect(FREEZE_ON_ONLY.has(CORRECTIONS_LIVE_SWITCH)).toBe(false);
    const workflow = await readFile(new URL('../../.github/workflows/tidewatch-retract.yml', import.meta.url), 'utf8');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s*(schedule|push|pull_request|workflow_run):/m);
    expect(workflow).toContain('RETRACT-$STORY_ID');
    expect(workflow).toContain('group: tidewatch-retract-${{ inputs.story_id }}');
  });

  it('replaces the public policy re-apply-safely without weakening its existing conditions', async () => {
    const migration = await readFile(
      new URL('../../supabase/migrations/20261015050000_current_item_retracted_at.sql', import.meta.url),
      'utf8',
    );
    expect(migration).toMatch(/add column if not exists retracted_at timestamptz/i);
    expect(migration).toMatch(/drop policy if exists "current_item public read" on public\.current_item/i);
    expect(migration).toContain(
      'redline_ok = true and (expires_at is null or expires_at > now()) and retracted_at is null',
    );
  });
});
