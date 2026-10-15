import { describe, expect, it } from 'vitest';
import { killEvent, listPendingEvents } from './notifications-kill.mjs';

function fakeDb() {
  const events = new Map();
  const deliveredEventIds = new Set();
  return {
    _events: events,
    _deliveredEventIds: deliveredEventIds,
    from(table) {
      if (table !== 'events') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          is: () => ({
            not: () => ({
              order: async () => ({
                data: [...events.values()].filter(
                  (e) => !e.killed_at && !deliveredEventIds.has(e.id),
                ),
                error: null,
              }),
            }),
          }),
        }),
        update: (patch) => ({
          eq: (_col, id) => ({
            is: () => ({
              not: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    const row = events.get(id);
                    if (!row || row.killed_at || deliveredEventIds.has(id)) {
                      return { data: null, error: null };
                    }
                    Object.assign(row, patch);
                    return { data: row, error: null };
                  },
                }),
              }),
            }),
          }),
        }),
      };
    },
  };
}

describe('listPendingEvents', () => {
  it('selects undelivered events from every tier regardless of available_at', async () => {
    const db = fakeDb();
    const now = new Date('2026-01-01T12:00:00Z');
    db._events.set('e1', {
      id: 'e1',
      category: 'song_drop',
      tier: 1,
      title: 'New song',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      created_at: now.toISOString(),
      killed_at: null,
    });
    db._events.set('e2', {
      id: 'e2',
      category: 'official_merch',
      tier: 2,
      title: 'Merch drop',
      available_at: new Date(now.getTime() - 120_000).toISOString(),
      created_at: now.toISOString(),
      killed_at: null,
    });
    db._events.set('e3', {
      id: 'e3',
      category: 'award_news',
      tier: 3,
      title: 'Award news',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      created_at: now.toISOString(),
      killed_at: null,
    });
    db._events.set('e4', {
      id: 'e4',
      category: 'song_drop',
      tier: 1,
      title: 'Already sent',
      available_at: new Date(now.getTime() - 120_000).toISOString(),
      created_at: now.toISOString(),
      killed_at: null,
    });
    db._deliveredEventIds.add('e4');
    const pending = await listPendingEvents(db, now);
    expect(pending.map((event) => event.id)).toEqual(['e1', 'e2', 'e3']);
  });
});

describe('killEvent', () => {
  it('sets killed_at on a pending event', async () => {
    const db = fakeDb();
    const now = new Date('2026-01-01T12:01:00Z');
    db._events.set('e1', {
      id: 'e1',
      category: 'song_drop',
      title: 'New song',
      available_at: new Date(now.getTime() + 60_000).toISOString(),
      killed_at: null,
    });
    const killed = await killEvent(db, 'e1', now);
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

  it('kills an undelivered event after its kill window closes', async () => {
    const db = fakeDb();
    const now = new Date('2026-01-01T12:01:00Z');
    db._events.set('e1', {
      id: 'e1',
      category: 'award_news',
      title: 'Award news',
      available_at: new Date(now.getTime() - 1).toISOString(),
      killed_at: null,
    });
    await expect(killEvent(db, 'e1', now)).resolves.toMatchObject({ id: 'e1' });
  });

  it('refuses to kill an event that already has a delivery', async () => {
    const db = fakeDb();
    db._events.set('e1', {
      id: 'e1',
      category: 'award_news',
      title: 'Award news',
      available_at: new Date().toISOString(),
      killed_at: null,
    });
    db._deliveredEventIds.add('e1');
    await expect(killEvent(db, 'e1')).rejects.toThrow(/no pending event/);
  });
});
