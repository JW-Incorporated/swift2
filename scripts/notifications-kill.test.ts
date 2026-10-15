import { describe, expect, it } from 'vitest';
import { listPendingEvents, runCli } from './notifications-kill.mjs';

const EVENT_COLUMNS = 'id,tier,title,available_at,created_at,expires_at,killed_at';
const KILLED_EVENT_COLUMNS = 'id,tier,title,available_at,created_at';

function event(id, overrides = {}) {
  return {
    id,
    tier: 2,
    title: `Event ${id}`,
    available_at: '2026-01-01T00:00:00.000Z',
    created_at: `2026-01-01T00:00:0${id.length}.000Z`,
    killed_at: null,
    ...overrides,
  };
}

function fakeDb({ events = [], deliveries = [], maxRows = Infinity } = {}) {
  const rows = new Map(events.map((row) => [row.id, { ...row }]));
  const calls = { deliveryRanges: [], eventRanges: [], updates: [] };

  return {
    _calls: calls,
    _events: rows,
    from(table) {
      expect(['deliveries', 'events']).toContain(table);
      if (table === 'deliveries') {
        return {
          select(columns) {
            expect(columns).toBe('event_id');
            let kindFilter = null;
            let ordered = false;
            return {
              eq(column, value) {
                expect(column).toBe('kind');
                expect(value).toBe('instant');
                kindFilter = value;
                return this;
              },
              order(column, options) {
                expect(column).toBe('id');
                expect(options).toEqual({ ascending: true });
                ordered = true;
                return this;
              },
              async range(from, to) {
                expect(kindFilter).toBe('instant');
                expect(ordered).toBe(true);
                calls.deliveryRanges.push([from, to]);
                const matching = deliveries
                  .filter((row) => row.kind === kindFilter)
                  .sort((a, b) => a.id - b.id);
                return { data: matching.slice(from, Math.min(to + 1, from + maxRows)), error: null };
              },
            };
          },
        };
      }

      return {
        select(columns) {
          expect(columns).toBe(EVENT_COLUMNS);
          let killedFilter;
          const orders = [];
          return {
            is(column, value) {
              expect(column).toBe('killed_at');
              expect(value).toBeNull();
              killedFilter = value;
              return this;
            },
            order(column, options) {
              expect(options).toEqual({ ascending: true });
              orders.push(column);
              return this;
            },
            async range(from, to) {
              expect(killedFilter).toBeNull();
              expect(orders).toEqual(['created_at', 'id']);
              calls.eventRanges.push([from, to]);
              const matching = [...rows.values()]
                .filter((row) => row.killed_at === null)
                .sort(
                  (a, b) =>
                    a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
                );
              return { data: matching.slice(from, Math.min(to + 1, from + maxRows)), error: null };
            },
          };
        },
        update(patch) {
          expect(Object.keys(patch)).toEqual(['killed_at']);
          let ids = null;
          let killedFilter;
          return {
            in(column, values) {
              expect(column).toBe('id');
              expect(values).toEqual([...new Set(values)]);
              ids = values;
              return this;
            },
            is(column, value) {
              expect(column).toBe('killed_at');
              expect(value).toBeNull();
              killedFilter = value;
              return this;
            },
            async select(columns) {
              expect(columns).toBe(KILLED_EVENT_COLUMNS);
              expect(killedFilter).toBeNull();
              expect(ids).not.toBeNull();
              const updated = [];
              for (const id of ids) {
                const row = rows.get(id);
                if (!row || row.killed_at !== null) continue;
                row.killed_at = patch.killed_at;
                updated.push(row);
              }
              calls.updates.push({ ids: [...ids], patch: { ...patch } });
              return { data: updated, error: null };
            },
          };
        },
      };
    },
  };
}

describe('listPendingEvents', () => {
  it('lists every un-killed event without an instant delivery, regardless of time', async () => {
    const db = fakeDb({
      events: [
        event('instant', { tier: 1 }),
        event('countdown', { tier: 3 }),
        event('past', { available_at: '2025-01-01T00:00:00.000Z' }),
        event('killed', { killed_at: '2026-01-01T01:00:00.000Z' }),
        event('expired', { expires_at: '2025-12-31T23:59:59.000Z' }),
      ],
      deliveries: [
        { id: 1, event_id: 'instant', kind: 'instant' },
        { id: 2, event_id: 'countdown', kind: 'fun' },
      ],
    });

    const pending = await listPendingEvents(db, { now: new Date('2026-01-01T00:00:00.000Z') });

    expect(pending.map((row) => row.id)).toEqual(['past', 'countdown']);
    expect(db._calls.updates).toEqual([]);
  });

  it('paginates both queries until an empty page after a short final page', async () => {
    const db = fakeDb({
      events: [event('a'), event('bb'), event('ccc')],
      deliveries: [
        { id: 1, event_id: 'a', kind: 'instant' },
        { id: 2, event_id: 'unrelated-1', kind: 'instant' },
        { id: 3, event_id: 'unrelated-2', kind: 'instant' },
      ],
      maxRows: 1,
    });

    const pending = await listPendingEvents(db, { pageSize: 2 });

    expect(pending.map((row) => row.id)).toEqual(['bb', 'ccc']);
    expect(db._calls.deliveryRanges).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
    expect(db._calls.eventRanges).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
  });
});

describe('runCli', () => {
  it('--list prints every required field', async () => {
    const db = fakeDb({ events: [event('listed', { tier: 3, title: 'Held event' })] });
    const output = [];

    await runCli(db, ['--list'], { log: (line) => output.push(line) });

    expect(output[1]).toBe(
      'id=listed tier=3 title="Held event" available_at=2026-01-01T00:00:00.000Z created_at=2026-01-01T00:00:06.000Z',
    );
  });

  it('defaults --all-pending to a dry-run with no writes', async () => {
    const db = fakeDb({ events: [event('held')] });

    const selected = await runCli(db, ['--kill', '--all-pending'], { log: () => {} });

    expect(selected.map((row) => row.id)).toEqual(['held']);
    expect(db._calls.updates).toEqual([]);
    expect(db._events.get('held').killed_at).toBeNull();
  });

  it('--apply kills exactly the set that --list returns', async () => {
    const now = new Date('2026-01-02T03:04:05.000Z');
    const db = fakeDb({
      events: [
        event('held-a'),
        event('delivered'),
        event('countdown-only'),
        event('already-killed', { killed_at: '2026-01-01T01:00:00.000Z' }),
      ],
      deliveries: [
        { id: 1, event_id: 'delivered', kind: 'instant' },
        { id: 2, event_id: 'countdown-only', kind: 'fun' },
      ],
    });
    const listed = await listPendingEvents(db);

    const killed = await runCli(db, ['--kill', '--all-pending', '--apply'], { now, log: () => {} });

    expect(killed.map((row) => row.id)).toEqual(listed.map((row) => row.id));
    expect(db._calls.updates).toEqual([
      {
        ids: listed.map((row) => row.id),
        patch: { killed_at: now.toISOString() },
      },
    ]);
    expect(db._events.get('delivered').killed_at).toBeNull();
    expect(db._events.get('countdown-only').killed_at).toBe(now.toISOString());
  });
});
