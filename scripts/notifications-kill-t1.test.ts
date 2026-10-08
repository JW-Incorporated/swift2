import { describe, expect, it } from 'vitest';
import { listPendingT1, killEvent } from './notifications-kill-t1.mjs';

function fakeDb() {
  const events = new Map();
  return {
    _events: events,
    from(table) {
      if (table !== 'events') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          in: (_col, cats) => ({
            is: () => ({
              gt: () => ({
                order: async () => ({
                  data: [...events.values()].filter(
                    (e) => cats.includes(e.category) && !e.killed_at,
                  ),
                  error: null,
                }),
              }),
            }),
          }),
        }),
        update: (patch) => ({
          eq: (_col, id) => ({
            is: () => ({
              select: () => ({
                maybeSingle: async () => {
                  const row = events.get(id);
                  if (!row || row.killed_at) return { data: null, error: null };
                  Object.assign(row, patch);
                  return { data: row, error: null };
                },
              }),
            }),
          }),
        }),
      };
    },
  };
}

describe('listPendingT1', () => {
  it('lists only un-killed T1 events with a future available_at', async () => {
    const db = fakeDb();
    const now = new Date('2026-01-01T12:00:00Z');
    db._events.set('e1', {
      id: 'e1',
      category: 'song_drop',
      title: 'New song',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      killed_at: null,
    });
    db._events.set('e2', {
      id: 'e2',
      category: 'official_merch', // not T1
      title: 'Merch drop',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      killed_at: null,
    });
    const pending = await listPendingT1(db, now);
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('e1');
    expect(pending[0].secondsUntilSend).toBe(120);
  });
});

describe('killEvent', () => {
  it('sets killed_at on a pending event', async () => {
    const db = fakeDb();
    db._events.set('e1', {
      id: 'e1',
      category: 'song_drop',
      title: 'New song',
      available_at: new Date().toISOString(),
      killed_at: null,
    });
    const killed = await killEvent(db, 'e1', new Date('2026-01-01T12:01:00Z'));
    expect(killed.id).toBe('e1');
    expect(db._events.get('e1').killed_at).toBe('2026-01-01T12:01:00.000Z');
  });

  it('throws when the event is already killed (or does not exist)', async () => {
    const db = fakeDb();
    db._events.set('e1', {
      id: 'e1',
      category: 'song_drop',
      title: 'New song',
      available_at: new Date().toISOString(),
      killed_at: '2026-01-01T00:00:00Z',
    });
    await expect(killEvent(db, 'e1')).rejects.toThrow(/no pending event/);
    await expect(killEvent(db, 'does-not-exist')).rejects.toThrow(/no pending event/);
  });
});
