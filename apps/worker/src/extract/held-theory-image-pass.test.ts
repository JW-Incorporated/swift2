import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const emit = vi.hoisted(() => vi.fn());
vi.mock('./write-knowledge', () => ({ emitEasterEggEvent: emit }));

import { reresolveHeldTheoryImages } from './held-theory-image-pass';

type Row = Record<string, unknown>;

function fakeDb(theories: Row[], items: Row[]) {
  const theoryUpdates: { patch: Row; id: unknown }[] = [];
  const docUpdates: { patch: Row; id: unknown }[] = [];
  let orderConfig: Array<{ column: string; ascending: boolean }> = [];
  let imageNullFilter = false;

  const db = {
    from: (table: string) => {
      if (table === 'live_theory') {
        return {
          select: () => {
            const q: Record<string, unknown> = {};
            const chainMethod = (name: string) => {
              if (name === 'order') {
                return (...args: unknown[]) => {
                  // .order(col, { ascending: false }) or chained .order(col, ...)
                  const col = typeof args[0] === 'string' ? args[0] : args[0];
                  const opts = typeof args[0] === 'object' ? null : (args[1] as { ascending?: boolean });
                  const column = String(col);
                  const ascending = opts ? opts.ascending !== false : true;
                  orderConfig.push({ column, ascending });
                  return q;
                };
              }
              if (name === 'is') {
                return (col: string, val: unknown) => {
                  if (col === 'image_url' && val === null) imageNullFilter = true;
                  return q;
                };
              }
              return () => q;
            };
            for (const m of ['is', 'eq', 'neq', 'gt', 'not']) q[m] = chainMethod(m);
            q.order = chainMethod('order');
            q.range = (from: number, to: number) => {
              let rows = theories.map((r) => ({ ...r }));
              if (imageNullFilter) rows = rows.filter((r) => (r.image_url as string | null | undefined) == null);
              rows.sort((a, b) => {
                for (const { column, ascending } of orderConfig) {
                  const va = (a[column] as string | number | undefined) ?? '';
                  const vb = (b[column] as string | number | undefined) ?? '';
                  const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                  if (cmp !== 0) return ascending ? cmp : -cmp;
                }
                return 0;
              });
              return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
            };
            return q;
          },
          update: (patch: Row) => {
            const c: Record<string, unknown> = {};
            c.eq = (_col: string, id: unknown) => {
              theoryUpdates.push({ patch, id });
              c._eqId = id;
              return c;
            };
            c.is = (col: string, val: unknown) => {
              if (col === 'image_url' && val === null) {
                // Mark as image-null update so the mock can simulate races
                (c as any)._imageNullFilter = true;
                return c;
              }
              return c;
            };
            c.then = (resolve: (v: unknown) => void) => {
              // Simulate that the update actually affected a row (data: [row]).
              // A race test can override via (c as any)._forceRowCount.
              const row = c._id ?? c._eqId ?? 'unknown';
              const rowCount = (c as any)._forceRowCount !== undefined ? (c as any)._forceRowCount : 1;
              resolve({ data: Array(rowCount).fill({ id: row }), error: null });
            };
            return c;
          },
        };
      }
      if (table === 'current_item') {
        return {
          select: () => {
            const q: Record<string, unknown> = {};
            q.in = () => q;
            q.eq = () => q;
            q.is = () => q;
            q.then = (resolve: (v: unknown) => void) => resolve({ data: items, error: null });
            return q;
          },
        };
      }
      if (table === 'knowledge_doc') {
        return {
          update: (patch: Row) => ({
            eq: (_c: string, id: unknown) => {
              docUpdates.push({ patch, id });
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
  return { db, theoryUpdates, docUpdates, setNextUpdateResult: (updated: number) => ((db as any)._nextUpdated = updated) };
}

describe('reresolveHeldTheoryImages', () => {
  beforeEach(() => {
    emit.mockReset();
    vi.clearAllMocks();
  });

  it('adopts the first cited current_item image that passes and un-hides the theory', async () => {
    const { db, theoryUpdates, docUpdates } = fakeDb(
      [{ id: 't1', name: 'T One', claim: 'c', evidence_ids: ['current:bad', 'current:good'], last_seen_on: '2025-01-01', image_url: null }],
      [
        { id: 'bad', image_url: 'https://evil.example.com/a.jpg' },
        { id: 'good', image_url: 'https://www.people.com/photo.jpg' },
      ],
    );
    const result = await reresolveHeldTheoryImages(db);
    expect(result).toEqual({ checked: 1, published: 1, errors: [] });
    expect(theoryUpdates[0]).toEqual({
      id: 't1',
      patch: { image_url: 'https://www.people.com/photo.jpg', quality_hold_reason: null },
    });
    expect(docUpdates[0]).toEqual({ id: 'ltheory:t1', patch: { redline_ok: true } });
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(db, 't1', expect.objectContaining({ name: 'T One', claim: 'c' }));
  });

  it('leaves a theory hidden when it has no evidence or no evidence image passes', async () => {
    const { db, theoryUpdates } = fakeDb(
      [
        { id: 'legacy', name: 'L', claim: 'c', evidence_ids: [], last_seen_on: '2025-01-01' },
        { id: 'offlist', name: 'O', claim: 'c', evidence_ids: ['current:bad'], last_seen_on: '2025-01-01' },
      ],
      [{ id: 'bad', image_url: 'https://evil.example.com/a.jpg' }],
    );
    const result = await reresolveHeldTheoryImages(db);
    // "legacy" has no evidence (skipped entirely, not checked); "offlist" cites a
    // non-allowlisted item so it IS checked but not adopted.
    expect(result).toEqual({ checked: 1, published: 0, errors: [] });
    expect(theoryUpdates).toHaveLength(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it('still adopts an adoptable theory sitting behind more than 25 unadoptable ones', async () => {
    const unadoptable = Array.from({ length: 30 }, (_, i) => ({
      id: `u${i}`,
      name: 'U',
      claim: 'c',
      evidence_ids: i % 2 ? [] : ['current:bad'],
      last_seen_on: `2025-01-${String(20 - i).padStart(2, '0')}`,
    }));
    const { db, theoryUpdates } = fakeDb(
      [...unadoptable, { id: 'late', name: 'Late', claim: 'c', evidence_ids: ['current:good'], last_seen_on: '2025-01-10' }],
      [
        { id: 'bad', image_url: 'https://evil.example.com/a.jpg' },
        { id: 'good', image_url: 'https://www.people.com/photo.jpg' },
      ],
    );
    const result = await reresolveHeldTheoryImages(db);
    expect(result.published).toBe(1);
    expect(theoryUpdates.map((u) => u.id)).toEqual(['late']);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('restarts the scan from page 0 after publishing and still finds later adoptable theories', async () => {
    // Two theories both have valid images. The first one found (most recent last_seen_on)
    // gets published, then the scan restarts from the beginning and picks up the second
    // one. Without restart-on-publish, the second theory would sit on a later page and
    // never be found (the old page-based cap would stop before reaching it).
    const theories = [
      // The "older" one (lower last_seen_on) — but because we restart, it gets picked up
      { id: 'older', name: 'Older', claim: 'c', evidence_ids: ['current:older'], last_seen_on: '2025-01-01' },
      // The "newer" one — picked up first, restarts scan
      { id: 'newer', name: 'Newer', claim: 'c', evidence_ids: ['current:newer'], last_seen_on: '2025-01-10' },
    ];
    const { db, theoryUpdates } = fakeDb(
      theories,
      [
        { id: 'older', image_url: 'https://www.people.com/older.jpg' },
        { id: 'newer', image_url: 'https://www.people.com/newer.jpg' },
      ],
    );
    const result = await reresolveHeldTheoryImages(db);
    expect(result.published).toBe(2);
    // Both theories should be in updates
    expect(theoryUpdates.map((u) => u.id).sort()).toEqual(['newer', 'older']);
    // Each triggers one emit
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('continues scanning when a row matches but fails to update (image-null guard)', async () => {
    // Simulates a race: the query finds a row with image_url IS NULL, but when we try to
    // update it (also with is('image_url', null) guard), another process already set an
    // image_url. The update affects 0 rows — the pass should continue to the next page
    // rather than treating this as "published" and restarting.
    const theories = [
      // Theory that will "fail" to update (already has an image due to race)
      { id: 'racy', name: 'Racy', claim: 'c', evidence_ids: ['current:racy'], last_seen_on: '2025-01-10' },
      // Theory on the next page that should still be found
      { id: 'later', name: 'Later', claim: 'c', evidence_ids: ['current:later'], last_seen_on: '2025-01-05' },
    ];
    const items = [
      { id: 'racy', image_url: 'https://www.people.com/racy.jpg' },
      { id: 'later', image_url: 'https://www.people.com/later.jpg' },
    ];

    const { db, theoryUpdates } = fakeDb(theories, items);

    // Intercept the update call: simulate that the "racy" theory's update affects 0 rows
    // (image_url was already set by another process), while "later" succeeds.
    const originalFrom = db.from.bind(db);
    (db as any).from = (table: string) => {
      const tbl = originalFrom(table);
      if (table === 'live_theory') {
        tbl.update = (patch: Record<string, unknown>) => {
          const c: Record<string, unknown> = {};
          c.eq = (_col: string, id: unknown) => {
            c._eqId = id;
            theoryUpdates.push({ patch, id });
            return c;
          };
          c.is = () => c;
          c.then = (res: (v: unknown) => void) => {
            const id = c._eqId;
            if (id === 'racy') {
              res({ data: [], error: null });
            } else {
              res({ data: [{ id }], error: null });
            }
          };
          return c as unknown as ReturnType<typeof tbl.update>;
        };
      }
      return tbl;
    };
    void originalFrom;

    const result = await reresolveHeldTheoryImages(db);
    // Both theories are checked; racy's update affects 0 rows (lost race) so it
    // is not published, but the update IS attempted. later succeeds.
    expect(result.checked).toBe(2);
    expect(result.published).toBe(1);
    expect(theoryUpdates.map((u) => u.id)).toEqual(['racy', 'later']);
  });
});
