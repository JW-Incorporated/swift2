import { describe, expect, it, vi } from 'vitest';
import { emitOfficialMerchEvent } from './emit-official-merch-event.mjs';

function fakeDb() {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'evt-1' }, error: null }),
    }),
  });
  return { from: vi.fn().mockReturnValue({ insert }), _insert: insert };
}

describe('emitOfficialMerchEvent', () => {
  it('does nothing when there are no products', async () => {
    const db = fakeDb();
    const result = await emitOfficialMerchEvent({ products: [] }, { db });
    expect(result).toEqual({ emitted: false, reason: 'no-products' });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('does nothing when db is not configured', async () => {
    const result = await emitOfficialMerchEvent({ products: [{ sourceId: '1', item: 'Tee' }] });
    expect(result).toEqual({ emitted: false, reason: 'no-db-client' });
  });

  it('inserts one official_merch event for a batch of new products', async () => {
    const db = fakeDb();
    const now = new Date('2026-09-01T12:00:00Z');
    const result = await emitOfficialMerchEvent(
      {
        products: [
          { sourceId: '1', item: '1989 crewneck' },
          { sourceId: '2', item: 'Tote bag' },
        ],
      },
      { db, now },
    );
    expect(result.emitted).toBe(true);
    expect(db.from).toHaveBeenCalledWith('events');
    expect(db._insert).toHaveBeenCalledTimes(1);
    const row = db._insert.mock.calls[0][0];
    expect(row.category).toBe('official_merch');
    expect(row.title).toBe('New in the official store');
    expect(row.body).toContain('1989 crewneck');
    expect(row.dedupe_key).toBe('official_merch:2026-09-01:1|2');
  });

  it('produces the SAME dedupe_key for the same product set + day (idempotent on re-run)', async () => {
    const now = new Date('2026-09-01T12:00:00Z');
    const products = [
      { sourceId: '2', item: 'Tote bag' },
      { sourceId: '1', item: '1989 crewneck' },
    ];
    const db1 = fakeDb();
    const db2 = fakeDb();
    await emitOfficialMerchEvent({ products }, { db: db1, now });
    await emitOfficialMerchEvent({ products }, { db: db2, now });
    const key1 = db1._insert.mock.calls[0][0].dedupe_key;
    const key2 = db2._insert.mock.calls[0][0].dedupe_key;
    expect(key1).toBe(key2);
  });
});
