import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { classifierStore } from './classifier-store.mjs';

type Decision = { item_id: string; shadow: boolean };

describe('classifierStore', () => {
  it('uses the conflict-safe shadow insert and stays idempotent per watch_item', async () => {
    const inserted: Decision[] = [];
    const client = {
      from: () => ({ select: () => ({ in: async (_column: string, ids: string[]) => ({
        data: inserted.filter((row) => ids.includes(row.item_id)), error: null,
      }) }) }),
      rpc: vi.fn(async (_name: string, { decision_rows: rows }: { decision_rows: Decision[] }) => {
        const fresh = rows.filter((row) => !inserted.some((old) => old.item_id === row.item_id));
        inserted.push(...fresh);
        return { data: fresh, error: null };
      }),
    };
    const store = classifierStore(client);
    await store.insertDecisions([{ item_id: 'a', shadow: true }]);
    await store.insertDecisions([{ item_id: 'a', shadow: true }]);
    expect(inserted).toEqual([{ item_id: 'a', shadow: true }]);
    expect(client.rpc).toHaveBeenCalledWith('insert_shadow_watch_decisions', {
      decision_rows: [{ item_id: 'a', shadow: true }],
    });
  });
});
