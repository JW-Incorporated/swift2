import { describe, expect, it, vi } from 'vitest';
import { insertEvent, T1_CATEGORIES, T1_SEND_DELAY_MS } from './notification-events';
import type { SupabaseClient } from '@supabase/supabase-js';

function fakeDb(onInsert: (row: Record<string, unknown>) => { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn(async () => onInsert(lastRow));
  let lastRow: Record<string, unknown> = {};
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const insert = vi.fn((row: Record<string, unknown>) => {
    lastRow = row;
    return { select };
  });
  const from = vi.fn().mockReturnValue({ insert });
  return { from, insert, maybeSingle } as unknown as SupabaseClient & {
    insert: typeof insert;
  };
}

describe('insertEvent', () => {
  it('applies the T1 5-minute delay for song_drop/album_news/tour_news', async () => {
    const now = new Date('2026-01-15T12:00:00Z');
    for (const category of T1_CATEGORIES) {
      const db = fakeDb(() => ({ data: { id: 'evt-1' }, error: null }));
      const result = await insertEvent(db, {
        category,
        title: 'x',
        body: 'y',
        deepLink: 'https://example.com',
        dedupeKey: `test:${category}`,
        now,
      });
      expect(result.availableAt).toBe(new Date(now.getTime() + T1_SEND_DELAY_MS).toISOString());
      expect(result.tier).toBe(1);
    }
  });

  it('non-T1 categories are available immediately (available_at = now)', async () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const db = fakeDb(() => ({ data: { id: 'evt-1' }, error: null }));
    const result = await insertEvent(db, {
      category: 'official_merch',
      title: 'x',
      body: 'y',
      deepLink: 'https://example.com',
      dedupeKey: 'test:official_merch',
      now,
    });
    expect(result.availableAt).toBe(now.toISOString());
    expect(result.tier).toBe(2);
  });

  it('DEDUPE: a duplicate dedupe_key (unique_violation) is reported as deduped, not thrown', async () => {
    const db = fakeDb(() => ({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    }));
    const result = await insertEvent(db, {
      category: 'song_drop',
      title: 'x',
      body: 'y',
      deepLink: 'https://example.com',
      dedupeKey: 'song_drop:same-key',
    });
    expect(result).toEqual(expect.objectContaining({ id: null, deduped: true }));
  });

  it('rethrows a non-duplicate DB error', async () => {
    const db = fakeDb(() => ({
      data: null,
      error: { code: '42P01', message: 'relation does not exist' },
    }));
    await expect(
      insertEvent(db, {
        category: 'song_drop',
        title: 'x',
        body: 'y',
        deepLink: 'https://example.com',
        dedupeKey: 'song_drop:x',
      }),
    ).rejects.toThrow('relation does not exist');
  });

  it('ACCEPTANCE: inserting the same event twice — second call deduped, only one real insert reaches success', async () => {
    let inserted = false;
    const db = fakeDb(() => {
      if (inserted) {
        return { data: null, error: { code: '23505', message: 'duplicate key' } };
      }
      inserted = true;
      return { data: { id: 'evt-1' }, error: null };
    });
    const input = {
      category: 'song_drop' as const,
      title: 'New song',
      body: 'It\u2019s out now',
      deepLink: 'https://example.com',
      dedupeKey: 'song_drop:catalog-id-123',
    };
    const first = await insertEvent(db, input);
    const second = await insertEvent(db, input);
    expect(first.deduped).toBe(false);
    expect(first.id).toBe('evt-1');
    expect(second.deduped).toBe(true);
    expect(second.id).toBeNull();
  });
});
