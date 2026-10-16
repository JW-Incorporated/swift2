import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { runMerchAction } from './merch.mjs';

const now = new Date('2026-10-15T12:00:00.000Z');
const outfit = {
  id: 'decision-outfit', class: 'merch_outfit', decided_at: now.toISOString(),
  watch_item: { source_ref: JSON.stringify({
    moment: { id: 'vault-lover-replayed-look', title: 'Replayed look' },
    momentImageUrl: 'https://images.example/replayed-look.jpg',
  }) },
};

function dedupingDb() {
  const keys = new Set<string>();
  const actionRefs = new Map<string, string>();
  const insert = vi.fn((row: { dedupe_key: string }) => ({
    select: () => ({
      maybeSingle: async () => {
        if (keys.has(row.dedupe_key)) {
          return { data: null, error: { code: '23505', message: 'duplicate' } };
        }
        keys.add(row.dedupe_key);
        return { data: { id: `event-${keys.size}` }, error: null };
      },
    }),
  }));
  const update = vi.fn((values: { action_ref: string }) => ({
    eq: (_column: string, id: string) => ({
      is: () => ({
        select: async () => {
          if (actionRefs.has(id)) return { data: [], error: null };
          actionRefs.set(id, values.action_ref);
          return { data: [{ id }], error: null };
        },
      }),
    }),
  }));
  const from = vi.fn((table: string) => table === 'watch_decision' ? { update } : { insert });
  return { from, insert, update, keys, actionRefs };
}

describe('Tidewatch merch actions', () => {
  it('records live outfit and fan decisions only as action_ref', async () => {
    const db = dedupingDb();
    await runMerchAction(outfit, { live: true, db });
    await runMerchAction({
      id: 'decision-fan', class: 'merch_fan', decided_at: now.toISOString(),
      watch_item: { source_ref: 'listing-1', title: 'Handmade bracelet', excerpt: 'Seller' },
    }, { live: true, db });
    expect(db.actionRefs).toEqual(new Map([
      ['decision-outfit', 'outfit_matcher_queue'],
      ['decision-fan', 'fan_merch_curation'],
    ]));
    expect(db.update).toHaveBeenNthCalledWith(1, { action_ref: 'outfit_matcher_queue' });
    expect(db.update).toHaveBeenNthCalledWith(2, { action_ref: 'fan_merch_curation' });
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it('confirms the store-drop draft and dedupes the T2 event when live', async () => {
    const db = dedupingDb();
    const loadStoreDropDraft = vi.fn(async () => ({
      products: [{ sourceId: 'drop-1', item: 'Cardigan' }],
    }));
    const decision = { id: 'decision-official', class: 'merch_official' };
    const first = await runMerchAction(decision, { live: true, db, now, loadStoreDropDraft });
    const second = await runMerchAction(decision, { live: true, db, now, loadStoreDropDraft });
    expect(first).toMatchObject({ draftConfirmed: true, event: { emitted: true } });
    expect(second).toMatchObject({ draftConfirmed: true, event: { emitted: false, deduped: true } });
    expect(loadStoreDropDraft).toHaveBeenCalledTimes(2);
    expect(db.keys.size).toBe(1);
  });

  it('keeps every merch effect behind the live argument', async () => {
    const loadStoreDropDraft = vi.fn();
    const emitOfficial = vi.fn();
    const recordAction = vi.fn();
    for (const classId of ['merch_outfit', 'merch_fan', 'merch_official']) {
      await expect(runMerchAction({ ...outfit, class: classId }, {
        live: false, loadStoreDropDraft, emitOfficial, recordAction,
      })).resolves.toEqual({ acted: false, reason: 'router-not-live' });
    }
    expect(loadStoreDropDraft).not.toHaveBeenCalled();
    expect(emitOfficial).not.toHaveBeenCalled();
    expect(recordAction).not.toHaveBeenCalled();
  });
});
