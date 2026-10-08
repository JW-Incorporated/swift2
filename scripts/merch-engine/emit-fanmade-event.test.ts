import { describe, expect, it, vi } from 'vitest';
import { emitFanmadeEvent } from './emit-fanmade-event.mjs';

function fakeDb() {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'evt-1' }, error: null }),
    }),
  });
  return { from: vi.fn().mockReturnValue({ insert }), _insert: insert };
}

describe('emitFanmadeEvent', () => {
  it('does nothing when there are no products', async () => {
    const db = fakeDb();
    const result = await emitFanmadeEvent({ products: [] }, { db });
    expect(result).toEqual({ emitted: false, reason: 'no-products' });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('does nothing when db is not configured', async () => {
    const result = await emitFanmadeEvent({
      products: [{ item: 'Lavender bracelet', url: 'https://www.etsy.com/listing/1' }],
    });
    expect(result).toEqual({ emitted: false, reason: 'no-db-client' });
  });

  it('inserts one fan_merch event for a batch of newly-curated items', async () => {
    const db = fakeDb();
    const now = new Date('2026-09-01T12:00:00Z');
    const result = await emitFanmadeEvent(
      {
        products: [
          { item: 'Lavender lyric bracelet', url: 'https://www.etsy.com/listing/1' },
          { item: 'Folklore cardigan pin', url: 'https://www.etsy.com/listing/2' },
        ],
      },
      { db, now },
    );
    expect(result.emitted).toBe(true);
    expect(db.from).toHaveBeenCalledWith('events');
    expect(db._insert).toHaveBeenCalledTimes(1);
    const row = db._insert.mock.calls[0][0];
    expect(row.category).toBe('fan_merch');
    expect(row.title).toBe('New fan-made merch');
    expect(row.body).toContain('Lavender lyric bracelet');
    expect(row.dedupe_key).toBe(
      'fan_merch:https://www.etsy.com/listing/1|https://www.etsy.com/listing/2',
    );
  });

  it('produces the SAME dedupe_key for the same curated URL set (idempotent on re-run)', async () => {
    const now = new Date('2026-09-01T12:00:00Z');
    const products = [
      { item: 'Folklore cardigan pin', url: 'https://www.etsy.com/listing/2' },
      { item: 'Lavender lyric bracelet', url: 'https://www.etsy.com/listing/1' },
    ];
    const db1 = fakeDb();
    const db2 = fakeDb();
    await emitFanmadeEvent({ products }, { db: db1, now });
    await emitFanmadeEvent({ products }, { db: db2, now });
    const key1 = db1._insert.mock.calls[0][0].dedupe_key;
    const key2 = db2._insert.mock.calls[0][0].dedupe_key;
    expect(key1).toBe(key2);
  });
});
