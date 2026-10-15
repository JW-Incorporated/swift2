import { describe, expect, it } from 'vitest';
import { killEvent, listPendingEvents } from './notifications-kill.mjs';

function fakeDb() {
  const events = new Map();
  return {
    _events: events,
    from(table) {
      if (table !== 'events') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          is: () => ({
            gt: (_col, cutoff) => ({
              order: async () => ({
                data: [...events.values()].filter(
                  (e) => !e.killed_at && e.available_at > cutoff,
                ),
                error: null,
              }),
            }),
          }),
        }),
        update: (patch) => ({
          eq: (_col, id) => ({
            is: () => ({
              gt: (_availableCol, cutoff) => ({
                select: () => ({
                  maybeSingle: async () => {
                    const row = events.get(id);
                    if (!row || row.killed_at || row.available_at <= cutoff) {
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
  it('selects pending events from every tier within their kill window', async () => {
    const db = fakeDb();
    const now = new Date('2026-01-01T12:00:00Z');
    db._events.set('e1', {
      id: 'e1',
      category: 'song_drop',
      tier: 1,
      title: 'New song',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      killed_at: null,
    });
    db._events.set('e2', {
      id: 'e2',
      category: 'official_merch',
      tier: 2,
      title: 'Merch drop',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      killed_at: null,
    });
    db._events.set('e3', {
      id: 'e3',
      category: 'award_news',
      tier: 3,
      title: 'Award news',
      available_at: new Date(now.getTime() + 120_000).toISOString(),
      killed_at: null,
    });
    const pending = await listPendingEvents(db, now);
    expect(pending.map((event) => event.id)).toEqual(['e1', 'e2', 'e3']);
    expect(pending.every((event) => event.secondsUntilSend === 120)).toBe(true);
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

  it('refuses to kill an event after its kill window closes', async () => {
    const db = fakeDb();
    const now = new Date('2026-01-01T12:01:00Z');
    db._events.set('e1', {
      id: 'e1',
      category: 'award_news',
      title: 'Award news',
      available_at: new Date(now.getTime() - 1).toISOString(),
      killed_at: null,
    });
    await expect(killEvent(db, 'e1', now)).rejects.toThrow(/no pending event/);
  });
});
